import assert from "node:assert/strict";
import test from "node:test";
import {
  generateWordSearch,
  isStraightContinuousPath,
  maskHardModeWord,
  normalizeGameWord,
  pathsMatch,
  type WordSource,
} from "./wordSearchGenerator.ts";

const values = [
  "Romance",
  "Drama",
  "Fantasia",
  "Suspense",
  "Mistério",
  "Poesia",
  "Distopia",
  "Contemporâneo",
  "Slow burn",
  "Namoro falso",
  "Segunda chance",
  "Amor proibido",
  "Livraria",
  "Destino",
  "Encontro",
  "Orgulho",
  "Violetas",
  "Maré alta",
];
const candidates: WordSource[] = values.map((displayWord, index) => ({
  sourceType: index % 2 ? "genre" : "trope",
  sourceId: String(index),
  category: index % 2 ? "Gênero" : "Trope",
  displayWord,
  normalizedWord: normalizeGameWord(displayWord),
}));

test("normaliza acentos, espaços, hífens e pontuação sem alterar a origem", () => {
  const original = "Ficção científica!";
  assert.equal(normalizeGameWord(original), "FICCAOCIENTIFICA");
  assert.equal(original, "Ficção científica!");
});

test("oculta palavras do nível difícil mantendo somente a primeira e a última letra", () => {
  assert.equal(maskHardModeWord("Romance"), "R_____e");
  assert.equal(maskHardModeWord("Maré alta"), "M___ ___a");
  assert.equal(maskHardModeWord("Oi"), "Oi");
});

test("compara coordenadas sem depender da ordem das chaves do JSONB", () => {
  const selected = [
    { row: 2, col: 4 },
    { row: 3, col: 4 },
    { row: 4, col: 4 },
  ];
  const fromJsonb = JSON.parse('[{"col":4,"row":2},{"col":4,"row":3},{"col":4,"row":4}]');
  assert.equal(pathsMatch(selected, fromJsonb), true);
  assert.equal(pathsMatch([...selected].reverse(), fromJsonb), true);
  assert.equal(
    pathsMatch(
      [
        { row: 2, col: 4 },
        { row: 3, col: 5 },
        { row: 4, col: 4 },
      ],
      fromJsonb,
    ),
    false,
  );
});

test("fácil gera 7 palavras com horizontal, vertical e diagonal, sem inversões", () => {
  const game = generateWordSearch(candidates, "easy", "easy-test");
  assert.equal(game.words.length, 7);
  assert.ok(game.words.some((word) => word.direction === "right"));
  assert.ok(game.words.some((word) => word.direction === "down"));
  assert.ok(game.words.some((word) => word.direction === "downRight"));
  assert.ok(game.words.every((word) => !word.isReversed));
});

test("médio gera 5 palavras, pelo menos 2 diagonais e 2 inversões", () => {
  const game = generateWordSearch(candidates, "medium", "medium-test");
  assert.equal(game.words.length, 5);
  assert.ok(game.words.some((word) => ["right", "left"].includes(word.direction)));
  assert.ok(game.words.some((word) => ["down", "up"].includes(word.direction)));
  assert.ok(
    game.words.some((word) =>
      ["downRight", "downLeft", "upRight", "upLeft"].includes(word.direction),
    ),
  );
  assert.ok(game.words.filter((word) => word.isReversed).length >= 2);
});

test("difícil gera 5 palavras completas com direções variadas e inversões", () => {
  const game = generateWordSearch(candidates, "hard", "hard-test");
  assert.equal(game.words.length, 5);
  assert.ok(game.words.some((word) => ["right", "left"].includes(word.direction)));
  assert.ok(game.words.some((word) => ["down", "up"].includes(word.direction)));
  assert.ok(
    game.words.some((word) =>
      ["downRight", "downLeft", "upRight", "upLeft"].includes(word.direction),
    ),
  );
  assert.ok(game.words.filter((word) => word.isReversed).length >= 2);
  for (const word of game.words) {
    assert.equal(word.path.length, word.normalizedWord.length);
    assert.equal(
      new Set(word.path.map((cell) => `${cell.row}:${cell.col}`)).size,
      word.path.length,
    );
  }
});

test("validação rejeita salto, curva, repetição e coordenada externa", () => {
  assert.equal(
    isStraightContinuousPath(
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ],
      10,
    ),
    true,
  );
  assert.equal(
    isStraightContinuousPath(
      [
        { row: 0, col: 0 },
        { row: 0, col: 2 },
      ],
      10,
    ),
    false,
  );
  assert.equal(
    isStraightContinuousPath(
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 1 },
      ],
      10,
    ),
    false,
  );
  assert.equal(
    isStraightContinuousPath(
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 0 },
      ],
      10,
    ),
    false,
  );
  assert.equal(
    isStraightContinuousPath(
      [
        { row: 9, col: 9 },
        { row: 10, col: 9 },
      ],
      10,
    ),
    false,
  );
});
