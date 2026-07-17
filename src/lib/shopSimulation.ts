import type { RevealItem, Sticker, UserSticker } from "@/lib/types";

export type SimPurchaseItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
  kind: "pack" | "single" | "rare";
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
};

export type SimAcquiredSticker = {
  number: number;
  name: string;
  author: string | null;
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
    wasNew: !owned,
    isRare,
    repeat: !!owned,
    reward: null,
  };
}

function stickerToAcquired(sticker: Sticker, date: string, source: string, kind: SimAcquiredSticker["kind"]) {
  return {
    number: sticker.number,
    name: sticker.name,
    author: sticker.author,
    kind,
    date,
    source,
  };
}

function getAcquiredKind(sticker: Sticker, isRare: boolean): SimAcquiredSticker["kind"] {
  if (isRare) return "rara";
  if (sticker.number >= 330 && sticker.number <= 360) return "exclusiva";
  return "comum";
}

function pickSticker(pool: Sticker[], usedNumbers: Set<number>) {
  const available = pool.filter((sticker) => !usedNumbers.has(sticker.number));
  const source = available.length > 0 ? available : pool;
  const picked = source[Math.floor(Math.random() * source.length)];
  if (picked) usedNumbers.add(picked.number);
  return picked;
}

export const purchaseStorage = {
  list(userId: string) {
    return readPurchases(userId);
  },

  markPackOpened(userId: string, packId: string, stickers: Sticker[]) {
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
            type: "sorteio",
            cover_url: null,
          };
          return stickerToAcquired(
            sticker || fallbackSticker,
            new Date().toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            pack.title,
            getAcquiredKind(sticker || fallbackSticker, item.isRare),
          );
        });
        return { ...pack, status: "opened" as const };
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
    const commonPool = stickers.filter((sticker) => sticker.number >= 21 && sticker.number <= 329);
    const rarePool = stickers.filter((sticker) => sticker.number >= 1 && sticker.number <= 20);
    const packs: SimPackRecord[] = [];
    const acquired: SimAcquiredSticker[] = [];
    const usedNumbers = new Set<number>();

    items.forEach((item) => {
      const packCount = item.kind === "pack" ? (item.id === "pack-combo" ? 10 * item.qty : item.qty) : 0;
      for (let packIndex = 0; packIndex < packCount; packIndex += 1) {
        const reveals = Array.from({ length: 5 }, () => {
          const sticker = pickSticker(commonPool, usedNumbers) || commonPool[0];
          return stickerToReveal(sticker, userStickers, false);
        });
        packs.push({
          id: `${purchaseId}-pack-${packs.length + 1}`,
          title: item.id === "pack-combo" ? "Combo com 10 pacotes" : "Pacote com 5 figurinhas",
          date,
          status: "pending",
          sourcePurchaseId: purchaseId,
          reveals,
        });
      }

      if (item.kind === "single") {
        for (let i = 0; i < item.qty; i += 1) {
          const sticker = pickSticker(commonPool, usedNumbers) || commonPool[0];
          packs.push({
            id: `${purchaseId}-single-${i + 1}`,
            title: "Figurinha unitária sortida",
            date,
            status: "pending",
            sourcePurchaseId: purchaseId,
            reveals: [stickerToReveal(sticker, userStickers, false)],
          });
        }
      }

      if (item.kind === "rare") {
        const rareNumber = Number(item.id.replace("rare-", ""));
        const sticker = rarePool.find((entry) => entry.number === rareNumber) || rarePool[0];
        for (let i = 0; i < item.qty; i += 1) {
          acquired.push(stickerToAcquired(sticker, date, "Rara individual", "rara"));
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
