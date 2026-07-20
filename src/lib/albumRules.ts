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

export const ALL_RARE_STICKER_NUMBERS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  45, 47, 79, 112, 164, 167, 194, 258, 292, 298,
];

export function canHaveRareVersion(stickerOrNumber: Sticker | number) {
  const number = typeof stickerOrNumber === "number" ? stickerOrNumber : stickerOrNumber.number;
  return ALL_RARE_STICKER_NUMBERS.includes(number);
}

export function isRareStickerVersion(stickerOrNumber: Sticker | number, info?: UserSticker | null) {
  return !!info?.is_rare && canHaveRareVersion(stickerOrNumber);
}

export function getVisibleStickerTag(sticker: Sticker, info?: UserSticker | null) {
  if (isExclusiveSticker(sticker)) return "exclusiva";
  if (isRareStickerVersion(sticker, info)) return "rara";
  return "comum";
}

export function getCollectionStatus(ownedCount: number) {
  const isComplete = ownedCount >= TOTAL_ALBUM_STICKERS;
  const pct = isComplete
    ? 100
    : Math.min(99, Math.floor((ownedCount / TOTAL_ALBUM_STICKERS) * 100));

  let statusText = "Coleção começando";
  let titleIcon = "/icons/iniciante.png";

  if (isComplete || pct >= 100) {
    statusText = "Coleção Purpurina";
    titleIcon = "/icons/purpurina.png";
  } else if (pct >= 66) {
    statusText = "Coleção Ouro";
    titleIcon = "/icons/ouro.png";
  } else if (pct >= 41) {
    statusText = "Coleção Prata";
    titleIcon = "/icons/prata.png";
  } else if (pct >= 16) {
    statusText = "Coleção Bronze";
    titleIcon = "/icons/bronze.png";
  } else {
    statusText = "Coleção começando";
    titleIcon = "/icons/iniciante.png";
  }

  return { pct, statusText, titleIcon };
}
