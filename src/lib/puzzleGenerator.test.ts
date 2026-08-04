import assert from "node:assert/strict";
import test from "node:test";
import { PUZZLE_GRID_CONFIG, validateCompletedPuzzleBoard } from "./puzzleGenerator.ts";

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

test("as três dificuldades possuem grades e quantidades de peças consistentes", () => {
  assert.deepEqual(PUZZLE_GRID_CONFIG.easy, {
    rows: 4,
    cols: 3,
    totalPieces: 12,
    label: "Fácil",
  });
  assert.deepEqual(PUZZLE_GRID_CONFIG.medium, {
    rows: 5,
    cols: 4,
    totalPieces: 20,
    label: "Médio",
  });
  assert.deepEqual(PUZZLE_GRID_CONFIG.hard, {
    rows: 6,
    cols: 5,
    totalPieces: 30,
    label: "Difícil",
  });
  for (const config of Object.values(PUZZLE_GRID_CONFIG)) {
    assert.equal(config.totalPieces, config.rows * config.cols);
  }
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
