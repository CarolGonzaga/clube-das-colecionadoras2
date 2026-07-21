// @ts-nocheck
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Sticker, Profile, UserSticker, Style, UserStyle, RevealItem, Donation, TradeRequest, TradeUserLookup } from "./types";
import { getLoginUrl } from "./urls";
import { SEED_STICKERS } from "./seeds";
import { canHaveRareVersion } from "./albumRules";

const TIMEZONE = "America/Sao_Paulo";

// Retrieve local date string in America/Sao_Paulo timezone (YYYY-MM-DD)
export function getLocalDateStr(): string {
  const d = new Date();
  return d.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

// Normalize password to bypass 6-char limit for 4 or 5 digit PINs
export function normalizePassword(input: string): string {
  if (/^\d{4,}$/.test(input)) {
    return input + "CDCPIN";
  }
  return input;
}

export function validatePasswordOrPin(input: string): string | null {
  if (/^\d+$/.test(input)) {
    if (input.length < 4) return "O PIN deve ter no mínimo 4 números.";
    if (/(\d)\1{3,}/.test(input)) return "O PIN não pode ter quatro números repetidos em sequência.";
    const digits = [...input].map(Number);
    const ascending = digits.every((digit, index) => index === 0 || digit === digits[index - 1] + 1);
    const descending = digits.every((digit, index) => index === 0 || digit === digits[index - 1] - 1);
    if (ascending || descending) return "O PIN não pode ser uma sequência numérica.";
    return null;
  }
  return input.length >= 6 ? null : "A senha deve ter no mínimo 6 caracteres.";
}

const supabaseUrl =
  typeof window !== "undefined"
    ? (window as any).env?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
    : import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  typeof window !== "undefined"
    ? (window as any).env?.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
    : import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be configured!");
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

const PUBLIC_MURAL_CACHE_TTL_MS = 60_000;
let publicMuralCache: any[] | null = null;
let publicMuralCachedAt = 0;
let publicMuralRequest: Promise<any[]> | null = null;

export const dbService = {
  isMock: () => false,

  // Get current user session
  async getCurrentUser() {
    const sessionResult = await supabase.auth.getSession();
    let session = sessionResult.data.session;
    const error = sessionResult.error;

    // If no session but we have supabase auth token in localStorage, wait up to 800ms for Supabase to initialize
    if (!session && !error && typeof window !== "undefined") {
      const hasAuthToken = Object.keys(localStorage).some(
        (key) => key.startsWith("sb-") && key.endsWith("-auth-token"),
      );
      if (hasAuthToken) {
        for (let i = 0; i < 8; i++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const res = await supabase.auth.getSession();
          if (res.data.session) {
            session = res.data.session;
            break;
          }
        }
      }
    }

    if (error) return null;
    return session ? session.user : null;
  },

  async login(email: string, pin: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPin = normalizePassword(pin.trim());
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPin,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async requestPasswordReset(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getLoginUrl("?step=forgot_reset"),
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async verifyResetCode(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async signup(nick: string, email: string, pin: string, muralOptIn: boolean) {
    const normalizedPin = normalizePassword(pin);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: normalizedPin,
      options: {
        data: { nick, mural_opt_in: muralOptIn },
        emailRedirectTo: getLoginUrl(),
      },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getProfile(userId: string): Promise<Profile | null> {
    let { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (!data) {
      // Lazy-trigger migration from V1 to V2 if the profile does not exist yet
      const { data: migrationResult, error: migError } = await supabase.rpc("trigger_my_migration");
      if (!migError && (migrationResult as any)?.success) {
        const { data: refetched, error: refetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        if (!refetchError && refetched) {
          data = refetched;
        }
      }
    }

    return data as Profile | null;
  },

  async getStickers(): Promise<Sticker[]> {
    const { data, error } = await supabase
      .from("stickers")
      .select("*")
      .order("number", { ascending: true });
    if (error) throw new Error(error.message);
    const mappedStickers = (data || []).map((dbSticker: any) => {
      const seedSticker = SEED_STICKERS.find((s) => s.number === dbSticker.number);
      return {
        ...dbSticker,
        ilustrator: seedSticker?.ilustrator || null,
      } as Sticker;
    });

    // Position 360 must always be visible as a locked album slot, even before
    // the bonus is owned (or while PostgREST is still serving a stale schema cache).
    if (!mappedStickers.some((sticker) => sticker.number === 360)) {
      const bonusSticker = SEED_STICKERS.find((sticker) => sticker.number === 360);
      if (bonusSticker) mappedStickers.push({ ...bonusSticker, ilustrator: null } as Sticker);
    }

    return mappedStickers.sort((a, b) => a.number - b.number);
  },

  async getUserStickers(userId: string): Promise<UserSticker[]> {
    const { data, error } = await supabase.from("user_stickers").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return data as UserSticker[];
  },

  async addPurchasedStickers(userId: string, stickerNumbers: number[]) {
    const counts = stickerNumbers.reduce<Record<number, number>>((acc, number) => {
      acc[number] = (acc[number] || 0) + 1;
      return acc;
    }, {});
    const numbers = Object.keys(counts).map(Number);
    if (numbers.length === 0) return [];

    const { data: existing, error: readError } = await supabase
      .from("user_stickers")
      .select("sticker_number, copies, is_rare, first_unlocked_at")
      .eq("user_id", userId)
      .in("sticker_number", numbers);
    if (readError) throw new Error(readError.message);

    const existingByNumber = new Map((existing || []).map((row: any) => [row.sticker_number, row]));
    const rows = numbers.map((number) => {
      const current = existingByNumber.get(number);
      return {
        user_id: userId,
        sticker_number: number,
        copies: (current?.copies || 0) + counts[number],
        is_rare: canHaveRareVersion(number) ? current?.is_rare || false : false,
        first_unlocked_at: current?.first_unlocked_at || new Date().toISOString(),
      };
    });

    const { data, error } = await supabase
      .from("user_stickers")
      .upsert(rows, { onConflict: "user_id,sticker_number" })
      .select("*");
    if (error) throw new Error(error.message);
    return data as UserSticker[];
  },

  async getPublicUserStickers(userId: string): Promise<UserSticker[]> {
    const { data, error } = await supabase.rpc("get_public_album", { profile_id: userId });
    if (error) throw new Error(error.message);
    return data as any[];
  },

  async getPublicMural(): Promise<any[]> {
    const now = Date.now();
    if (publicMuralCache && now - publicMuralCachedAt < PUBLIC_MURAL_CACHE_TTL_MS) {
      return publicMuralCache;
    }

    // Reuse an in-flight request so simultaneous route loaders and components
    // do not download the same public ranking more than once.
    if (publicMuralRequest) return publicMuralRequest;

    publicMuralRequest = (async () => {
      const { data, error } = await supabase.rpc("get_public_mural");
      if (error) throw new Error(error.message);
      publicMuralCache = data || [];
      publicMuralCachedAt = Date.now();
      return publicMuralCache;
    })();

    try {
      return await publicMuralRequest;
    } finally {
      publicMuralRequest = null;
    }
  },

  async getCompletedMissions(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("mission_completions")
      .select("mission_id")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data || []).map((row) => row.mission_id);
  },

  async getClaimedToday(userId: string): Promise<boolean> {
    const today = getLocalDateStr();
    const { data, error } = await supabase
      .from("daily_claims")
      .select("day")
      .eq("user_id", userId)
      .eq("day", today)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return !!data;
  },

  async getClaimedDailyStyle(userId: string): Promise<string | null> {
    const today = getLocalDateStr();
    const { data, error } = await supabase
      .from("daily_claims")
      .select("style_id")
      .eq("user_id", userId)
      .eq("day", today)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.style_id || null;
  },

  async getMural(): Promise<any[]> {
    return this.getPublicMural();

    const { data: profiles, error: pError } = await supabase
      .from("profiles")
      .select("id, nick, avatar_emoji, avatar_url")
      .eq("mural_opt_in", true);
    if (pError) throw new Error(pError?.message);

    const profileIds = (profiles || []).map((p) => p.id);

    let userStickers: any[] = [];
    if (profileIds.length > 0) {
      const { data: stickers, error: sError } = await supabase
        .from("user_stickers")
        .select("user_id, copies")
        .in("user_id", profileIds)
        .gt("copies", 0);
      if (sError) throw new Error(sError?.message);
      userStickers = stickers || [];
    }

    const mapped = (profiles || []).map((p: any) => {
      const owned = userStickers.filter((us) => us.user_id === p.id).length;
      const pct = Math.round((owned / 360) * 100);
      return {
        id: p.id,
        nick: p.nick,
        avatar: p.avatar_url || p.avatar_emoji || "📷",
        count: owned,
        pct,
      };
    });

    return mapped.sort((a, b) => {
      if (b.pct !== a.pct) return b.pct - a.pct;
      return a.nick.localeCompare(b.nick);
    });
  },

  async getAlbumRewardClaimed(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("album_completion_rewards")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) return false;
      return !!data;
    } catch {
      return false;
    }
  },

  async claimAlbumCompletionReward(): Promise<{ claimed: boolean; rare_numbers: number[]; message: string }> {
    const { data, error } = await supabase.rpc("claim_album_completion_reward");
    if (error) throw new Error(error.message);
    return data;
  },

  async getUserStyles(userId: string): Promise<UserStyle[]> {
    const { data, error } = await supabase.from("user_styles").select("*").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return data as UserStyle[];
  },

  async getDailyClaimsCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("daily_claims")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return count || 0;
  },

  async getReleaseDayNumber(): Promise<number> {
    const { data: settings, error: sError } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "release_date")
      .maybeSingle();
    if (sError) throw new Error(sError.message);

    const releaseDateStr = settings?.value || "2026-07-02";
    const releaseDate = new Date(releaseDateStr + "T00:00:00Z");
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - releaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  async loadTestUserComplete() {
    throw new Error("Não disponível em produção.");
  },

  async loadTestUserBeginner() {
    throw new Error("Não disponível em produção.");
  },

  async answerQuiz(stickerNumber: number, qIndex: number, chosenIndex: number) {
    const { data, error } = await supabase.rpc("answer_quiz", {
      sticker_number_param: stickerNumber,
      q_index_param: qIndex,
      chosen_index_param: chosenIndex,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async startQuizQuestionTimer(stickerNumber: number, qIndex: number) {
    const { data, error } = await supabase.rpc("start_quiz_question_timer", {
      sticker_number_param: stickerNumber,
      q_index_param: qIndex,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async redeemCode(code: string) {
    const { data, error } = await supabase.rpc("redeem_code", {
      code_param: code,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async generateDonation(stickerNumber: number) {
    const { data, error } = await supabase.rpc("generate_donation", {
      sticker_number_param: stickerNumber,
    });
    if (error) throw new Error(error.message);
    return data as string;
  },

  async getOutgoingDonations(userId: string): Promise<Donation[]> {
    // Use a security definer RPC to safely read donations for the current user
    // (both sent and received) regardless of RLS SELECT policies.
    const { data, error } = await supabase.rpc("get_my_donations");
    if (error) throw new Error(error.message);

    return ((data || []) as any[]).map((d) => ({
      code: d.code,
      sticker_number: d.sticker_number,
      status: d.status,
      created_at: d.created_at,
      expires_at: d.expires_at,
      from_user: d.from_user,
      to_user: d.to_user,
      donor_nick: d.donor_nick ?? null,
      receiver_nick: d.receiver_nick ?? null,
    })) as Donation[];
  },

  async redeemDonation(code: string) {
    const { data, error } = await supabase.rpc("redeem_donation", {
      code_param: code,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async expireDonations() {
    const { data, error } = await supabase.rpc("expire_donations");
    if (error) throw new Error(error.message);
    return data;
  },

  async completeMission(missionId: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Não autenticado");

    const { data, error } = await supabase.rpc("complete_mission", {
      mission_id_param: missionId,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async claimDailyElement() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Não autenticado");

    const { data, error } = await supabase.rpc("claim_daily_element");
    if (error) throw new Error(error.message);
    return data;
  },

  async getQuizQuestionsForToday() {
    const { error: timerError } = await supabase.rpc("expire_quiz_question_timers");
    if (timerError) throw new Error(timerError.message);
    const { data, error } = await supabase.rpc("get_quiz_questions_for_today");
    if (error) throw new Error(error.message);
    return data;
  },

  async updateNickname(nick: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Não autenticado");

    const { error: directUpdateError } = await supabase
      .from("profiles")
      .update({ nick })
      .eq("id", user.id);
    if (directUpdateError) throw new Error(directUpdateError.message);
  },

  async updatePassword(password: string) {
    const normalizedPin = normalizePassword(password);
    const { error } = await supabase.auth.updateUser({
      password: normalizedPin,
    });
    if (error) throw new Error(error.message);
  },

  async updateAvatarEmoji(emoji: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Não autenticado");

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_emoji: emoji, avatar_url: null })
      .eq("id", user.id);
    if (error) throw new Error(error.message);
  },

  async updateAvatarPhoto(photoBase64: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Não autenticado");

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: photoBase64, avatar_emoji: null })
      .eq("id", user.id);
    if (error) throw new Error(error.message);
  },

  async toggleMural(optIn: boolean) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Não autenticado");

    const { error } = await supabase
      .from("profiles")
      .update({ mural_opt_in: optIn })
      .eq("id", user.id);
    if (error) throw new Error(error.message);
  },

  async toggleStyle(styleId: string, enabled: boolean) {
    const { error } = await supabase.rpc("toggle_style", {
      style_id_param: styleId,
      enabled_param: enabled,
    });
    if (error) throw new Error(error.message);
    return;

    const user = await this.getCurrentUser();
    if (!user) throw new Error("Não autenticado");

    const { error: ignoredDirectStyleError } = await supabase
      .from("user_styles")
      .update({ enabled })
      .eq("user_id", user!.id)
      .eq("style_id", styleId);
    if (ignoredDirectStyleError) throw new Error(ignoredDirectStyleError?.message);
  },

  async getUserMuralRank(userId: string): Promise<number | null> {
    const { data, error } = await supabase.rpc("get_user_mural_rank", { user_id_param: userId });
    if (error) {
      console.error("Error fetching user rank:", error);
      return null;
    }
    return data;
  },

  async verifyPassword(password: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user || !user.email) return false;
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      // PINs are stored normalized so Supabase can accept their 4-digit form.
      // Use the same value as login; otherwise every valid PIN is rejected here.
      password: normalizePassword(password),
    });
    return !error;
  },

  async deleteUserAccount(): Promise<void> {
    const { error } = await supabase.rpc("delete_user_account");
    if (error) throw new Error(error.message);

    // Deleting auth.users does not clear the browser's persisted session by
    // itself. Clear it now so the deleted user cannot render the dashboard
    // fallback profile during the redirect to login.
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) console.warn("Error clearing deleted-user session:", signOutError.message);
  },

  async syncRecentStickers(recent: number[]) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Não autenticado");

    const { error } = await supabase
      .from("profiles")
      .update({ recent_stickers: recent })
      .eq("id", user.id);
    if (error) throw new Error(error.message);
  },

  async syncPendingPack(pending: any) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Não autenticado");

    const { error } = await supabase
      .from("profiles")
      .update({ pending_pack: pending })
      .eq("id", user.id);
    if (error) throw new Error(error.message);
  },

  async syncRevealsQueue(queue: any[]) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Não autenticado");

    const { error } = await supabase
      .from("profiles")
      .update({ reveals_queue: queue })
      .eq("id", user.id);
    if (error) throw new Error(error.message);
  },

  async getCompletedTags(): Promise<{ tag_name: string; claimed: boolean }[]> {
    const { data, error } = await supabase
      .from("completed_tags")
      .select("tag_name, claimed");
    if (error) throw new Error(error.message);
    return data || [];
  },

  async claimCollectionReward(tagName: string) {
    const { data, error } = await supabase.rpc("claim_collection_reward", {
      tag_name_param: tagName,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  // ── TRADE SYSTEM ──────────────────────────────────────────────

  async lookupUserByNick(nick: string): Promise<TradeUserLookup> {
    const { data, error } = await supabase.rpc("lookup_user_by_nick", {
      nick_param: nick,
    });
    if (error) throw new Error(error.message);
    return data as TradeUserLookup;
  },

  async createTradeRequest(
    receiverNick: string,
    mySticker: number,
    desiredSticker: number,
    category: "free" | "shop",
  ) {
    const { data, error } = await supabase.rpc("create_trade_request", {
      receiver_nick_param: receiverNick,
      my_sticker_param: mySticker,
      desired_sticker_param: desiredSticker,
      category_param: category,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async getIncomingTrades(): Promise<TradeRequest[]> {
    const { data, error } = await supabase.rpc("get_incoming_trades");
    if (error) throw new Error(error.message);
    return (data || []) as TradeRequest[];
  },

  async getOutgoingTrades(): Promise<TradeRequest[]> {
    const { data, error } = await supabase.rpc("get_outgoing_trades");
    if (error) throw new Error(error.message);
    return (data || []) as TradeRequest[];
  },

  async respondToTrade(tradeId: string, accept: boolean) {
    const { data, error } = await supabase.rpc("respond_to_trade", {
      trade_id_param: tradeId,
      accept_param: accept,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async cancelTrade(tradeId: string) {
    const { data, error } = await supabase.rpc("cancel_trade", {
      trade_id_param: tradeId,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async getPointsBalance(): Promise<number> {
    const { data, error } = await supabase.rpc("get_points_balance");
    if (error) throw new Error(error.message);
    return (data as number) || 0;
  },

  async exchangeForPoints(stickerNumber: number) {
    const { data, error } = await supabase.rpc("exchange_for_points", {
      sticker_number_param: stickerNumber,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async applyPointsToPurchaseOrder(orderId: string, requestedPoints: number) {
    const { data, error } = await supabase.rpc("apply_points_to_purchase_order", {
      order_id_param: orderId,
      requested_points_param: requestedPoints,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async spendShopCheckoutPoints(requestedPoints: number, cartPointTotal: number) {
    const { data, error } = await supabase.rpc("spend_shop_checkout_points", {
      requested_points_param: requestedPoints,
      cart_point_total_param: cartPointTotal,
    });
    if (error) throw new Error(error.message);
    return data as { points_used: number; new_balance: number };
  },

  async getPurchaseOrders() {
    const { data: orders, error: orderError } = await supabase
      .from("purchase_orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (orderError) throw new Error(orderError.message);

    const orderIds = (orders || []).map((order: any) => order.id);
    if (orderIds.length === 0) return [];

    const [{ data: items, error: itemsError }, { data: packs, error: packsError }, { data: packStickers, error: stickersError }, { data: payments, error: paymentsError }] =
      await Promise.all([
        supabase.from("purchase_order_items").select("*").in("order_id", orderIds),
        supabase.from("purchase_packs").select("*").in("order_id", orderIds).order("pack_number", { ascending: true }),
        supabase.from("purchase_pack_stickers").select("*, stickers(number, slug, name, author, ilustrator)").in("order_id", orderIds).order("position", { ascending: true }),
        supabase.from("purchase_payments").select("*").in("order_id", orderIds).order("created_at", { ascending: false }),
      ]);

    if (itemsError) throw new Error(itemsError.message);
    if (packsError) throw new Error(packsError.message);
    if (stickersError) throw new Error(stickersError.message);
    if (paymentsError) throw new Error(paymentsError.message);

    return (orders || []).map((order: any) => ({
      ...order,
      items: (items || []).filter((item: any) => item.order_id === order.id),
      packs: (packs || []).filter((pack: any) => pack.order_id === order.id),
      packStickers: (packStickers || []).filter((sticker: any) => sticker.order_id === order.id),
      payments: (payments || []).filter((payment: any) => payment.order_id === order.id),
    }));
  },

  async openPurchasedPack(packId: string) {
    const { data, error } = await supabase.rpc("open_purchased_pack", {
      pack_id_param: packId,
    });
    if (error) throw new Error(error.message);
    return data as RevealItem[];
  },

  async countIncomingPendingTrades(): Promise<number> {
    const { data, error } = await supabase.rpc("count_incoming_pending_trades");
    if (error) return 0;
    return (data as number) || 0;
  },

  async getResolvedTrades(): Promise<TradeRequest[]> {
    const { data, error } = await supabase.rpc("get_resolved_trades");
    if (error) throw new Error(error.message);
    return (data || []) as TradeRequest[];
  },

  async claimTradeReward(tradeId: string) {
    const { data, error } = await supabase.rpc("claim_trade_reward", {
      trade_id_param: tradeId,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async validateAndUpdateNick(nick: string) {
    const { data, error } = await supabase.rpc("validate_and_update_nick", {
      new_nick_param: nick,
    });
    if (error) throw new Error(error.message);
    return data;
  },
};

