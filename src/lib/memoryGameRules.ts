import type { MemoryDifficulty } from "./memoryGame";

export const MEMORY_PAIR_COUNTS: Record<MemoryDifficulty, number> = {
  easy: 6,
  medium: 8,
  hard: 12,
};

export function validateMemoryDeck<T extends { id: string; pairKey: string; position: number }>(
  deck: T[],
  difficulty: MemoryDifficulty,
) {
  const expectedPairs = MEMORY_PAIR_COUNTS[difficulty];
  if (deck.length !== expectedPairs * 2) return false;
  if (new Set(deck.map((card) => card.id)).size !== deck.length) return false;
  if (new Set(deck.map((card) => card.position)).size !== deck.length) return false;
  const pairs = new Map<string, number>();
  deck.forEach((card) => pairs.set(card.pairKey, (pairs.get(card.pairKey) || 0) + 1));
  return pairs.size === expectedPairs && [...pairs.values()].every((count) => count === 2);
}
