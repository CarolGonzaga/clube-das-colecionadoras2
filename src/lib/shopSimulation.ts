import type { RevealItem, Sticker, UserSticker } from "@/lib/types";

export type SimPurchaseItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
  kind: "pack" | "single" | "exclusive";
};

export type SimPurchaseRecord = {
  id: string;
  date: string;
  status: "approved" | "pending";
  items: SimPurchaseItem[];
  total: number;
  packs: SimPackRecord[];
  acquired: SimAcquiredSticker[];
};

export type SimPackRecord = {
  id: string;
  title: string;
  date: string;
  status: "pending" | "opened";
  sourcePurchaseId: string;
  reveals: RevealItem[];
  openedDate?: string;
};

export type SimAcquiredSticker = {
  number: number;
  slug: string;
  name: string;
  author: string | null;
  ilustrator?: string | null;
  kind: "comum" | "rara" | "exclusiva";
  date: string;
  source: string;
};

const PURCHASE_KEY = (userId: string) => `club_v2_purchases:${userId}`;

function readPurchases(userId: string): SimPurchaseRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(PURCHASE_KEY(userId));
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePurchases(userId: string, purchases: SimPurchaseRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PURCHASE_KEY(userId), JSON.stringify(purchases));
  window.dispatchEvent(new Event("purchase_records_change"));
}

function stickerToReveal(sticker: Sticker, userStickers: UserSticker[], isRare = false): RevealItem {
  const owned = userStickers.find((item) => item.sticker_number === sticker.number && item.copies > 0);
  return {
    slug: sticker.slug,
    number: sticker.number,
    name: sticker.name,
    author: sticker.author,
    wasNew: !owned,
    isRare,
    repeat: !!owned,
    reward: null,
  };
}

function stickerToAcquired(sticker: Sticker, date: string, source: string, kind: SimAcquiredSticker["kind"]) {
  return {
    number: sticker.number,
    slug: sticker.slug,
    name: sticker.name,
    author: sticker.author,
    ilustrator: sticker.ilustrator || null,
    kind,
    date,
    source,
  };
}

function getAcquiredKind(sticker: Sticker): SimAcquiredSticker["kind"] {
  if (sticker.number >= 320 && sticker.number <= 360) return "exclusiva";
  return "comum";
}

function addToSimulatedInventory(userStickers: UserSticker[], stickerNumber: number) {
  const existing = userStickers.find((item) => item.sticker_number === stickerNumber);
  if (existing) {
    existing.copies = (existing.copies || 0) + 1;
    return;
  }

  userStickers.push({
    sticker_number: stickerNumber,
    copies: 1,
    is_rare: false,
    first_unlocked_at: new Date().toISOString(),
  } as UserSticker);
}

/**
 * Draw stickers for a 5-card pack from the loja pool (194–329).
 * - 40% chance each slot is a duplicate from owned stickers (max 2 identical per pack).
 * - When user owns >= 50% of the album, duplicate chance rises to 47%.
 */
function buildPackReveals(
  lojaPool: Sticker[],
  userStickers: UserSticker[],
  albumTotal: number,
  packInternalUsed: Set<number>,
): RevealItem[] {
  const ownedCount = userStickers.filter((us) => us.copies > 0).length;
  const duplicateChance = ownedCount / albumTotal >= 0.5 ? 0.47 : 0.40;

  const ownedInPool = lojaPool.filter((s) => userStickers.some((us) => us.sticker_number === s.number && us.copies > 0));
  const unownedInPool = lojaPool.filter((s) => !userStickers.some((us) => us.sticker_number === s.number && us.copies > 0));

  const reveals: RevealItem[] = [];
  const duplicateCountInPack = new Map<number, number>();

  for (let i = 0; i < 5; i++) {
    let pick: Sticker | undefined;

    const tryDuplicate = Math.random() < duplicateChance && ownedInPool.length > 0;

    if (tryDuplicate) {
      const validDuplicates = ownedInPool.filter((s) => (duplicateCountInPack.get(s.number) || 0) < 2);
      if (validDuplicates.length > 0) {
        pick = validDuplicates[Math.floor(Math.random() * validDuplicates.length)];
        duplicateCountInPack.set(pick.number, (duplicateCountInPack.get(pick.number) || 0) + 1);
      }
    }

    if (!pick) {
      const available = unownedInPool.filter((s) => !packInternalUsed.has(s.number));
      if (available.length > 0) {
        pick = available[Math.floor(Math.random() * available.length)];
        packInternalUsed.add(pick.number);
      } else {
        const fallback = lojaPool.filter((s) => !packInternalUsed.has(s.number));
        pick = fallback.length > 0
          ? fallback[Math.floor(Math.random() * fallback.length)]
          : lojaPool[Math.floor(Math.random() * lojaPool.length)];
        if (pick) packInternalUsed.add(pick.number);
      }
    }

    if (pick) {
      reveals.push(stickerToReveal(pick, userStickers, false));
    }
  }

  return reveals;
}

export const purchaseStorage = {
  list(userId: string) {
    return readPurchases(userId);
  },

  markPackOpened(userId: string, packId: string, stickers: Sticker[]) {
    const nowStr = new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const purchases = readPurchases(userId).map((purchase) => {
      let acquiredFromOpenedPack: SimAcquiredSticker[] = [];
      const packs = purchase.packs.map((pack) => {
        if (pack.id !== packId || pack.status === "opened") return pack;
        acquiredFromOpenedPack = pack.reveals.map((item) => {
          const sticker = stickers.find((entry) => entry.number === item.number);
          const fallbackSticker: Sticker = {
            number: item.number,
            slug: item.slug,
            name: `Figurinha ${item.number}`,
            author: "Autoria a definir",
            type: "loja",
            cover_url: null,
          };
          return stickerToAcquired(
            sticker || fallbackSticker,
            nowStr,
            pack.title,
            getAcquiredKind(sticker || fallbackSticker),
          );
        });
        return { ...pack, status: "opened" as const, openedDate: nowStr };
      });

      return {
        ...purchase,
        packs,
        acquired: [...acquiredFromOpenedPack, ...purchase.acquired],
      };
    });
    writePurchases(userId, purchases);
  },

  createPurchase({
    userId,
    items,
    stickers,
    userStickers,
  }: {
    userId: string;
    items: SimPurchaseItem[];
    stickers: Sticker[];
    userStickers: UserSticker[];
  }) {
    const now = new Date();
    const date = now.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const purchaseId = `purchase-${now.getTime()}`;

    // Loja regular pool: 194–329 (excludes exclusives 330-360)
    const lojaPool = stickers.filter((s) => s.number >= 194 && s.number <= 319);
    const albumTotal = stickers.length;

    const packs: SimPackRecord[] = [];
    const acquired: SimAcquiredSticker[] = [];
    const simulatedUserStickers = userStickers.map((item) => ({ ...item }));

    items.forEach((item) => {
      const packCount = item.kind === "pack"
        ? (item.id === "pack-combo" ? 10 * item.qty : item.qty)
        : 0;

      for (let packIndex = 0; packIndex < packCount; packIndex += 1) {
        const packUsed = new Set<number>();
        const reveals = buildPackReveals(lojaPool, simulatedUserStickers, albumTotal, packUsed);
        reveals.forEach((reveal) => addToSimulatedInventory(simulatedUserStickers, reveal.number));

        packs.push({
          id: `${purchaseId}-pack-${packs.length + 1}`,
          title: "1x Pacote",
          date,
          status: "pending",
          sourcePurchaseId: purchaseId,
          reveals,
        });
      }

      if (item.kind === "single") {
        for (let i = 0; i < item.qty; i += 1) {
          const packUsed = new Set<number>();
          const unowned = lojaPool.filter(
            (s) => !packUsed.has(s.number) && !simulatedUserStickers.some((us) => us.sticker_number === s.number && us.copies > 0),
          );
          const pool = unowned.length > 0 ? unowned : lojaPool.filter((s) => !packUsed.has(s.number));
          const sticker = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : lojaPool[0];
          const reveal = stickerToReveal(sticker, simulatedUserStickers, false);
          if (sticker) addToSimulatedInventory(simulatedUserStickers, sticker.number);

          packs.push({
            id: `${purchaseId}-single-${i + 1}`,
            title: "1x Figurinha unitária sortida",
            date,
            status: "pending",
            sourcePurchaseId: purchaseId,
            reveals: [reveal],
          });
        }
      }

      if (item.kind === "exclusive") {
        // item.id format: "exclusive-NNN"
        const exclusiveNumber = Number(item.id.replace("exclusive-", ""));
        const sticker = stickers.find((s) => s.number === exclusiveNumber);
        if (sticker) {
          acquired.push(stickerToAcquired(sticker, date, "Exclusiva individual", "exclusiva"));
        }
      }
    });

    const purchase: SimPurchaseRecord = {
      id: purchaseId,
      date,
      status: "approved",
      items,
      total: items.reduce((sum, item) => sum + item.price * item.qty, 0),
      packs,
      acquired,
    };
    writePurchases(userId, [purchase, ...readPurchases(userId)]);
    return purchase;
  },
};
