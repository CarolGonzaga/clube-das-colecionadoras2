import type { Sticker, UserSticker } from "@/lib/types";

export const TOTAL_ALBUM_STICKERS = 360;

export function getStickerCategory(stickerOrNumber: Sticker | number) {
  const number = typeof stickerOrNumber === "number" ? stickerOrNumber : stickerOrNumber.number;
  if (number >= 1 && number <= 20) return "quiz";
  if (number >= 330 && number <= 360) return "exclusiva";
  return "comum";
}

export function isExclusiveSticker(stickerOrNumber: Sticker | number) {
  return getStickerCategory(stickerOrNumber) === "exclusiva";
}

export function getVisibleStickerTag(sticker: Sticker, info?: UserSticker | null) {
  if (isExclusiveSticker(sticker)) return "exclusiva";
  if (info?.is_rare) return "rara";
  return "comum";
}
