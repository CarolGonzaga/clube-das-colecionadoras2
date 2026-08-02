import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRevealItems } from "./reveals.ts";

test("mantem recompensa de poster mesmo sem figurinha real", () => {
  const [poster] = normalizeRevealItems({
    slug: "poster",
    number: 0,
    wasNew: true,
    isRare: false,
    repeat: false,
    reward: "poster",
    rewardMessage: "Album Basico Completo",
  });

  assert.equal(poster.number, 0);
  assert.equal(poster.slug, "poster");
  assert.equal(poster.reward, "poster");
  assert.equal(poster.wasNew, true);
});

test("descarta itens sem numero valido quando nao sao recompensas puras", () => {
  const items = normalizeRevealItems([
    { slug: "invalida", number: 0 },
    { slug: "extra", number: 360, reward: "collection_1_359" },
  ]);

  assert.deepEqual(
    items.map((item) => item.number),
    [360],
  );
});

