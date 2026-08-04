import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDisplayedDifficulties,
  calculateUsedDifficulties,
  getDailyGameDate,
} from "./dailyGamesPolicy.ts";

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

test("mantém o nível do terceiro resgate marcado até a virada do dia", () => {
  const history = [
    { difficulty: "easy", rewardDate: "2026-08-02" },
    { difficulty: "medium", rewardDate: "2026-08-03" },
    { difficulty: "hard", rewardDate: "2026-08-04" },
  ] as const;
  assert.deepEqual(calculateDisplayedDifficulties(history, "2026-08-04"), ["hard"]);
  assert.deepEqual(calculateDisplayedDifficulties(history, "2026-08-05"), []);
});
