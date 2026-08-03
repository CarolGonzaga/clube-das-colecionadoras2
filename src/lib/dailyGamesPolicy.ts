/* eslint-disable @typescript-eslint/no-explicit-any */
export const DAILY_GAME_TIME_ZONE = "America/Sao_Paulo";
export const DAILY_GAME_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type DailyGameDifficulty = (typeof DAILY_GAME_DIFFICULTIES)[number];
export type DailyGameKey = "word_search" | "memory_game" | "puzzle_game";

type AdminClient = any;

export function getDailyGameDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: DAILY_GAME_TIME_ZONE }).format(date);
}

export function calculateUsedDifficulties(history: readonly DailyGameDifficulty[]) {
  const used = new Set<DailyGameDifficulty>();
  for (const difficulty of history) {
    used.add(difficulty);
    if (used.size === DAILY_GAME_DIFFICULTIES.length) used.clear();
  }
  return [...used];
}

/**
 * Daily-game contract shared by every game:
 * - only one active game and one victory/reward per user and local day;
 * - unfinished or unclaimed sessions expire when the local day changes;
 * - only claimed sessions consume a difficulty in the three-level cycle.
 * Database triggers enforce the same contract transactionally. Future games must
 * use this policy and the database guard unless their product rule says otherwise.
 */
export async function expireStaleDailyGameSessions(
  admin: AdminClient,
  userId: string,
  today = getDailyGameDate(),
) {
  const expiredAt = new Date().toISOString();
  const payload = { status: "abandoned", abandoned_at: expiredAt, updated_at: expiredAt };
  const results = await Promise.all([
    admin
      .from("word_search_sessions")
      .update(payload)
      .eq("user_id", userId)
      .in("status", ["in_progress", "won"])
      .lt("local_date", today),
    admin
      .from("memory_game_sessions")
      .update(payload)
      .eq("user_id", userId)
      .in("status", ["in_progress", "won"])
      .lt("local_date", today),
    admin
      .from("puzzle_game_sessions")
      .update(payload)
      .eq("user_id", userId)
      .in("status", ["in_progress", "won"])
      .lt("local_date", today),
  ]);
  if (results.some((result) => result.error)) {
    throw new Error("Não foi possível atualizar o ciclo diário dos jogos.");
  }
}

export async function getActiveDailyGame(
  admin: AdminClient,
  userId: string,
  today = getDailyGameDate(),
) {
  const [word, memory, puzzle] = await Promise.all([
    admin
      .from("word_search_sessions")
      .select("id,status,local_date")
      .eq("user_id", userId)
      .eq("local_date", today)
      .eq("status", "in_progress")
      .limit(1)
      .maybeSingle(),
    admin
      .from("memory_game_sessions")
      .select("id,status,local_date")
      .eq("user_id", userId)
      .eq("local_date", today)
      .eq("status", "in_progress")
      .limit(1)
      .maybeSingle(),
    admin
      .from("puzzle_game_sessions")
      .select("id,status,local_date")
      .eq("user_id", userId)
      .eq("local_date", today)
      .eq("status", "in_progress")
      .limit(1)
      .maybeSingle(),
  ]);
  if (word.error || memory.error || puzzle.error)
    throw new Error("Não foi possível verificar a partida do dia.");
  if (word.data) return { gameKey: "word_search" as const, session: word.data };
  if (memory.data) return { gameKey: "memory_game" as const, session: memory.data };
  if (puzzle.data) return { gameKey: "puzzle_game" as const, session: puzzle.data };
  return null;
}

export async function getDailyGameDifficultyCycle(
  admin: AdminClient,
  userId: string,
  gameKey: DailyGameKey,
) {
  const sessionTable =
    gameKey === "word_search"
      ? "word_search_sessions"
      : gameKey === "puzzle_game"
        ? "puzzle_game_sessions"
        : "memory_game_sessions";
  const { data: rewards, error: rewardError } = await admin
    .from("daily_game_rewards")
    .select("session_id,reward_date,created_at")
    .eq("user_id", userId)
    .eq("game_key", gameKey)
    .order("reward_date", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(500);
  if (rewardError) throw new Error("Não foi possível carregar o ciclo de dificuldades.");
  const sessionIds = (rewards || []).map((reward: any) => reward.session_id);
  if (!sessionIds.length)
    return { used: [] as DailyGameDifficulty[], available: [...DAILY_GAME_DIFFICULTIES] };
  const { data: sessions, error: sessionError } = await admin
    .from(sessionTable)
    .select("id,difficulty")
    .in("id", sessionIds);
  if (sessionError) throw new Error("Não foi possível carregar o ciclo de dificuldades.");
  const byId = new Map((sessions || []).map((session: any) => [session.id, session.difficulty]));
  const history = (rewards || [])
    .map((reward: any) => byId.get(reward.session_id) as DailyGameDifficulty | undefined)
    .filter((difficulty: DailyGameDifficulty | undefined): difficulty is DailyGameDifficulty =>
      Boolean(difficulty),
    );
  const used = calculateUsedDifficulties(history);
  return {
    used,
    available: DAILY_GAME_DIFFICULTIES.filter((difficulty) => !used.includes(difficulty)),
  };
}
