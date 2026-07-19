import type { Sticker, UserSticker } from "@/lib/types";

export const TOTAL_ALBUM_STICKERS = 360;

export function getStickerCategory(stickerOrNumber: Sticker | number) {
  const number = typeof stickerOrNumber === "number" ? stickerOrNumber : stickerOrNumber.number;
  if (number >= 1 && number <= 20) return "quiz";
  if (number >= 320 && number <= 360) return "exclusiva";
  return "comum";
}

export function isExclusiveSticker(stickerOrNumber: Sticker | number) {
  return getStickerCategory(stickerOrNumber) === "exclusiva";
}

export function canHaveRareVersion(stickerOrNumber: Sticker | number) {
  const number = typeof stickerOrNumber === "number" ? stickerOrNumber : stickerOrNumber.number;
  return number >= 1 && number <= 20;
}

export function isRareStickerVersion(stickerOrNumber: Sticker | number, info?: UserSticker | null) {
  return !!info?.is_rare && canHaveRareVersion(stickerOrNumber);
}

export function getVisibleStickerTag(sticker: Sticker, info?: UserSticker | null) {
  if (isExclusiveSticker(sticker)) return "exclusiva";
  if (isRareStickerVersion(sticker, info)) return "rara";
  return "comum";
}
