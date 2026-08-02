import assert from "node:assert/strict";
import test from "node:test";
import { calculateUsedDifficulties, getDailyGameDate } from "./dailyGamesPolicy.ts";

test("a virada diária segue o horário de São Paulo", () => {
  assert.equal(getDailyGameDate(new Date("2026-08-03T02:59:59Z")), "2026-08-02");
  assert.equal(getDailyGameDate(new Date("2026-08-03T03:00:00Z")), "2026-08-03");
});

test("o ciclo libera todos os níveis depois de fácil, médio e difícil", () => {
  assert.deepEqual(calculateUsedDifficulties(["easy"]), ["easy"]);
  assert.deepEqual(calculateUsedDifficulties(["easy", "medium"]), ["easy", "medium"]);
  assert.deepEqual(calculateUsedDifficulties(["easy", "medium", "hard"]), []);
  assert.deepEqual(calculateUsedDifficulties(["easy", "medium", "hard", "hard"]), ["hard"]);
});

test("somente dificuldades resgatadas entram no histórico do ciclo", () => {
  const claimedHistory = ["medium"] as const;
  assert.deepEqual(calculateUsedDifficulties(claimedHistory), ["medium"]);
});
