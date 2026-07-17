import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ChevronDown, ChevronUp, PackageOpen, Sparkles, Star } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useUI } from "@/components/UIProvider";
import { RevealItem } from "@/lib/types";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/registros")({
  component: RegistrosPage,
});

type PackRecord = {
  id: string;
  title: string;
  date: string;
  status: "pending" | "opened";
  commonCount: number;
  rareCount: number;
  reveals: RevealItem[];
};

const pendingPacks: PackRecord[] = [
  {
    id: "pack-001",
    title: "Pacote da loja",
    date: "16/07/2026",
    status: "pending",
    commonCount: 4,
    rareCount: 1,
    reveals: [
      { slug: "sticker-1", number: 1, wasNew: true, isRare: false, repeat: false, reward: null },
      { slug: "sticker-8", number: 8, wasNew: false, isRare: false, repeat: true, reward: null },
      { slug: "sticker-22", number: 22, wasNew: true, isRare: false, repeat: false, reward: null },
      { slug: "sticker-41", number: 41, wasNew: true, isRare: false, repeat: false, reward: null },
      { slug: "sticker-96", number: 96, wasNew: true, isRare: true, repeat: false, reward: null },
    ],
  },
  {
    id: "pack-002",
    title: "Combo 3 pacotes",
    date: "15/07/2026",
    status: "pending",
    commonCount: 5,
    rareCount: 0,
    reveals: [
      { slug: "sticker-3", number: 3, wasNew: true, isRare: false, repeat: false, reward: null },
      { slug: "sticker-14", number: 14, wasNew: true, isRare: false, repeat: false, reward: null },
      { slug: "sticker-37", number: 37, wasNew: false, isRare: false, repeat: true, reward: null },
      { slug: "sticker-58", number: 58, wasNew: true, isRare: false, repeat: false, reward: null },
      { slug: "sticker-79", number: 79, wasNew: false, isRare: false, repeat: true, reward: null },
    ],
  },
];

const latestStickers = [
  { number: 96, name: "Figurinha rara", kind: "rara", date: "16/07/2026" },
  { number: 41, name: "Historia marcada", kind: "comum", date: "16/07/2026" },
  { number: 22, name: "Novo capitulo", kind: "comum", date: "16/07/2026" },
  { number: 8, name: "Repetida enviada para trocas", kind: "comum", date: "16/07/2026" },
];

function AccordionSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="registry-section">
      <button type="button" className="registry-section-head" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        <div className="registry-section-meta">
          {count && <small>{count}</small>}
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      {open && <div className="registry-section-body">{children}</div>}
    </section>
  );
}

function RegistrosPage() {
  const ui = useUI();
  const commonTotal = pendingPacks.reduce((sum, pack) => sum + pack.commonCount, 0);
  const rareTotal = pendingPacks.reduce((sum, pack) => sum + pack.rareCount, 0);
  const lastPurchaseDate = pendingPacks[0]?.date || "-";

  const handleOpenPack = (pack: PackRecord) => {
    ui.showReveals(pack.reveals, pack.title);
  };

  return (
    <main className="screen registry-screen">
      <h1 className="section-title">Registros</h1>
      <p className="section-sub">
        Acompanhe suas compras, pacotes pendentes e figurinhas recebidas.
      </p>

      <section className="registry-dashboard">
        <article className="registry-stat">
          <PackageOpen size={18} />
          <span>ultimas compras</span>
          <b>{pendingPacks.length}</b>
        </article>
        <article className="registry-stat">
          <Sparkles size={18} />
          <span>comuns</span>
          <b>{commonTotal}</b>
        </article>
        <article className="registry-stat">
          <Star size={18} />
          <span>raras</span>
          <b>{rareTotal}</b>
        </article>
        <article className="registry-stat">
          <CalendarDays size={18} />
          <span>ultima compra</span>
          <b>{lastPurchaseDate}</b>
        </article>
      </section>

      <AccordionSection title="Pacotes para abrir" count={`${pendingPacks.length} pendentes`}>
        <div className="registry-pack-list">
          {pendingPacks.map((pack) => (
            <article className="registry-pack-card" key={pack.id}>
              <div>
                <b>{pack.title}</b>
                <span>{pack.date}</span>
                <small>
                  {pack.commonCount} comuns / {pack.rareCount} raras
                </small>
              </div>
              <button type="button" className="btn registry-open-btn" onClick={() => handleOpenPack(pack)}>
                Abrir
              </button>
            </article>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection title="Ultimas figurinhas" count={`${latestStickers.length} itens`}>
        <div className="registry-sticker-list">
          {latestStickers.map((sticker) => (
            <article className="registry-sticker-row" key={`${sticker.number}-${sticker.date}`}>
              <div className="registry-sticker-number">{sticker.number}</div>
              <div>
                <b>{sticker.name}</b>
                <span>{sticker.date}</span>
              </div>
              <small className={sticker.kind === "rara" ? "is-rare" : ""}>{sticker.kind}</small>
            </article>
          ))}
        </div>
      </AccordionSection>
    </main>
  );
}
