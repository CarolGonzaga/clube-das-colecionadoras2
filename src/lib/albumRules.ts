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
  const isLegacyRare = number >= 1 && number <= 20;
  const isNewRareLoja = [194, 258, 292, 298].includes(number);
  const isNewRareSorteio = [45, 47, 79, 112, 164, 167].includes(number);
  return isLegacyRare || isNewRareLoja || isNewRareSorteio;
}

export function isRareStickerVersion(stickerOrNumber: Sticker | number, info?: UserSticker | null) {
  return !!info?.is_rare && canHaveRareVersion(stickerOrNumber);
}

export function getVisibleStickerTag(sticker: Sticker, info?: UserSticker | null) {
  if (isExclusiveSticker(sticker)) return "exclusiva";
  if (isRareStickerVersion(sticker, info)) return "rara";
  return "comum";
}
