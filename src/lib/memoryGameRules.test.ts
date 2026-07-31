import assert from "node:assert/strict";
import test from "node:test";
import { MEMORY_PAIR_COUNTS, validateMemoryDeck } from "./memoryGameRules.ts";

for (const [difficulty, pairs] of Object.entries(MEMORY_PAIR_COUNTS)) {
  test(`${difficulty} exige ${pairs} pares e ${pairs * 2} cartas`, () => {
    const deck = Array.from({ length: pairs }, (_, pair) =>
      [0, 1].map((copy) => ({
        id: `${pair}-${copy}`,
        pairKey: `pair-${pair}`,
        position: pair * 2 + copy,
      })),
    ).flat();
    assert.equal(validateMemoryDeck(deck, difficulty as keyof typeof MEMORY_PAIR_COUNTS), true);
  });
}

test("rejeita instância, posição ou quantidade de cópias inválida", () => {
  const valid = Array.from({ length: 6 }, (_, pair) =>
    [0, 1].map((copy) => ({
      id: `${pair}-${copy}`,
      pairKey: `pair-${pair}`,
      position: pair * 2 + copy,
    })),
  ).flat();
  assert.equal(validateMemoryDeck(valid.slice(1), "easy"), false);
  assert.equal(
    validateMemoryDeck(
      valid.map((card, index) => ({ ...card, position: index ? card.position : 1 })),
      "easy",
    ),
    false,
  );
  assert.equal(
    validateMemoryDeck(
      valid.map((card, index) => ({ ...card, id: index ? card.id : "0-1" })),
      "easy",
    ),
    false,
  );
});
