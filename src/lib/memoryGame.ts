import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getMemoryCoverPath } from "@/lib/memoryImagePath";
import {
  expireStaleDailyGameSessions,
  getActiveDailyGame,
  getDailyGameDate,
  getDailyGameDifficultyCycle,
} from "@/lib/dailyGamesPolicy";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type MemoryDifficulty = "easy" | "medium" | "hard";
const GAME_KEY = "memory_game";
const MEMORY_TEST_USER_IDS = new Set([
  "a2c66f5b-6cba-4984-a256-c189051e6630",
  "483f4e4b-20b0-4340-a1bb-4666acd54b32",
  "f8721040-035f-414a-8153-b5e12fec64d7",
]);
const difficultySchema = z.enum(["easy", "medium", "hard"]);
const sessionSchema = z.object({ sessionId: z.string().uuid() });
const compareSchema = sessionSchema.extend({
  firstCardId: z.string().uuid(),
  secondCardId: z.string().uuid(),
});

async function access(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const [{ data: setting }, { data: grant }] = await Promise.all([
    admin.from("game_settings").select("value").eq("key", "memory_game_enabled").maybeSingle(),
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
  const authorized = MEMORY_TEST_USER_IDS.has(userId) && Boolean(grant);
  return { admin, enabled, authorized, available: enabled && authorized };
}

async function load(admin: any, userId: string, sessionId?: string) {
  let query = admin
    .from("memory_game_sessions")
    .select("id,difficulty,status,total_pairs,matched_pairs,created_at")
    .eq("user_id", userId)
    .in("status", ["in_progress", "won"])
    .order("created_at", { ascending: false })
    .limit(1);
  if (sessionId)
    query = admin
      .from("memory_game_sessions")
      .select("id,difficulty,status,total_pairs,matched_pairs,created_at")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .limit(1);
  const { data: session, error } = await query.maybeSingle();
  if (error) throw new Error("Não foi possível carregar a partida.");
  if (!session) return null;
  const { data: cards, error: cardsError } = await admin
    .from("memory_game_cards")
    .select("card_instance_id,board_position,matched_at,source_sticker_id")
    .eq("session_id", session.id)
    .order("board_position");
  if (cardsError) throw new Error("Não foi possível carregar o tabuleiro.");
  return {
    id: session.id,
    difficulty: session.difficulty as MemoryDifficulty,
    status: session.status as "in_progress" | "won" | "claimed",
    totalPairs: session.total_pairs,
    matchedPairs: session.matched_pairs,
    cards: (cards || []).map((card: any) => {
      return {
        id: card.card_instance_id,
        position: card.board_position,
        matched: Boolean(card.matched_at),
        // A frente viaja com a sessão para que o cliente possa pré-carregar apenas
        // as cartas desta partida e responder ao toque sem uma ida extra ao servidor.
        // A comparação e a vitória continuam sendo validadas pela RPC autoritativa.
        frontImage: getMemoryCoverPath(card.source_sticker_id) || undefined,
        backImage: "/verso-card.webp",
      };
    }),
  };
}

export const getMemoryGameState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin, enabled, authorized, available } = await access(context.userId);
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
    const [session, reward, difficultyCycle, activeGame] = await Promise.all([
      load(admin, context.userId),
      admin
        .from("daily_game_rewards")
        .select("sticker_number,result_type,is_rare,game_key")
        .eq("user_id", context.userId)
        .eq("reward_date", today)
        .maybeSingle(),
      getDailyGameDifficultyCycle(admin, context.userId, GAME_KEY),
      getActiveDailyGame(admin, context.userId, today),
    ]);
    return {
      enabled,
      authorized,
      available,
      canPlay: !reward.data && (!activeGame || activeGame.gameKey === GAME_KEY),
      blockedByGame: activeGame && activeGame.gameKey !== GAME_KEY ? activeGame.gameKey : null,
      session,
      reward: reward.data || null,
      availableDifficulties: difficultyCycle.available,
      usedDifficulties: difficultyCycle.used,
    };
  });

export const startMemoryGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => z.object({ difficulty: difficultySchema }).parse(value))
  .handler(async ({ context, data }) => {
    const { admin, available } = await access(context.userId);
    if (!available) throw new Error("Este recurso não está disponível para sua conta no momento.");
    const today = getDailyGameDate();
    await expireStaleDailyGameSessions(admin, context.userId, today);
    const [activeGame, difficultyCycle] = await Promise.all([
      getActiveDailyGame(admin, context.userId, today),
      getDailyGameDifficultyCycle(admin, context.userId, GAME_KEY),
    ]);
    if (activeGame && activeGame.gameKey !== GAME_KEY)
      throw new Error("Conclua a partida atual antes de iniciar outro jogo.");
    if (!difficultyCycle.available.includes(data.difficulty))
      throw new Error("Complete os outros níveis antes de repetir esta dificuldade.");
    const { data: sessionId, error } = await admin.rpc("start_memory_game", {
      p_user_id: context.userId,
      p_difficulty: data.difficulty,
      p_session_id: crypto.randomUUID(),
    });
    if (error) throw new Error(error.message || "Não foi possível iniciar a partida.");
    const session = await load(admin, context.userId, sessionId);
    if (!session) throw new Error("Não foi possível carregar a partida.");
    return session;
  });

export const compareMemoryCards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => compareSchema.parse(value))
  .handler(async ({ context, data }) => {
    const { admin, available } = await access(context.userId);
    if (!available) throw new Error("Este recurso não está disponível para sua conta no momento.");
    const { data: result, error } = await admin.rpc("compare_memory_cards", {
      p_user_id: context.userId,
      p_session_id: data.sessionId,
      p_first_card: data.firstCardId,
      p_second_card: data.secondCardId,
    });
    if (error) throw new Error(error.message || "Não foi possível comparar as cartas.");
    // A RPC já é autoritativa. Evite reler a sessão e todas as cartas depois de
    // cada tentativa: o cliente só precisa deste delta mínimo para atualizar a UI.
    return result as { matched: boolean; matchedPairs: number; won: boolean };
  });

export const claimMemoryGameReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => sessionSchema.parse(value))
  .handler(async ({ context, data }) => {
    const { admin, available } = await access(context.userId);
    if (!available) throw new Error("Este recurso não está disponível para sua conta no momento.");
    const { data: reward, error } = await admin.rpc("claim_daily_game_reward", {
      p_user_id: context.userId,
      p_game_key: GAME_KEY,
      p_session_id: data.sessionId,
    });
    if (error) throw new Error(error.message || "Não foi possível resgatar a figurinha.");
    return reward;
  });
