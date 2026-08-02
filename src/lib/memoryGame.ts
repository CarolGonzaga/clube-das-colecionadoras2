import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getMemoryCoverPath } from "@/lib/memoryImagePath";

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
const cardSchema = sessionSchema.extend({ cardId: z.string().uuid() });
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
    .select("*")
    .eq("user_id", userId)
    .in("status", ["in_progress", "won"])
    .order("created_at", { ascending: false })
    .limit(1);
  if (sessionId)
    query = admin
      .from("memory_game_sessions")
      .select("*")
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
        frontImage: card.matched_at
          ? getMemoryCoverPath(card.source_sticker_id) || undefined
          : undefined,
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
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
      new Date(),
    );
    const [session, reward] = await Promise.all([
      load(admin, context.userId),
      admin
        .from("daily_game_rewards")
        .select("sticker_number,result_type,is_rare,game_key")
        .eq("user_id", context.userId)
        .eq("reward_date", today)
        .maybeSingle(),
    ]);
    return {
      enabled,
      authorized,
      available,
      canPlay: !reward.data,
      session,
      reward: reward.data || null,
    };
  });

export const startMemoryGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => z.object({ difficulty: difficultySchema }).parse(value))
  .handler(async ({ context, data }) => {
    const { admin, available } = await access(context.userId);
    if (!available) throw new Error("Este recurso não está disponível para sua conta no momento.");
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

export const revealMemoryCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => cardSchema.parse(value))
  .handler(async ({ context, data }) => {
    const { admin, available } = await access(context.userId);
    if (!available) throw new Error("Este recurso não está disponível para sua conta no momento.");
    const { data: cardRow, error } = await admin
      .from("memory_game_cards")
      .select("card_instance_id,source_sticker_id,memory_game_sessions!inner(user_id,status)")
      .eq("session_id", data.sessionId)
      .eq("card_instance_id", data.cardId)
      .eq("memory_game_sessions.user_id", context.userId)
      .maybeSingle();
    if (error || !cardRow || !["in_progress", "won"].includes(cardRow.memory_game_sessions.status))
      throw new Error("Carta inválida ou partida encerrada.");
    const { data: image, error: imageError } = await admin
      .from("memory_game_stickers")
      .select("id")
      .eq("id", cardRow.source_sticker_id)
      .eq("is_active", true)
      .contains("allowed_game_keys", [GAME_KEY])
      .maybeSingle();
    const frontImage = getMemoryCoverPath(image?.id);
    if (imageError || !frontImage) throw new Error("A imagem desta carta não está disponível.");
    return { cardId: cardRow.card_instance_id, frontImage };
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
    const session = await load(admin, context.userId, data.sessionId);
    if (!session) throw new Error("Não foi possível restaurar a partida.");
    return { ...result, session };
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
