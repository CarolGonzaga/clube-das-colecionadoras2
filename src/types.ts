export type AccessStatus = "none" | "v1" | "v2";

export type StickerPack = {
  id: string;
  title: string;
  source: "purchase" | "credit" | "migration_bonus";
  status: "ready_to_open" | "opened";
  createdAt: string;
  items: PackItem[];
};

export type PackItem = {
  number: number;
  name: string;
  isNew: boolean;
  isRare: boolean;
};

export type DuplicateSticker = {
  number: number;
  name: string;
  copies: number;
};

export type StoreItem = {
  id: string;
  number?: number;
  name: string;
  kind: "pack" | "common" | "rare";
  price: string;
  unavailable?: boolean;
};
