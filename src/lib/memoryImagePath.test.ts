import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { getMemoryCoverPath, normalizeMemoryCoverPath } from "./memoryImagePath.ts";

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

test("resolve os 67 IDs pelo catálogo canônico da pasta public/covers-jogos", () => {
  assert.equal(getMemoryCoverPath(361), "/covers-jogos/o-despertar-do-desejo.jpg");
  assert.equal(getMemoryCoverPath(427), "/covers-jogos/inefavel-uma-paixao-inesquecivel.jpg");
  assert.equal(getMemoryCoverPath(360), null);
  for (let id = 361; id <= 427; id += 1) {
    const publicPath = getMemoryCoverPath(id) || "";
    assert.match(publicPath, /^\/covers-jogos\/.+\.jpg$/);
    assert.equal(
      existsSync(join(process.cwd(), "public", publicPath)),
      true,
      `Capa ausente: ${publicPath}`,
    );
  }
});
