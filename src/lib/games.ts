import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  generateWordSearch,
  maskHardModeWord,
  normalizeGameWord,
  type CellCoordinate,
  type WordSearchDifficulty,
  type WordSource,
} from "@/lib/wordSearchGenerator";
import {
  expireStaleDailyGameSessions,
  getActiveDailyGame,
  getDailyGameDate,
  getDailyGameDifficultyCycle,
} from "@/lib/dailyGamesPolicy";
import { PUZZLE_GRID_CONFIG, type PuzzleDifficulty } from "@/lib/puzzleGenerator";

// The generated Supabase types predate the incremental game migration. Keep the
// escape hatch isolated here until types are regenerated after the migration.
/* eslint-disable @typescript-eslint/no-explicit-any */

const GAME_KEY = "word_search";
const unavailable = "Este recurso não está disponível para sua conta no momento.";
const difficultySchema = z.enum(["easy", "medium", "hard"]);
const sessionSchema = z.object({ sessionId: z.string().uuid() });
const submitSchema = sessionSchema.extend({
  path: z
    .array(
      z.object({
        row: z.number().int().min(0).max(15),
        col: z.number().int().min(0).max(15),
      }),
    )
    .min(4)
    .max(40),
});

const PUZZLE_GAME_KEY = "puzzle_game";

async function gameAdmin(userId: string, gameKey = GAME_KEY) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const settingKey = `${gameKey}_enabled`;
  const [{ data: setting }, { data: grant }] = await Promise.all([
    admin.from("game_settings").select("value").eq("key", settingKey).maybeSingle(),
    admin
      .from("game_access_grants")
      .select("id")
      .eq("user_id", userId)
      .eq("game_key", gameKey)
      .eq("is_active", true)
      .is("revoked_at", null)
      .maybeSingle(),
  ]);
  const enabled = setting?.value === true;
  return { admin, enabled, authorized: Boolean(grant), available: enabled && Boolean(grant) };
}

function publicSession(session: any, words: any[]) {
  const found = words.filter((word) => word.found_at);
  const visibleWords = words.map((word) => {
    const isFound = Boolean(word.found_at);
    return {
      id: word.id,
      displayWord:
        session.difficulty === "hard" && !isFound
          ? maskHardModeWord(word.display_word)
          : word.display_word,
      category: word.category,
      found: isFound,
      solutionPath: word.path as CellCoordinate[],
    };
  });
  return {
    id: session.id,
    difficulty: session.difficulty as WordSearchDifficulty,
    board: session.board as string[][],
    status: session.status as "in_progress" | "won" | "claimed",
    totalWords: session.total_words,
    foundWords: session.found_words,
    words: visibleWords,
    foundPaths: found.map((word) => word.path as CellCoordinate[]),
  };
}

async function loadSession(admin: any, userId: string, sessionId?: string) {
  let query = admin
    .from("word_search_sessions")
    .select("id,user_id,local_date,difficulty,board,status,total_words,found_words,created_at")
    .eq("user_id", userId)
    .in("status", ["in_progress", "won"])
    .order("created_at", { ascending: false })
    .limit(1);
  if (sessionId)
    query = admin
      .from("word_search_sessions")
      .select("id,user_id,local_date,difficulty,board,status,total_words,found_words,created_at")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .limit(1);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error("Não foi possível carregar a partida.");
  if (!data) return null;
  const { data: words, error: wordsError } = await admin
    .from("word_search_session_words")
    .select("id,display_word,category,path,found_at,created_at")
    .eq("session_id", data.id)
    .order("created_at");
  if (wordsError) throw new Error("Não foi possível carregar o progresso.");
  return { raw: data, words: words || [], public: publicSession(data, words || []) };
}

export const getDailyGamesState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin, enabled, authorized, available } = await gameAdmin(context.userId);
    if (!available)
      return {
        enabled,
        authorized,
        available: false,
        canPlay: false,
        session: null,
        reward: null,
      };
    const today = getDailyGameDate();
    await expireStaleDailyGameSessions(admin, context.userId, today);
    const [session, rewardResult, difficultyCycle, activeGame] = await Promise.all([
      loadSession(admin, context.userId),
      admin
        .from("daily_game_rewards")
        .select("game_key,sticker_number,result_type,is_rare,created_at")
        .eq("user_id", context.userId)
        .eq("reward_date", today)
        .maybeSingle(),
      getDailyGameDifficultyCycle(admin, context.userId, GAME_KEY),
      getActiveDailyGame(admin, context.userId, today),
    ]);
    return {
      enabled,
      authorized,
      available: true,
      canPlay: !rewardResult.data && (!activeGame || activeGame.gameKey === GAME_KEY),
      blockedByGame: activeGame && activeGame.gameKey !== GAME_KEY ? activeGame.gameKey : null,
      session: session?.public || null,
      reward: rewardResult.data || null,
      availableDifficulties: difficultyCycle.available,
      usedDifficulties: difficultyCycle.used,
    };
  });

export const startWordSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => z.object({ difficulty: difficultySchema }).parse(value))
  .handler(async ({ context, data }) => {
    const { admin, available } = await gameAdmin(context.userId);
    if (!available) throw new Error(unavailable);
    const localDate = getDailyGameDate();
    await expireStaleDailyGameSessions(admin, context.userId, localDate);
    const [{ data: claimedToday }, difficultyCycle, activeGame] = await Promise.all([
      admin
        .from("daily_game_rewards")
        .select("id")
        .eq("user_id", context.userId)
        .eq("reward_date", localDate)
        .maybeSingle(),
      getDailyGameDifficultyCycle(admin, context.userId, GAME_KEY),
      getActiveDailyGame(admin, context.userId, localDate),
    ]);
    if (claimedToday) throw new Error("A recompensa de hoje já foi resgatada.");
    if (!difficultyCycle.available.includes(data.difficulty)) {
      throw new Error("Complete os outros níveis antes de repetir esta dificuldade.");
    }
    if (activeGame?.gameKey === GAME_KEY) {
      const active = await loadSession(admin, context.userId, activeGame.session.id);
      if (active) return active.public;
    }
    if (activeGame) throw new Error("Conclua a partida atual antes de iniciar outro jogo.");

    const [{ data: bank, error: bankError }, { data: stickers, error: stickerError }] =
      await Promise.all([
        admin
          .from("game_word_bank")
          .select("id,category,display_value,normalized_value,minimum_difficulty")
          .eq("is_active", true),
        admin.from("stickers").select("number,name,author").gte("number", 21).lte("number", 193),
      ]);
    if (bankError || stickerError) throw new Error("Não foi possível preparar o jogo.");
    const candidates: WordSource[] = [
      ...(bank || []).map((word: any) => ({
        sourceType: word.category as "trope" | "genre",
        sourceId: word.id,
        category: word.category === "trope" ? "Trope" : "Gênero",
        displayWord: word.display_value,
        normalizedWord: word.normalized_value,
      })),
      ...(stickers || []).flatMap((sticker: any) => {
        const values: WordSource[] = [
          {
            sourceType: "book",
            sourceId: String(sticker.number),
            category: "Livro",
            displayWord: sticker.name,
            normalizedWord: normalizeGameWord(sticker.name),
          },
        ];
        if (sticker.author)
          values.push({
            sourceType: "author",
            sourceId: String(sticker.number),
            category: "Autora",
            displayWord: sticker.author,
            normalizedWord: normalizeGameWord(sticker.author),
          });
        return values;
      }),
    ];
    const sessionId = crypto.randomUUID();
    const generated = generateWordSearch(
      candidates,
      data.difficulty,
      `${sessionId}:${context.userId}`,
    );
    const { error: sessionError } = await admin.from("word_search_sessions").insert({
      id: sessionId,
      user_id: context.userId,
      local_date: localDate,
      difficulty: data.difficulty,
      board: generated.board,
      total_words: generated.words.length,
    });
    if (sessionError) throw new Error("Não foi possível iniciar a partida.");
    const { error: wordError } = await admin.from("word_search_session_words").insert(
      generated.words.map((word) => ({
        session_id: sessionId,
        source_type: word.sourceType,
        source_id: word.sourceId,
        category: word.category,
        display_word: word.displayWord,
        normalized_word: word.normalizedWord,
        path: word.path,
        direction: word.direction,
        is_reversed: word.isReversed,
      })),
    );
    if (wordError) {
      await admin
        .from("word_search_sessions")
        .update({ status: "abandoned", abandoned_at: new Date().toISOString() })
        .eq("id", sessionId);
      throw new Error("Não foi possível finalizar o quadro.");
    }
    const created = await loadSession(admin, context.userId, sessionId);
    if (!created) throw new Error("Não foi possível carregar o jogo.");
    return created.public;
  });

export const submitWordPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => submitSchema.parse(value))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const { data: result, error } = await admin.rpc("submit_word_search_match", {
      p_user_id: context.userId,
      p_session_id: data.sessionId,
      p_path: data.path,
    });
    if (error) throw new Error(error.message || "Não foi possível validar a palavra.");
    return result as {
      matched: boolean;
      foundWord?: string;
      foundWordId?: string;
      foundWords?: number;
      won?: boolean;
    };
  });

export const claimDailyGameReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => sessionSchema.parse(value))
  .handler(async ({ context, data }) => {
    const { admin, available } = await gameAdmin(context.userId);
    if (!available) throw new Error(unavailable);
    const { data: reward, error } = await admin.rpc("claim_word_search_reward", {
      p_user_id: context.userId,
      p_session_id: data.sessionId,
    });
    if (error) throw new Error(error.message || "Não foi possível resgatar a figurinha.");
    return reward as {
      success: boolean;
      number: number;
      wasNew: boolean;
      isRare: boolean;
      resultType: string;
      idempotent: boolean;
    };
  });

export const abandonWordSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => sessionSchema.parse(value))
  .handler(async ({ context, data }) => {
    const { admin, available } = await gameAdmin(context.userId);
    if (!available) throw new Error(unavailable);
    const { error } = await admin
      .from("word_search_sessions")
      .update({
        status: "abandoned",
        abandoned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.sessionId)
      .eq("user_id", context.userId)
      .eq("status", "in_progress");
    if (error) throw new Error("Não foi possível reiniciar a partida.");
    return { success: true };
  });

async function loadPuzzleSession(admin: any, userId: string, sessionId?: string) {
  let query = admin
    .from("puzzle_game_sessions")
    .select("*, memory_game_stickers(id, front_image_path)")
    .eq("user_id", userId)
    .in("status", ["in_progress", "won"])
    .order("created_at", { ascending: false })
    .limit(1);
  if (sessionId)
    query = admin
      .from("puzzle_game_sessions")
      .select("*, memory_game_stickers(id, front_image_path)")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .limit(1);
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    difficulty: data.difficulty as PuzzleDifficulty,
    stickerId: data.sticker_id,
    frontImagePath:
      data.memory_game_stickers?.front_image_path || "/covers-jogos/o-despertar-do-desejo.jpg",
    gridRows: data.grid_rows,
    gridCols: data.grid_cols,
    totalPieces: data.total_pieces,
    placedPieces: data.placed_pieces,
    boardState: data.board_state || [],
    status: data.status as "in_progress" | "won" | "claimed",
  };
}

export const getPuzzleGameState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin, enabled, authorized, available } = await gameAdmin(
      context.userId,
      PUZZLE_GAME_KEY,
    );
    if (!available)
      return {
        enabled,
        authorized,
        available: false,
        canPlay: false,
        session: null,
        reward: null,
      };
    const today = getDailyGameDate();
    await expireStaleDailyGameSessions(admin, context.userId, today);
    const [session, rewardResult, difficultyCycle, activeGame] = await Promise.all([
      loadPuzzleSession(admin, context.userId),
      admin
        .from("daily_game_rewards")
        .select("game_key,sticker_number,result_type,is_rare,created_at")
        .eq("user_id", context.userId)
        .eq("reward_date", today)
        .maybeSingle(),
      getDailyGameDifficultyCycle(admin, context.userId, PUZZLE_GAME_KEY),
      getActiveDailyGame(admin, context.userId, today),
    ]);
    return {
      enabled,
      authorized,
      available: true,
      canPlay: !rewardResult.data && (!activeGame || activeGame.gameKey === PUZZLE_GAME_KEY),
      blockedByGame:
        activeGame && activeGame.gameKey !== PUZZLE_GAME_KEY ? activeGame.gameKey : null,
      session,
      reward: rewardResult.data || null,
      availableDifficulties: difficultyCycle.available as PuzzleDifficulty[],
      usedDifficulties: difficultyCycle.used as PuzzleDifficulty[],
    };
  });

export const startPuzzleGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => z.object({ difficulty: difficultySchema }).parse(value))
  .handler(async ({ context, data }) => {
    const { admin, available } = await gameAdmin(context.userId, PUZZLE_GAME_KEY);
    if (!available) throw new Error(unavailable);
    const localDate = getDailyGameDate();
    await expireStaleDailyGameSessions(admin, context.userId, localDate);
    const [{ data: claimedToday }, difficultyCycle, activeGame] = await Promise.all([
      admin
        .from("daily_game_rewards")
        .select("id")
        .eq("user_id", context.userId)
        .eq("reward_date", localDate)
        .maybeSingle(),
      getDailyGameDifficultyCycle(admin, context.userId, PUZZLE_GAME_KEY),
      getActiveDailyGame(admin, context.userId, localDate),
    ]);
    if (claimedToday) throw new Error("A recompensa de hoje já foi resgatada.");
    if (!difficultyCycle.available.includes(data.difficulty)) {
      throw new Error("Complete os outros níveis antes de repetir esta dificuldade.");
    }
    if (activeGame?.gameKey === PUZZLE_GAME_KEY) {
      const active = await loadPuzzleSession(admin, context.userId, activeGame.session.id);
      if (active) return active;
    }
    if (activeGame) throw new Error("Conclua a partida atual antes de iniciar outro jogo.");

    const { data: stickers, error: stickerError } = await admin
      .from("memory_game_stickers")
      .select("id, front_image_path")
      .eq("is_active", true);
    if (stickerError || !stickers || stickers.length === 0)
      throw new Error("Não foi possível carregar as figuras do jogo.");

    const chosenSticker = stickers[Math.floor(Math.random() * stickers.length)];
    const config = PUZZLE_GRID_CONFIG[data.difficulty as PuzzleDifficulty];
    const sessionId = crypto.randomUUID();

    const { error: sessionError } = await admin.from("puzzle_game_sessions").insert({
      id: sessionId,
      user_id: context.userId,
      local_date: localDate,
      difficulty: data.difficulty,
      sticker_id: chosenSticker.id,
      grid_rows: config.rows,
      grid_cols: config.cols,
      total_pieces: config.totalPieces,
      placed_pieces: 0,
      board_state: [],
      status: "in_progress",
    });
    if (sessionError) throw new Error("Não foi possível iniciar o quebra-cabeça.");
    const created = await loadPuzzleSession(admin, context.userId, sessionId);
    if (!created) throw new Error("Não foi possível carregar a partida.");
    return created;
  });

export const savePuzzleProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (value) =>
      z
        .object({
          sessionId: z.string().uuid(),
          placedPieces: z.number().int().min(0),
          boardState: z.array(z.any()),
        })
        .parse(value),
  )
  .handler(async ({ context, data }) => {
    const { admin, available } = await gameAdmin(context.userId, PUZZLE_GAME_KEY);
    if (!available) throw new Error(unavailable);
    const { data: session, error: loadErr } = await admin
      .from("puzzle_game_sessions")
      .select("total_pieces, status")
      .eq("id", data.sessionId)
      .eq("user_id", context.userId)
      .single();
    if (loadErr || !session || session.status !== "in_progress") {
      throw new Error("Sessão inválida ou finalizada.");
    }
    const won = data.placedPieces >= session.total_pieces;
    const now = new Date().toISOString();
    const { error } = await admin
      .from("puzzle_game_sessions")
      .update({
        placed_pieces: data.placedPieces,
        board_state: data.boardState,
        status: won ? "won" : "in_progress",
        won_at: won ? now : null,
        updated_at: now,
      })
      .eq("id", data.sessionId)
      .eq("user_id", context.userId);
    if (error) throw new Error("Não foi possível salvar o progresso.");
    return { success: true, won };
  });

export const claimPuzzleGameReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => sessionSchema.parse(value))
  .handler(async ({ context, data }) => {
    const { admin, available } = await gameAdmin(context.userId, PUZZLE_GAME_KEY);
    if (!available) throw new Error(unavailable);
    const { data: reward, error } = await admin.rpc("claim_puzzle_game_reward", {
      p_user_id: context.userId,
      p_session_id: data.sessionId,
    });
    if (error) throw new Error(error.message || "Não foi possível resgatar a figurinha.");
    return reward as {
      success: boolean;
      number: number;
      wasNew: boolean;
      isRare: boolean;
      resultType: string;
      idempotent: boolean;
    };
  });

export const abandonPuzzleGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => sessionSchema.parse(value))
  .handler(async ({ context, data }) => {
    const { admin, available } = await gameAdmin(context.userId, PUZZLE_GAME_KEY);
    if (!available) throw new Error(unavailable);
    const { error } = await admin
      .from("puzzle_game_sessions")
      .update({
        status: "abandoned",
        abandoned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.sessionId)
      .eq("user_id", context.userId)
      .eq("status", "in_progress");
    if (error) throw new Error("Não foi possível reiniciar a partida.");
    return { success: true };
  });
