import assert from "node:assert/strict";
import test from "node:test";
import { normalizeMemoryCoverPath } from "./memoryImagePath.ts";

test("normaliza todos os formatos aceitos para a pasta pública de capas", () => {
  const expected = "/covers-jogos/o-despertar-do-desejo.jpg";
  assert.equal(normalizeMemoryCoverPath("o-despertar-do-desejo.jpg"), expected);
  assert.equal(normalizeMemoryCoverPath("covers-jogos/o-despertar-do-desejo.jpg"), expected);
  assert.equal(normalizeMemoryCoverPath("public/covers-jogos/o-despertar-do-desejo.jpg"), expected);
  assert.equal(
    normalizeMemoryCoverPath(
      "D:\\temporarios\\Clube-das-Colecionadoras 2\\clube-das-colecionadoras2\\public\\covers-jogos\\o-despertar-do-desejo.jpg",
    ),
    expected,
  );
});

test("rejeita caminho vazio ou arquivo que não seja imagem", () => {
  assert.equal(normalizeMemoryCoverPath(null), null);
  assert.equal(normalizeMemoryCoverPath(""), null);
  assert.equal(normalizeMemoryCoverPath("arquivo.txt"), null);
});
