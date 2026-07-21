import type { RevealItem } from "./types";

/**
 * Normalizes every historical RPC/pending-pack shape into RevealItem[].
 * Some users can still have an old malformed pending_pack persisted in their
 * profile, so normalizing only the latest RPC response is not sufficient.
 */
export function normalizeRevealItems(value: unknown): RevealItem[] {
  const normalized: RevealItem[] = [];

  const visit = (entry: unknown) => {
    if (Array.isArray(entry)) {
      entry.forEach(visit);
      return;
    }

    if (!entry || typeof entry !== "object") return;

    const candidate = entry as Record<string, unknown>;
    const number = Number(candidate.number);
    if (!Number.isInteger(number) || number <= 0) return;

    normalized.push({
      ...(candidate as unknown as RevealItem),
      number,
      slug: typeof candidate.slug === "string" ? candidate.slug : `frase-${number}`,
      wasNew: candidate.wasNew === true,
      isRare: candidate.isRare === true,
      repeat: candidate.repeat === true,
      reward: typeof candidate.reward === "string" ? candidate.reward : null,
    });
  };

  visit(value);
  return normalized;
}
