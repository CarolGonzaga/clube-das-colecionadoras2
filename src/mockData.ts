import type { DuplicateSticker, StickerPack } from "./types";

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
