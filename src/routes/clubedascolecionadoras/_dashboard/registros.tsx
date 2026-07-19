import { createFileRoute, useLoaderData, useRouter } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, CircleHelp, PackageOpen, Coins, Ticket } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useUI } from "@/components/UIProvider";
import { purchaseStorage, type SimPurchaseRecord } from "@/lib/shopSimulation";
import { redeemCodeAction } from "@/lib/actions";
import { dbService } from "@/lib/db";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/registros")({
  component: RegistrosPage,
});

function stickerTotalForPurchaseItem(item: SimPurchaseRecord["items"][number]) {
  if (item.kind === "pack") return item.id === "pack-combo" ? item.qty * 50 : item.qty * 5;
  return item.qty;
}

function formatItemCount(count: number) {
  return count === 1 ? "1 item" : `${count} itens`;
}

function formatStickerCount(count: number) {
  return count === 1 ? "1 figurinha" : `${count} figurinhas`;
}

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

  const openPointsHelp = () => {
    ui.openModal(
      <div className="points-help-modal">
        <CircleHelp size={30} />
        <h2>Como funcionam os pontos?</h2>
        <p>
          Pontos são créditos internos do Clube. Você pode ganhar pontos ao trocar figurinhas de
          loja repetidas na página de Trocas.
        </p>
        <p>
          Eles ficam salvos na sua conta e poderão ser usados em recursos da loja quando essa opção
          estiver disponível.
        </p>
        <button type="button" className="btn" onClick={ui.closeModal}>
          Entendi
        </button>
      </div>,
    );
  };

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

  const purchaseStickerHistory = useMemo(() => {
    return approvedPurchases
      .map((purchase) => {
        const itemGroups = purchase.items
          .map((item) => {
            const openedPacks = purchase.packs.filter(
              (pack) =>
                pack.status === "opened" &&
                (pack.sourceItemId
                  ? pack.sourceItemId === item.id
                  : item.kind === "pack" || item.kind === "single"),
            );
            const directStickers =
              item.kind === "exclusive"
                ? purchase.acquired.filter((sticker) => sticker.number === Number(item.id.replace("exclusive-", "")))
                : [];

            return {
              item,
              openedPacks,
              directStickers,
              stickerTotal:
                openedPacks.reduce((sum, pack) => sum + pack.reveals.length, 0) + directStickers.length,
            };
          })
          .filter((group) => group.stickerTotal > 0);

        const stickerTotal = itemGroups.reduce((sum, group) => sum + group.stickerTotal, 0);

        return {
          id: purchase.id,
          date: purchase.date,
          paymentConfirmedDate: purchase.paymentConfirmedDate || purchase.date,
          itemGroups,
          stickerTotal,
        };
      })
      .filter((purchase) => purchase.stickerTotal > 0);
  }, [approvedPurchases]);

  const finishedOrders = useMemo(() => {
    return approvedPurchases.map((purchase) => {
      const itemTotal = purchase.items.reduce((sum, item) => sum + item.qty, 0);
      const stickerTotal = purchase.items.reduce((sum, item) => sum + stickerTotalForPurchaseItem(item), 0);
      return {
        ...purchase,
        itemTotal,
        stickerTotal,
        paymentConfirmedDate: purchase.paymentConfirmedDate || purchase.date,
      };
    });
  }, [approvedPurchases]);

  const handleOpenPack = async (packId: string) => {
    const pack = pendingPacks.find((item) => item.id === packId);
    if (!pack) return;
    try {
      await dbService.addPurchasedStickers(
        parentData.profile.id,
        pack.reveals.map((item) => item.number),
      );
      purchaseStorage.markPackOpened(parentData.profile.id, pack.id, parentData.stickers);
      refreshPurchases();
      ui.showReveals(pack.reveals, pack.title);
      router.invalidate();
    } catch (error: any) {
      ui.toast(error?.message || "Erro ao registrar as figurinhas do pacote.");
    }
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
          <button
            type="button"
            className="points-help-btn"
            onClick={openPointsHelp}
            aria-label="Como funcionam os pontos?"
            title="Como funcionam os pontos?"
          >
            ?
          </button>
        </div>
      </div>

      {/* Code Redemption Input */}
      <div className="trade-redeem-section bg-white rounded-2xl border border-pink-200/60 shadow-sm p-4 mb-4">
        <h3 className="text-xs font-bold text-[#5c0d2b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Ticket className="w-4 h-4 text-[#C2185B]" /> Códigos do Lendo Sáficos
        </h3>
        <p className="text-[11px] text-[#bf2a5e]/80 mb-3">
          Os códigos são liberados pelo LS ao longo dos 5 dias do evento. Cada código pode ser usado uma única vez e tem o prazo de 24 horas para resgate. Fique de olho nas redes!
        </p>
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
          className="flex gap-2"
        >
          <input
            name="redeemCode"
            type="text"
            placeholder="Cole seu código aqui"
            disabled={redeemLoading}
            style={{ height: "40px" }}
            className="flex-1 min-w-0 px-3 border border-pink-200/60 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={redeemLoading}
            style={{ height: "40px" }}
            className="px-4 py-2 bg-gradient-to-r from-[#c1426d] to-[#9b2361] text-white rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center cursor-pointer"
          >
            {redeemLoading ? "Verificando..." : "Resgatar"}
          </button>
        </form>
      </div>

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
                  return (
                    <article className="registry-pack-card" key={pack.id}>
                      <div className="registry-pack-cover">
                        <PackageOpen size={24} />
                      </div>
                      <div>
                        <b>{pack.title}</b>
                        <span>Data da compra: {pack.date}</span>
                        <small>{formatStickerCount(pack.reveals.length)} aguardando abertura</small>
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
                  <article className="registry-purchase-card registry-order-card" key={order.id}>
                    <div className="registry-order-head">
                      <b>Pedido #{order.id.replace("purchase-", "")}</b>
                      <strong>{formatStickerCount(order.stickerTotal)}</strong>
                    </div>
                    <div className="registry-order-dates">
                      <span><b>Compra:</b> {order.date}</span>
                      <span><b>Pagamento confirmado:</b> {order.paymentConfirmedDate}</span>
                    </div>
                    <div className="registry-order-items">
                      {order.items.map((item) => (
                        <div className="registry-order-item" key={item.id}>
                          <span>{item.qty}x {item.name}</span>
                          <small>{formatStickerCount(stickerTotalForPurchaseItem(item))}</small>
                        </div>
                      ))}
                    </div>
                    <div className="registry-order-total">
                      <span>Quantidade total adquirida: {formatItemCount(order.itemTotal)}</span>
                      <span>Total de figurinhas adquiridas: {formatStickerCount(order.stickerTotal)}</span>
                    </div>
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

      {exclusiveTotal > 0 && <span className="sr-only">{exclusiveTotal} exclusivas adquiridas</span>}
    </main>
  );
}
