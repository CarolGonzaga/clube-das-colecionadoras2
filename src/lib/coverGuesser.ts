import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  expireStaleDailyGameSessions,
  getDailyGameDate,
  getDailyGameDifficultyCycle,
} from "@/lib/dailyGamesPolicy";
import { checkCoverAnswer } from "@/lib/coverGuesserTitles";

/* eslint-disable @typescript-eslint/no-explicit-any */
const GAME_KEY = "cover_guesser";
const HINTS_BY_DIFFICULTY: Record<string, number> = {
  easy: 2,
  medium: 1,
  hard: 0,
};

const difficultySchema = z.enum(["easy", "medium", "hard"]);
const sessionSchema = z.object({ sessionId: z.string().uuid() });

async function gameAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const { data: setting } = await admin
    .from("game_settings")
    .select("value")
    .eq("key", "cover_guesser_enabled")
    .maybeSingle();
  const enabled = setting?.value === true;
  return { admin, enabled, authorized: enabled, available: enabled };
}

async function loadSession(admin: any, userId: string, sessionId?: string) {
  let query = admin
    .from("cover_guesser_sessions")
    .select(
      "id,difficulty,sticker_id,hints_allowed,hints_used,status,won_at,created_at,memory_game_stickers(title)",
    )
    .eq("user_id", userId)
    .in("status", ["in_progress", "won"])
    .order("created_at", { ascending: false })
    .limit(1);
  if (sessionId)
    query = admin
      .from("cover_guesser_sessions")
      .select(
        "id,difficulty,sticker_id,hints_allowed,hints_used,status,won_at,created_at,memory_game_stickers(title)",
      )
      .eq("id", sessionId)
      .eq("user_id", userId)
      .limit(1);
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;

  const title = data.memory_game_stickers?.title as string | undefined;
  if (!title) return null;

  // Calcular quais posições de letras estão reveladas por dicas
  const revealedPositions = buildRevealedPositions(title, data.hints_used);

  return {
    id: data.id,
    difficulty: data.difficulty as "easy" | "medium" | "hard",
    stickerId: data.sticker_id as number,
    hintsAllowed: data.hints_allowed as number,
    hintsUsed: data.hints_used as number,
    status: data.status as "in_progress" | "won",
    revealedPositions,
    titleLength: title.length,
    // Máscaras de palavras (sem revelar o título completo ao cliente)
    wordMasks: buildWordMasks(title, revealedPositions),
  };
}

/**
 * Constrói as posições reveladas (índice global no título, ignorando espaços)
 * com base no número de dicas já usadas. Usa uma semente determinística baseada
 * no sticker_id para que as dicas sejam sempre as mesmas para uma dada partida.
 */
function buildRevealedPositions(title: string, hintsUsed: number): number[] {
  // Coletamos apenas índices de letras (ignorando espaços, hífens, etc.)
  const letterIndices: number[] = [];
  for (let i = 0; i < title.length; i++) {
    if (/[a-záàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ]/i.test(title[i])) {
      letterIndices.push(i);
    }
  }
  if (hintsUsed === 0 || letterIndices.length === 0) return [];

  // Embaralha de modo determinístico usando o título como semente
  const shuffled = deterministicShuffle(letterIndices, title);
  return shuffled.slice(0, hintsUsed);
}

/**
 * Embaralhamento determinístico de Fisher-Yates com semente baseada na string.
 * Garante que as mesmas dicas sejam escolhidas para o mesmo título sempre.
 */
function deterministicShuffle(arr: number[], seed: string): number[] {
  const result = [...arr];
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Monta a representação de palavras com letras e traços.
 * Ex: "O Despertar do Desejo" com nenhuma dica →
 * [["O"], ["_","_","_","_","_","_","_","_"], ...]
 * Letras em posições reveladas aparecem; demais aparecem como "_".
 */
function buildWordMasks(
  title: string,
  revealedPositions: number[],
): Array<Array<{ char: string; revealed: boolean; isLetter: boolean }>> {
  const revealed = new Set(revealedPositions);
  const words: Array<Array<{ char: string; revealed: boolean; isLetter: boolean }>> = [];
  let currentWord: Array<{ char: string; revealed: boolean; isLetter: boolean }> = [];

  for (let i = 0; i < title.length; i++) {
    const ch = title[i];
    if (ch === " ") {
      if (currentWord.length > 0) {
        words.push(currentWord);
        currentWord = [];
      }
    } else {
      const isLetter = /[a-záàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑa-z]/i.test(ch);
      currentWord.push({
        char: ch,
        revealed: !isLetter || revealed.has(i),
        isLetter,
      });
    }
  }
  if (currentWord.length > 0) words.push(currentWord);
  return words;
}

const TARGET_TEST_USER_ID = "f8721040-035f-414a-8153-b5e12fec64d7";

export type CoverGuesserSession = NonNullable<Awaited<ReturnType<typeof loadSession>>>;

export const getCoverGuesserState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin, enabled, authorized, available } = await gameAdmin(context.userId);
    if (!available)
      return { enabled, authorized, available: false, canPlay: false, session: null, reward: null };

    // Se for o usuário de teste, desbloquear o jogo limpando recompensas
    if (context.userId === TARGET_TEST_USER_ID) {
      await admin.from("daily_game_rewards").delete().eq("user_id", context.userId).eq("game_key", GAME_KEY);
    }

    const today = getDailyGameDate();
    await expireStaleDailyGameSessions(admin, context.userId, today);
    const [session, rewardResult, difficultyCycle] = await Promise.all([
      loadSession(admin, context.userId),
      admin
        .from("daily_game_rewards")
        .select("game_key,sticker_number,result_type,is_rare,created_at")
        .eq("user_id", context.userId)
        .eq("reward_date", today)
        .eq("game_key", GAME_KEY)
        .maybeSingle(),
      getDailyGameDifficultyCycle(admin, context.userId, GAME_KEY),
    ]);
    return {
      enabled,
      authorized,
      available: true,
      canPlay: !rewardResult.data,
      blockedByGame: null,
      session,
      reward: rewardResult.data || null,
      availableDifficulties: difficultyCycle.available as ("easy" | "medium" | "hard")[],
      usedDifficulties: difficultyCycle.used as ("easy" | "medium" | "hard")[],
    };
  });

export const startCoverGuesser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => z.object({ difficulty: difficultySchema }).parse(value))
  .handler(async ({ context, data }) => {
    const { admin, available } = await gameAdmin(context.userId);
    if (!available) throw new Error("Este recurso não está disponível para sua conta no momento.");
    const localDate = getDailyGameDate();
    await expireStaleDailyGameSessions(admin, context.userId, localDate);

    // Se for o usuário de teste, garantir liberação do jogo
    if (context.userId === TARGET_TEST_USER_ID) {
      await admin.from("daily_game_rewards").delete().eq("user_id", context.userId).eq("game_key", GAME_KEY);
    }

    const [{ data: claimedToday }, difficultyCycle, active] = await Promise.all([
      admin
        .from("daily_game_rewards")
        .select("id")
        .eq("user_id", context.userId)
        .eq("reward_date", localDate)
        .eq("game_key", GAME_KEY)
        .maybeSingle(),
      getDailyGameDifficultyCycle(admin, context.userId, GAME_KEY),
      loadSession(admin, context.userId),
    ]);
    if (claimedToday) throw new Error("A recompensa de hoje já foi resgatada.");
    if (!difficultyCycle.available.includes(data.difficulty)) {
      throw new Error("Complete os outros níveis antes de repetir esta dificuldade.");
    }
    if (active) return active;

    // Sortear um sticker aleatório do catálogo (ou fixar sticker 391 "Alda" para a conta de teste)
    const { data: stickers, error: stickerError } = await admin
      .from("memory_game_stickers")
      .select("id, front_image_path, title")
      .eq("is_active", true);
    if (stickerError || !stickers || stickers.length === 0)
      throw new Error("Não foi possível carregar as capas do jogo.");

    const validStickers = stickers.filter((s: any) => Boolean(s.title));
    if (validStickers.length === 0) throw new Error("Nenhuma capa disponível para adivinhar.");

    const chosen =
      context.userId === TARGET_TEST_USER_ID
        ? validStickers.find((s: any) => Number(s.id) === 391) ||
          validStickers[Math.floor(Math.random() * validStickers.length)]
        : validStickers[Math.floor(Math.random() * validStickers.length)];

    const hintsAllowed = HINTS_BY_DIFFICULTY[data.difficulty] ?? 0;
    const sessionId = crypto.randomUUID();

    const { error: sessionError } = await admin.from("cover_guesser_sessions").insert({
      id: sessionId,
      user_id: context.userId,
      local_date: localDate,
      difficulty: data.difficulty,
      sticker_id: chosen.id,
      hints_allowed: hintsAllowed,
      hints_used: 0,
      status: "in_progress",
    });
    if (sessionError) throw new Error("Não foi possível iniciar o jogo.");
    const created = await loadSession(admin, context.userId, sessionId);
    if (!created) throw new Error("Não foi possível carregar a partida.");
    return created;
  });

export const useHint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => sessionSchema.parse(value))
  .handler(async ({ context, data }) => {
    const { admin, available } = await gameAdmin(context.userId);
    if (!available) throw new Error("Este recurso não está disponível.");
    const { data: session, error: loadErr } = await admin
      .from("cover_guesser_sessions")
      .select("sticker_id,hints_allowed,hints_used,status,memory_game_stickers(title)")
      .eq("id", data.sessionId)
      .eq("user_id", context.userId)
      .single();
    if (loadErr || !session || session.status !== "in_progress") {
      throw new Error("Sessão inválida ou finalizada.");
    }
    if (session.hints_used >= session.hints_allowed) {
      throw new Error("Você já usou todas as dicas disponíveis.");
    }
    const title = session.memory_game_stickers?.title as string | undefined;
    if (!title) throw new Error("Título não encontrado.");

    const newHintsUsed = session.hints_used + 1;
    const { error: updateErr } = await admin
      .from("cover_guesser_sessions")
      .update({ hints_used: newHintsUsed, updated_at: new Date().toISOString() })
      .eq("id", data.sessionId)
      .eq("user_id", context.userId);
    if (updateErr) throw new Error("Não foi possível registrar a dica.");

    const revealedPositions = buildRevealedPositions(title, newHintsUsed);
    const wordMasks = buildWordMasks(title, revealedPositions);
    return { hintsUsed: newHintsUsed, revealedPositions, wordMasks };
  });

export const submitCoverGuess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) =>
    z.object({ sessionId: z.string().uuid(), guess: z.string().min(1).max(200) }).parse(value),
  )
  .handler(async ({ context, data }) => {
    const { admin, available } = await gameAdmin(context.userId);
    if (!available) throw new Error("Este recurso não está disponível.");
    const { data: session, error: loadErr } = await admin
      .from("cover_guesser_sessions")
      .select("sticker_id,status,memory_game_stickers(title)")
      .eq("id", data.sessionId)
      .eq("user_id", context.userId)
      .single();
    if (loadErr || !session || session.status !== "in_progress") {
      throw new Error("Sessão inválida ou finalizada.");
    }
    const title = session.memory_game_stickers?.title as string | undefined;
    if (!title) throw new Error("Título não encontrado.");

    const correct = checkCoverAnswer(data.guess, title);
    if (correct) {
      const now = new Date().toISOString();
      const { error: updateErr } = await admin
        .from("cover_guesser_sessions")
        .update({ status: "won", won_at: now, updated_at: now })
        .eq("id", data.sessionId)
        .eq("user_id", context.userId);
      if (updateErr) throw new Error("Não foi possível registrar a vitória.");
    }
    return { correct };
  });

export const claimCoverGuesserReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => sessionSchema.parse(value))
  .handler(async ({ context, data }) => {
    const { admin, available } = await gameAdmin(context.userId);
    if (!available) throw new Error("Este recurso não está disponível para sua conta no momento.");
    const { data: reward, error } = await admin.rpc("claim_cover_guesser_reward", {
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
