import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  generateWordSearch,
  isStraightContinuousPath,
  normalizeGameWord,
  pathsMatch,
  type CellCoordinate,
  type WordSearchDifficulty,
  type WordSource,
} from "@/lib/wordSearchGenerator";

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

async function gameAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const [{ data: setting }, { data: grant }] = await Promise.all([
    admin.from("game_settings").select("value").eq("key", "word_search_enabled").maybeSingle(),
    admin
      .from("game_access_grants")
      .select("id")
      .eq("user_id", userId)
      .eq("game_key", GAME_KEY)
      .eq("is_active", true)
      .is("revoked_at", null)
      .maybeSingle(),
  ]);
  const enabled = setting?.value === true;
  return { admin, enabled, authorized: Boolean(grant), available: enabled && Boolean(grant) };
}

function publicSession(session: any, words: any[]) {
  const found = words.filter((word) => word.found_at);
  const visibleWords =
    session.difficulty === "hard"
      ? found.map((word) => ({
          id: word.id,
          displayWord: word.display_word,
          category: word.category,
          found: true,
        }))
      : words.map((word) => ({
          id: word.id,
          displayWord: word.display_word,
          category: word.category,
          found: Boolean(word.found_at),
        }));
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
    .select("*")
    .eq("user_id", userId)
    .in("status", ["in_progress", "won"])
    .order("created_at", { ascending: false })
    .limit(1);
  if (sessionId)
    query = admin
      .from("word_search_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .limit(1);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error("Não foi possível carregar a partida.");
  if (!data) return null;
  const { data: words, error: wordsError } = await admin
    .from("word_search_session_words")
    .select("*")
    .eq("session_id", data.id)
    .order("created_at");
  if (wordsError) throw new Error("Não foi possível carregar o progresso.");
  return { raw: data, words: words || [], public: publicSession(data, words || []) };
}

async function getDifficultyCycle(admin: any, userId: string) {
  const difficulties: WordSearchDifficulty[] = ["easy", "medium", "hard"];
  const { data: rewards, error: rewardError } = await admin
    .from("daily_game_rewards")
    .select("session_id,reward_date")
    .eq("user_id", userId)
    .eq("game_key", GAME_KEY)
    .order("reward_date", { ascending: true })
    .limit(500);
  if (rewardError) throw new Error("Não foi possível carregar o ciclo de dificuldades.");
  const sessionIds = (rewards || []).map((reward: any) => reward.session_id);
  if (sessionIds.length === 0) return { used: [], available: difficulties };
  const { data: sessions, error: sessionError } = await admin
    .from("word_search_sessions")
    .select("id,difficulty")
    .in("id", sessionIds);
  if (sessionError) throw new Error("Não foi possível carregar o ciclo de dificuldades.");
  const byId = new Map((sessions || []).map((session: any) => [session.id, session.difficulty]));
  const used = new Set<WordSearchDifficulty>();
  for (const reward of rewards || []) {
    const difficulty = byId.get(reward.session_id) as WordSearchDifficulty | undefined;
    if (!difficulty) continue;
    used.add(difficulty);
    if (used.size === difficulties.length) used.clear();
  }
  return {
    used: [...used],
    available: difficulties.filter((difficulty) => !used.has(difficulty)),
  };
}

export const getDailyGamesState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin, enabled, authorized, available } = await gameAdmin(context.userId);
    if (!available) return { enabled, authorized, available: false, session: null, reward: null };
    const [session, rewardResult, difficultyCycle] = await Promise.all([
      loadSession(admin, context.userId),
      admin
        .from("daily_game_rewards")
        .select("sticker_number,result_type,is_rare,created_at")
        .eq("user_id", context.userId)
        .eq(
          "reward_date",
          new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()),
        )
        .maybeSingle(),
      getDifficultyCycle(admin, context.userId),
    ]);
    return {
      enabled,
      authorized,
      available: true,
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
    const localDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
    }).format(new Date());
    const [{ data: claimedToday }, difficultyCycle] = await Promise.all([
      admin
        .from("daily_game_rewards")
        .select("id")
        .eq("user_id", context.userId)
        .eq("reward_date", localDate)
        .maybeSingle(),
      getDifficultyCycle(admin, context.userId),
    ]);
    if (claimedToday) throw new Error("A recompensa de hoje já foi resgatada.");
    if (!difficultyCycle.available.includes(data.difficulty)) {
      throw new Error("Complete os outros níveis antes de repetir esta dificuldade.");
    }
    const active = await loadSession(admin, context.userId);
    if (active && active.raw.difficulty === data.difficulty) return active.public;
    if (active) {
      const { error } = await admin
        .from("word_search_sessions")
        .update({
          status: "abandoned",
          abandoned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", active.raw.id)
        .eq("user_id", context.userId);
      if (error) throw new Error("Não foi possível reiniciar a partida.");
    }

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
    const { admin, available } = await gameAdmin(context.userId);
    if (!available) throw new Error(unavailable);
    const session = await loadSession(admin, context.userId, data.sessionId);
    if (!session || session.raw.status !== "in_progress")
      throw new Error("Esta partida não aceita novas palavras.");
    const size = Array.isArray(session.raw.board) ? session.raw.board.length : 0;
    if (!isStraightContinuousPath(data.path, size)) throw new Error("Seleção inválida.");
    const match = session.words.find(
      (word: any) => !word.found_at && pathsMatch(data.path, word.path as CellCoordinate[]),
    );
    if (!match) return { matched: false, session: session.public };
    const foundAt = new Date().toISOString();
    const { error } = await admin
      .from("word_search_session_words")
      .update({ found_at: foundAt })
      .eq("id", match.id)
      .is("found_at", null);
    if (error) throw new Error("Não foi possível registrar a palavra.");
    const { count } = await admin
      .from("word_search_session_words")
      .select("id", { count: "exact", head: true })
      .eq("session_id", data.sessionId)
      .not("found_at", "is", null);
    const foundWords = count || 0;
    const won = foundWords === session.raw.total_words;
    await admin
      .from("word_search_sessions")
      .update({
        found_words: foundWords,
        status: won ? "won" : "in_progress",
        won_at: won ? foundAt : null,
        updated_at: foundAt,
      })
      .eq("id", data.sessionId)
      .eq("user_id", context.userId);
    const refreshed = await loadSession(admin, context.userId, data.sessionId);
    if (!refreshed) throw new Error("Não foi possível atualizar a partida.");
    return { matched: true, foundWord: match.display_word, session: refreshed.public };
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
