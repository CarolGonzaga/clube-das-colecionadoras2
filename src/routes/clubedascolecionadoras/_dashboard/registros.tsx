import { createFileRoute, useLoaderData, useRouter } from "@tanstack/react-router";
import { CalendarDays, ChevronDown, ChevronUp, PackageOpen, Sparkles, Star, Coins, Gift } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useUI } from "@/components/UIProvider";
import { purchaseStorage, type SimPurchaseRecord } from "@/lib/shopSimulation";
import { redeemCodeAction } from "@/lib/actions";
import AutographSeal from "@/components/AutographSeal";
import Stamp from "@/components/Stamp";

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
  const router = useRouter();
  const parentData = useLoaderData({ from: "/clubedascolecionadoras/_dashboard" });
  const [purchases, setPurchases] = useState<SimPurchaseRecord[]>([]);
  const [redeemLoading, setRedeemLoading] = useState(false);

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

  const finishedOrders = useMemo(() => {
    return approvedPurchases.flatMap((purchase) => {
      const openedPacks = purchase.packs.filter((pack) => pack.status === "opened");
      const directItems = purchase.items.filter((item) => item.kind === "rare");
      return [
        ...openedPacks.map((pack) => ({
          id: pack.id,
          title: pack.title,
          purchaseDate: pack.date,
          redeemDate: pack.openedDate || pack.date,
          type: "Pacote Resgatado" as const,
          detail: `${pack.reveals.length} figurinhas`,
        })),
        ...directItems.flatMap((item) => 
          Array.from({ length: item.qty }, (_, i) => ({
            id: `${purchase.id}-direct-${item.id}-${i}`,
            title: item.name,
            purchaseDate: purchase.date,
            redeemDate: purchase.date,
            type: "Figurinha Avulsa" as const,
            detail: `Comprada diretamente`,
          }))
        )
      ];
    });
  }, [approvedPurchases]);

  const handleOpenPack = (packId: string) => {
    const pack = pendingPacks.find((item) => item.id === packId);
    if (!pack) return;
    purchaseStorage.markPackOpened(parentData.profile.id, pack.id, parentData.stickers);
    refreshPurchases();
    ui.showReveals(pack.reveals, pack.title);
    router.invalidate();
  };

  return (
    <main className="screen registry-screen">
      {/* Title block with Points Balance on the right */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h1 className="section-title">Pedidos</h1>
          <p className="section-sub">Acompanhe compras aprovadas, pacotes pendentes e figurinhas.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--blush)", padding: "6px 12px", borderRadius: "12px", color: "var(--magenta)", fontWeight: 800, fontSize: "14px" }}>
          <Coins size={16} />
          <span>{parentData.pointsBalance.toLocaleString("pt-BR")} pts</span>
        </div>
      </div>

      {/* Code Redemption Input */}
      <section style={{ background: "#fff", padding: "16px", borderRadius: "16px", border: "1px solid var(--blush)", boxShadow: "0 4px 15px rgba(216, 27, 122, 0.03)", marginBottom: "20px" }}>
        <h2 style={{ fontFamily: "Baloo 2", fontSize: "16px", color: "var(--wine)", margin: "0 0 10px", fontWeight: 800 }}>
          Resgatar Código
        </h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const input = (e.currentTarget.elements.namedItem("redeemCode") as HTMLInputElement).value;
            if (!input.trim()) return;
            setRedeemLoading(true);
            const res = await redeemCodeAction(input.trim());
            setRedeemLoading(false);
            if (res.success && res.data) {
              e.currentTarget.reset();
              ui.toast("Código resgatado com sucesso! 🎉");
              if (Array.isArray(res.data) && res.data.length > 0) {
                ui.showReveals(res.data, "Figurinhas do Código");
              } else if (res.data.reveals && Array.isArray(res.data.reveals)) {
                ui.showReveals(res.data.reveals, "Figurinhas do Código");
              }
              refreshPurchases();
              router.invalidate();
            } else {
              ui.toast(res.message || "Erro ao resgatar código.");
            }
          }}
          style={{ display: "flex", gap: "10px" }}
        >
          <input
            name="redeemCode"
            type="text"
            placeholder="Digite seu código de resgate"
            disabled={redeemLoading}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "12px",
              border: "1px solid var(--blush)",
              fontSize: "14px",
              outline: "none",
              background: "#fafafa",
              transition: "border-color 0.2s",
            }}
          />
          <button
            type="submit"
            disabled={redeemLoading}
            className="btn"
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              margin: 0,
            }}
          >
            {redeemLoading ? "Processando..." : "Resgatar"}
          </button>
        </form>
      </section>

      {/* Orders registry sections */}
      {purchases.length === 0 ? (
        <section className="registry-empty-state" style={{ marginBottom: "24px" }}>
          <PackageOpen size={34} />
          <b>Nenhum pedido registrado ainda</b>
          <p>Quando uma compra for finalizada na Loja, os pacotes e figurinhas aparecerão aqui.</p>
        </section>
      ) : (
        <>
          {/* 1. Pending packages to open */}
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
                        <span>Data da compra: {pack.date}</span>
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

          {/* 2. Finished orders (packs opened + direct singles) with purchase and redeem dates */}
          <AccordionSection title="Pedidos finalizados" count={`${finishedOrders.length} finalizados`}>
            {finishedOrders.length === 0 ? (
              <div className="empty">Nenhum pedido finalizado no momento.</div>
            ) : (
              <div className="registry-purchase-list">
                {finishedOrders.map((order) => (
                  <article className="registry-purchase-card" key={order.id} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px", padding: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <b style={{ color: "var(--wine)", fontFamily: "Baloo 2", fontSize: "14px" }}>{order.title}</b>
                      <span className="done-pill" style={{ background: "rgba(216, 27, 122, 0.08)", color: "var(--magenta)", padding: "2px 8px", borderRadius: "8px", fontSize: "10px", fontWeight: "bold" }}>
                        {order.type}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "11px", color: "rgba(75, 85, 99, 0.8)" }}>
                      <span><b>Compra:</b> {order.purchaseDate}</span>
                      <span><b>Resgate:</b> {order.redeemDate}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--magenta)" }}>{order.detail}</span>
                  </article>
                ))}
              </div>
            )}
          </AccordionSection>

          {/* 3. Pending purchases (waiting payment confirmations) */}
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
                    <strong style={{ color: "var(--wine)" }}>Aguardando</strong>
                  </article>
                ))}
              </div>
            )}
          </AccordionSection>

          {/* 4. Latest stickers acquired */}
          <AccordionSection
            title="Últimas figurinhas adquiridas"
            count={`${latestStickers.length} itens`}
            defaultOpen={false}
          >
            <div className="registry-sticker-grid">
              {latestStickers.map((sticker, index) => (
                <article className="registry-sticker-row" key={`${sticker.number}-${index}`}>
                  <div className={`registry-sticker-number ${sticker.kind === "rara" ? "rare-thumb" : ""}`}>
                    {sticker.kind === "rara" ? (
                      <>
                        <Stamp number={sticker.number} owned={true} auto={true} cover={sticker.slug} />
                        <AutographSeal author={sticker.author} />
                      </>
                    ) : (
                      String(sticker.number).padStart(3, "0")
                    )}
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

      {/* Stats Dashboard at the bottom */}
      <section className="registry-dashboard compact" style={{ marginTop: "24px" }}>
        <article className="registry-stat">
          <PackageOpen size={18} />
          <span>pedidos</span>
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
          <span>último</span>
          <b>{lastPurchaseDate}</b>
        </article>
      </section>

      {exclusiveTotal > 0 && <span className="sr-only">{exclusiveTotal} exclusivas adquiridas</span>}
    </main>
  );
}
