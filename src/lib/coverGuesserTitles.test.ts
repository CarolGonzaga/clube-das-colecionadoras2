import assert from "node:assert/strict";
import test from "node:test";
import { checkCoverAnswer } from "./coverGuesserTitles.ts";

test("aceita diferenças de acento, caixa e pontuação", () => {
  assert.equal(checkCoverAnswer("gap a teoria rosa", "GAP: A Teoria Rosa"), true);
  assert.equal(checkCoverAnswer("Às cegas com você", "As Cegas Com Voce"), true);
});

test("aceita o título principal sem subtítulo", () => {
  assert.equal(checkCoverAnswer("Inefável", "Inefável: Uma paixão inesquecível"), true);
});

test("rejeita um título diferente", () => {
  assert.equal(checkCoverAnswer("Outro livro", "Inefável: Uma paixão inesquecível"), false);
});
