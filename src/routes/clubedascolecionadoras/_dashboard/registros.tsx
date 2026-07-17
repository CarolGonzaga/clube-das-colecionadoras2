import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { CalendarDays, ChevronDown, ChevronUp, PackageOpen, Sparkles, Star } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useUI } from "@/components/UIProvider";
import { purchaseStorage, type SimPurchaseRecord } from "@/lib/shopSimulation";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/registros")({
  component: RegistrosPage,
});

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
  const parentData = useLoaderData({ from: "/clubedascolecionadoras/_dashboard" });
  const [purchases, setPurchases] = useState<SimPurchaseRecord[]>([]);

  const refreshPurchases = () => {
    setPurchases(purchaseStorage.list(parentData.profile.id));
  };

  useEffect(() => {
    refreshPurchases();
    window.addEventListener("purchase_records_change", refreshPurchases);
    window.addEventListener("storage", refreshPurchases);
    return () => {
      window.removeEventListener("purchase_records_change", refreshPurchases);
      window.removeEventListener("storage", refreshPurchases);
    };
  }, [parentData.profile.id]);

  const pendingPacks = purchases.flatMap((purchase) =>
    purchase.status === "approved" ? purchase.packs.filter((pack) => pack.status === "pending") : [],
  );
  const approvedPurchases = purchases.filter((purchase) => purchase.status === "approved");
  const pendingPurchases = purchases.filter((purchase) => purchase.status === "pending");
  const acquiredStickers = purchases.flatMap((purchase) => purchase.acquired);
  const commonTotal = acquiredStickers.filter((item) => item.kind === "comum").length;
  const rareTotal = acquiredStickers.filter((item) => item.kind === "rara").length;
  const exclusiveTotal = acquiredStickers.filter((item) => item.kind === "exclusiva").length;
  const lastPurchaseDate = purchases[0]?.date || "-";

  const latestStickers = useMemo(() => acquiredStickers.slice(0, 24), [acquiredStickers]);

  const handleOpenPack = (packId: string) => {
    const pack = pendingPacks.find((item) => item.id === packId);
    if (!pack) return;
    purchaseStorage.markPackOpened(parentData.profile.id, pack.id, parentData.stickers);
    refreshPurchases();
    ui.showReveals(pack.reveals, pack.title);
  };

  return (
    <main className="screen registry-screen">
      <h1 className="section-title">Registros</h1>
      <p className="section-sub">Acompanhe compras aprovadas, pacotes pendentes e figurinhas.</p>

      <section className="registry-dashboard compact">
        <article className="registry-stat">
          <PackageOpen size={18} />
          <span>compras</span>
          <b>{purchases.length}</b>
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
          <span>ultima</span>
          <b>{lastPurchaseDate}</b>
        </article>
      </section>

      {purchases.length === 0 ? (
        <section className="registry-empty-state">
          <PackageOpen size={34} />
          <b>Nenhuma compra registrada ainda</b>
          <p>Quando uma compra for finalizada na Loja, os pacotes e figurinhas aparecerão aqui.</p>
        </section>
      ) : (
        <>
          <AccordionSection title="Pacotes para abrir" count={`${pendingPacks.length} pendentes`}>
            {pendingPacks.length === 0 ? (
              <div className="empty">Nenhum pacote pendente no momento.</div>
            ) : (
              <div className="registry-pack-grid">
                {pendingPacks.map((pack) => {
                  const rareCount = pack.reveals.filter((item) => item.isRare).length;
                  const commonCount = pack.reveals.length - rareCount;
                  return (
                    <article className="registry-pack-card" key={pack.id}>
                      <div className="registry-pack-cover">
                        <PackageOpen size={24} />
                      </div>
                      <div>
                        <b>{pack.title}</b>
                        <span>{pack.date}</span>
                        <small>
                          {commonCount} comuns / {rareCount} raras
                        </small>
                      </div>
                      <button
                        type="button"
                        className="btn registry-open-btn"
                        onClick={() => handleOpenPack(pack.id)}
                      >
                        Abrir
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </AccordionSection>

          <AccordionSection title="Compras aprovadas" count={`${approvedPurchases.length} registros`}>
            <div className="registry-purchase-list">
              {approvedPurchases.map((purchase) => (
                <article className="registry-purchase-card" key={purchase.id}>
                  <div>
                    <b>{purchase.date}</b>
                    <span>
                      {purchase.items.map((item) => `${item.qty}x ${item.name}`).join(" · ")}
                    </span>
                  </div>
                  <strong>
                    {purchase.total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </strong>
                </article>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection
            title="Compras pendentes"
            count={`${pendingPurchases.length} pendentes`}
            defaultOpen={false}
          >
            {pendingPurchases.length === 0 ? (
              <div className="empty">Nenhuma compra aguardando confirmação de pagamento.</div>
            ) : (
              <div className="registry-purchase-list">
                {pendingPurchases.map((purchase) => (
                  <article className="registry-purchase-card" key={purchase.id}>
                    <div>
                      <b>{purchase.date}</b>
                      <span>
                        {purchase.items.map((item) => `${item.qty}x ${item.name}`).join(" · ")}
                      </span>
                    </div>
                    <strong>Aguardando</strong>
                  </article>
                ))}
              </div>
            )}
          </AccordionSection>

          <AccordionSection
            title="Ultimas figurinhas adquiridas"
            count={`${latestStickers.length} itens`}
            defaultOpen={false}
          >
            <div className="registry-sticker-grid">
              {latestStickers.map((sticker, index) => (
                <article className="registry-sticker-row" key={`${sticker.number}-${index}`}>
                  <div className="registry-sticker-number">
                    {String(sticker.number).padStart(3, "0")}
                  </div>
                  <div>
                    <b>{sticker.name}</b>
                    <span>
                      {sticker.author || "Autoria a definir"} · {sticker.source}
                    </span>
                  </div>
                  <small className={sticker.kind === "rara" ? "is-rare" : ""}>
                    {sticker.kind}
                  </small>
                </article>
              ))}
            </div>
          </AccordionSection>
        </>
      )}

      {exclusiveTotal > 0 && <span className="sr-only">{exclusiveTotal} exclusivas adquiridas</span>}
    </main>
  );
}
