import type { DuplicateSticker, StickerPack, StoreItem } from "./types";

export const demoPacks: StickerPack[] = [
  {
    id: "pack-001",
    title: "Pacote comprado",
    source: "purchase",
    status: "ready_to_open",
    createdAt: "2026-07-15T12:00:00Z",
    items: [
      { number: 14, name: "Amor Fati", isNew: false, isRare: false },
      { number: 108, name: "Nova Autora", isNew: true, isRare: false },
      { number: 144, name: "Cena Especial", isNew: true, isRare: false },
      { number: 203, name: "Frase Colecionavel", isNew: true, isRare: false },
      { number: 287, name: "Rara Safica", isNew: true, isRare: true },
    ],
  },
  {
    id: "pack-002",
    title: "Pacote por creditos",
    source: "credit",
    status: "opened",
    createdAt: "2026-07-14T19:20:00Z",
    items: [
      { number: 2, name: "Cupidos Nao Se Apaixonam", isNew: false, isRare: false },
      { number: 77, name: "Colecao V1", isNew: false, isRare: false },
      { number: 155, name: "Livro Novo", isNew: true, isRare: false },
      { number: 188, name: "Autora Convidada", isNew: true, isRare: false },
      { number: 231, name: "Quote Especial", isNew: true, isRare: false },
    ],
  },
];

export const demoDuplicates: DuplicateSticker[] = [
  { number: 18, name: "Os Segredos Que Contei ao Oceano", copies: 2 },
  { number: 53, name: "Familia Baldaverso", copies: 1 },
  { number: 112, name: "Nova Figurinha V2", copies: 4 },
];

export const demoStoreItems: StoreItem[] = [
  { id: "pack-5", name: "Pacote com 5 figurinhas", kind: "pack", price: "R$ 4,90" },
  { id: "pack-15", name: "Combo com 3 pacotes", kind: "pack", price: "R$ 12,90" },
  { id: "common-108", number: 108, name: "Nova Autora", kind: "common", price: "8 creditos" },
  { id: "common-144", number: 144, name: "Cena Especial", kind: "common", price: "8 creditos" },
  { id: "common-203", number: 203, name: "Frase Colecionavel", kind: "common", price: "8 creditos" },
  { id: "rare-287", number: 287, name: "Rara Safica", kind: "rare", price: "R$ 6,90", unavailable: true },
  { id: "rare-291", number: 291, name: "Rara Dourada", kind: "rare", price: "R$ 6,90" },
  { id: "rare-294", number: 294, name: "Rara Autografada", kind: "rare", price: "R$ 6,90" },
];
