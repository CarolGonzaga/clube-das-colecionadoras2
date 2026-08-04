import assert from "node:assert/strict";
import test from "node:test";
import { validateCompletedPuzzleBoard } from "./puzzleGenerator.ts";

function completedBoard(rows: number, cols: number) {
  return Array.from({ length: rows * cols }, (_, id) => ({
    id,
    isPlaced: true,
    x: 220 + (id % cols) * 80,
    y: 160 + Math.floor(id / cols) * 80,
    rotation: 0,
  }));
}

test("aceita somente um quebra-cabeça completamente montado", () => {
  assert.equal(validateCompletedPuzzleBoard(completedBoard(4, 3), 4, 3), true);
});

test("rejeita peça ausente, duplicada, deslocada ou girada", () => {
  const base = completedBoard(4, 3);
  assert.equal(validateCompletedPuzzleBoard(base.slice(1), 4, 3), false);
  assert.equal(validateCompletedPuzzleBoard([...base.slice(0, -1), base[0]], 4, 3), false);
  assert.equal(
    validateCompletedPuzzleBoard(
      base.map((piece, index) => (index === 2 ? { ...piece, x: piece.x + 10 } : piece)),
      4,
      3,
    ),
    false,
  );
  assert.equal(
    validateCompletedPuzzleBoard(
      base.map((piece, index) => (index === 2 ? { ...piece, rotation: 90 } : piece)),
      4,
      3,
    ),
    false,
  );
});
