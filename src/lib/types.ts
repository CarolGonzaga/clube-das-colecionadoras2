import { z } from "zod";

export interface Sticker {
  number: number;
  slug: string;
  name: string;
  author: string | null;
  type: "quiz" | "sorteio" | "ls" | "frase";
  cover_url: string | null;
  amazon_url?: string | null;
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
}

export interface RevealItem {
  slug: string;
  number: number;
  wasNew: boolean;
  isRare: boolean;
  repeat: boolean;
  reward: string | null;
  rewardMessage?: string | null;
}

export const answerQuizSchema = z.object({
  stickerNumber: z.number().int().min(1).max(100),
  qIndex: z.number().int().min(0).max(1),
  chosenIndex: z.number().int().min(-1).max(3),
});

export const redeemCodeSchema = z.object({
  code: z.string().trim().min(1).max(50),
});

export const generateDonationSchema = z.object({
  stickerNumber: z.number().int().min(1).max(100),
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
