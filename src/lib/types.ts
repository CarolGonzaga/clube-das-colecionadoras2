import { z } from "zod";

export interface Sticker {
  number: number;
  slug: string;
  name: string;
  author: string | null;
  type: "quiz" | "sorteio" | "ls" | "frase" | "loja" | "exclusiva";
  cover_url: string | null;
  category?: "quiz" | "comum" | "exclusiva" | null;
  amazon_url?: string | null;
  ilustrator?: string | null;
}

export interface Profile {
  id: string;
  nick: string;
  avatar_url: string | null;
  avatar_emoji: string | null;
  mural_opt_in: boolean;
  created_at: string;
  recent_stickers?: number[] | null;
  pending_pack?: any | null;
  reveals_queue?: any[] | null;
}

export interface UserSticker {
  user_id: string;
  sticker_number: number;
  copies: number;
  is_rare: boolean;
  first_unlocked_at: string;
}

export interface Style {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface UserStyle {
  user_id: string;
  style_id: string;
  unlocked: boolean;
  enabled: boolean;
}

export interface Donation {
  code: string;
  sticker_number: number;
  status: "active" | "used" | "expired";
  created_at: string;
  expires_at: string;
  receiver_nick?: string;
  donor_nick?: string;
  from_user?: string;
}

export interface TradeRequest {
  id: string;
  initiator_id?: string;
  receiver_id?: string;
  initiator_nick?: string;
  receiver_nick?: string;
  initiator_avatar_emoji?: string | null;
  initiator_avatar_url?: string | null;
  receiver_avatar_emoji?: string | null;
  receiver_avatar_url?: string | null;
  initiator_sticker: number;
  receiver_sticker: number;
  sticker_category: "free" | "shop";
  status: "pending" | "accepted" | "rejected" | "cancelled" | "expired";
  created_at: string;
  expires_at: string;
  resolved_at?: string | null;
  initiator_claimed?: boolean;
  receiver_claimed?: boolean;
  initiator_sticker_name?: string;
  receiver_sticker_name?: string;
}

export interface TradeUserLookup {
  user_id: string;
  nick: string;
  avatar_emoji: string | null;
  avatar_url: string | null;
  free_dupes: { sticker_number: number; name: string; copies: number }[];
  shop_dupes: { sticker_number: number; name: string; copies: number }[];
}

export interface PointTransaction {
  id: string;
  amount: number;
  reason: string;
  sticker_number: number | null;
  created_at: string;
}

export interface RevealItem {
  slug: string;
  number: number;
  name?: string;
  author?: string | null;
  wasNew: boolean;
  isRare: boolean;
  repeat: boolean;
  reward: string | null;
  rewardMessage?: string | null;
}

export const answerQuizSchema = z.object({
  stickerNumber: z.number().int().min(1).max(360),
  qIndex: z.number().int().min(0).max(1),
  chosenIndex: z.number().int().min(-1).max(3),
});

export const redeemCodeSchema = z.object({
  code: z.string().trim().min(1).max(50),
});

export const generateDonationSchema = z.object({
  stickerNumber: z.number().int().min(1).max(360),
});

export const redeemDonationSchema = z.object({
  code: z.string().trim().length(8),
});

export const completeMissionSchema = z.object({
  missionId: z.string().min(1),
});

export const updateProfileSchema = z.object({
  nick: z.string().trim().min(1).max(24).optional(),
  avatarEmoji: z.string().optional(),
  muralOptIn: z.boolean().optional(),
  styleId: z.string().optional(),
  styleEnabled: z.boolean().optional(),
});

export const validateNickSchema = z.object({
  nick: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(24, "Máximo 24 caracteres")
    .regex(/^[a-z0-9]+$/, "Use apenas letras minúsculas e números, sem espaços"),
});

export const createTradeRequestSchema = z.object({
  receiverNick: z.string().trim().min(1).max(24),
  mySticker: z.number().int().min(1).max(360),
  desiredSticker: z.number().int().min(1).max(360),
  category: z.enum(["free", "shop"]),
});

export const respondToTradeSchema = z.object({
  tradeId: z.string().uuid(),
  accept: z.boolean(),
});

export const cancelTradeSchema = z.object({
  tradeId: z.string().uuid(),
});

export const exchangeForPointsSchema = z.object({
  stickerNumber: z.number().int().min(201).max(360),
});
