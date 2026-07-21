import { createFileRoute, useLoaderData, useRouter } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, CircleHelp, Coins, PackageOpen, Ticket } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useUI } from "@/components/UIProvider";
import { redeemCodeAction } from "@/lib/actions";
import { dbService } from "@/lib/db";
import { POINTS_BALANCE_CHANGED, readPointsBalanceFromEvent } from "@/lib/walletEvents";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/registros")({
  component: RegistrosPage,
});

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatStickerCount(count: number) {
  return count === 1 ? "1 figurinha" : `${count} figurinhas`;
}

function itemStickerTotal(item: any) {
  return Math.max(1, item.pack_count || 0) * Math.max(1, item.stickers_per_pack || 1) * item.quantity;
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
  const [orders, setOrders] = useState<any[]>([]);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [walletPoints, setWalletPoints] = useState(parentData.pointsBalance || 0);

  const refreshOrders = () => {
    dbService
      .getPurchaseOrders()
      .then(setOrders)
      .catch((error) => ui.toast(error?.message || "Erro ao carregar pedidos."));
  };

  useEffect(() => {
    refreshOrders();
    window.addEventListener("focus", refreshOrders);
    return () => window.removeEventListener("focus", refreshOrders);
  }, []);

  useEffect(() => {
    let alive = true;

    const refreshWallet = async () => {
      try {
        const balance = await dbService.getPointsBalance();
        if (alive) setWalletPoints(balance);
      } catch {
        // Keep the current visual balance if the request fails briefly.
      }
    };

    const handlePointsChange = (event: Event) => {
      const nextBalance = readPointsBalanceFromEvent(event);
      if (typeof nextBalance === "number") setWalletPoints(nextBalance);
      else refreshWallet();
    };

    refreshWallet();
    window.addEventListener(POINTS_BALANCE_CHANGED, handlePointsChange);
    window.addEventListener("focus", refreshWallet);
    return () => {
      alive = false;
      window.removeEventListener(POINTS_BALANCE_CHANGED, handlePointsChange);
      window.removeEventListener("focus", refreshWallet);
    };
  }, []);

  const approvedOrders = orders.filter((order) => order.payment_status === "approved");
  const pendingOrders = orders.filter((order) => ["unpaid", "pending"].includes(order.payment_status));
  const pendingPacks = approvedOrders.flatMap((order) =>
    (order.packs || []).filter((pack: any) => pack.status === "pending").map((pack: any) => ({ ...pack, order })),
  );

  const openedStickerEntries = orders.flatMap((order) =>
    (order.packStickers || []).map((entry: any) => ({ ...entry, order })),
  );

  const finishedOrders = useMemo(
    () =>
      approvedOrders.map((order) => {
        const stickerTotal = (order.items || []).reduce(
          (sum: number, item: any) => sum + itemStickerTotal(item),
          0,
        );
        const itemTotal = (order.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
        return { ...order, stickerTotal, itemTotal };
      }),
    [approvedOrders],
  );

  const openPointsHelp = () => {
    ui.openModal(
      <div className="points-help-modal">
        <CircleHelp size={30} />
        <h2>Como funcionam os pontos?</h2>
        <p>
          Pontos são créditos internos do Clube. Você pode ganhar pontos ao trocar figurinhas de
          loja repetidas na página de Trocas.
        </p>
        <p>Na loja, 1 ponto equivale a R$ 0,01 de desconto no carrinho.</p>
        <button type="button" className="btn" onClick={ui.closeModal}>
          Entendi
        </button>
      </div>,
    );
  };

  const handleOpenPack = async (packId: string) => {
    try {
      const reveals = await dbService.openPurchasedPack(packId);
      refreshOrders();
      ui.showReveals(reveals, "Pacote");
      await router.invalidate();
    } catch (error: any) {
      ui.toast(error?.message || "Erro ao abrir pacote.");
    }
  };

  return (
    <main className="screen registry-screen">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h1 className="section-title">Pedidos</h1>
          <p className="section-sub">Acompanhe compras aprovadas, pacotes pendentes e figurinhas.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--blush)", padding: "6px 12px", borderRadius: "12px", color: "var(--magenta)", fontWeight: 800, fontSize: "14px" }}>
          <Coins size={16} />
          <span>{walletPoints.toLocaleString("pt-BR")} pts</span>
          <button type="button" className="points-help-btn" onClick={openPointsHelp} aria-label="Como funcionam os pontos?">
            ?
          </button>
        </div>
      </div>

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
              ui.toast("Código resgatado com sucesso!");
              if (Array.isArray(res.data) && res.data.length > 0) ui.showReveals(res.data, "Figurinhas do Código");
              else if (res.data.reveals && Array.isArray(res.data.reveals)) ui.showReveals(res.data.reveals, "Figurinhas do Código");
              refreshOrders();
              await router.invalidate();
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

      {orders.length === 0 ? (
        <section className="registry-empty-state" style={{ marginBottom: "24px" }}>
          <PackageOpen size={34} />
          <b>Nenhum pedido registrado ainda</b>
          <p>Quando uma compra for finalizada na Loja, os pacotes e figurinhas aparecerão aqui.</p>
        </section>
      ) : (
        <>
          <AccordionSection title="Pacotes para abrir" count={`${pendingPacks.length} pendentes`}>
            {pendingPacks.length === 0 ? (
              <div className="empty">Nenhum pacote pendente no momento.</div>
            ) : (
              <div className="registry-pack-grid">
                {pendingPacks.map((pack) => (
                  <article className="registry-pack-card" key={pack.id}>
                    <div className="registry-pack-cover">
                      <PackageOpen size={24} />
                    </div>
                    <div>
                      <b>{pack.title}</b>
                      <span>Pedido #{pack.order.order_code || pack.order.id.slice(0, 8)}</span>
                      <small>Compra: {formatDate(pack.order.created_at)}</small>
                    </div>
                    <button type="button" className="btn registry-open-btn" onClick={() => handleOpenPack(pack.id)}>
                      Abrir
                    </button>
                  </article>
                ))}
              </div>
            )}
          </AccordionSection>

          <AccordionSection title="Pedidos finalizados" count={`${finishedOrders.length} finalizados`}>
            {finishedOrders.length === 0 ? (
              <div className="empty">Nenhum pedido finalizado no momento.</div>
            ) : (
              <div className="registry-purchase-list">
                {finishedOrders.map((order) => (
                  <article className="registry-purchase-card registry-order-card" key={order.id}>
                    <div className="registry-order-head">
                      <b>Pedido #{order.order_code || order.id.slice(0, 8)}</b>
                      <strong>{formatStickerCount(order.stickerTotal)}</strong>
                    </div>
                    <div className="registry-order-dates">
                      <span><b>Compra:</b> {formatDate(order.created_at)}</span>
                      <span><b>Pagamento confirmado:</b> {formatDate(order.payment_approved_at)}</span>
                    </div>
                    <div className="registry-order-payment">
                      <span><b>Total:</b> {formatMoney((order.subtotal_cents || order.total_cents || 0) / 100)}</span>
                      <span><b>Pontos usados:</b> {(order.points_used || 0).toLocaleString("pt-BR")} pts</span>
                      <span><b>Desconto:</b> {formatMoney((order.points_discount_cents || 0) / 100)}</span>
                      <span><b>Pago via Mercado Pago:</b> {formatMoney((order.amount_due_cents || 0) / 100)}</span>
                    </div>
                    <div className="registry-order-items">
                      {(order.items || []).map((item: any) => (
                        <div className="registry-order-item" key={item.id}>
                          <span>{item.quantity}x {item.product_name}</span>
                          <small>{formatStickerCount(itemStickerTotal(item))}</small>
                        </div>
                      ))}
                    </div>
                    <div className="registry-order-total">
                      <span>Quantidade total adquirida: {order.itemTotal === 1 ? "1 item" : `${order.itemTotal} itens`}</span>
                      <span>Total de figurinhas adquiridas: {formatStickerCount(order.stickerTotal)}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </AccordionSection>

          <AccordionSection title="Compras pendentes" count={`${pendingOrders.length} pendentes`} defaultOpen={false}>
            {pendingOrders.length === 0 ? (
              <div className="empty">Nenhuma compra aguardando confirmação de pagamento.</div>
            ) : (
              <div className="registry-purchase-list">
                {pendingOrders.map((order) => (
                  <article className="registry-purchase-card" key={order.id}>
                    <div>
                      <b>Pedido #{order.order_code || order.id.slice(0, 8)}</b>
                      <span>{(order.items || []).map((item: any) => `${item.quantity}x ${item.product_name}`).join(" · ")}</span>
                    </div>
                    <strong style={{ color: "var(--wine)" }}>Aguardando</strong>
                  </article>
                ))}
              </div>
            )}
          </AccordionSection>

          <AccordionSection title="Últimas figurinhas adquiridas" count={`${openedStickerEntries.length} itens`} defaultOpen={false}>
            {openedStickerEntries.length === 0 ? (
              <div className="empty">Nenhuma figurinha de compra foi recebida ainda.</div>
            ) : (
              <div className="registry-sticker-history">
                {finishedOrders.map((order) => {
                  const orderEntries = openedStickerEntries.filter((entry) => entry.order.id === order.id);
                  if (orderEntries.length === 0) return null;
                  return (
                    <article className="registry-sticker-order" key={order.id}>
                      <div className="registry-sticker-order-head">
                        <b>Pedido #{order.order_code || order.id.slice(0, 8)}</b>
                        <span>{formatStickerCount(orderEntries.length)}</span>
                      </div>
                      <div className="registry-sticker-order-dates">
                        <small>Compra: {formatDate(order.created_at)}</small>
                        <small>Pagamento: {formatDate(order.payment_approved_at)}</small>
                      </div>
                      <ol className="registry-sticker-receipt-list registry-direct-sticker-list">
                        {orderEntries.map((entry: any) => (
                          <li key={entry.id}>
                            <span>
                              #{String(entry.sticker_number).padStart(3, "0")} -{" "}
                              {entry.stickers?.name || `Figurinha ${entry.sticker_number}`}
                            </span>
                            <small>{entry.was_repeat_at_generation ? "repetida" : "nova"}</small>
                          </li>
                        ))}
                      </ol>
                    </article>
                  );
                })}
              </div>
            )}
          </AccordionSection>
        </>
      )}

    </main>
  );
}
