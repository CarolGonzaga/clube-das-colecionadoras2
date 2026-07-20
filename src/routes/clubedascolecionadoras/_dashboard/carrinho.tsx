import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Coins, CreditCard, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useUI } from "@/components/UIProvider";
import { supabase } from "@/integrations/supabase/client";
import { clearCheckoutCart, readCheckoutCart, writeCheckoutCart, type CheckoutCartItem } from "@/lib/cartStorage";
import { createMercadoPagoCheckout } from "@/lib/checkout";
import { dbService } from "@/lib/db";
import { POINTS_BALANCE_CHANGED, emitPointsBalanceChanged, readPointsBalanceFromEvent } from "@/lib/walletEvents";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/carrinho")({
  component: CartPage,
});

function formatMoneyFromCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CartPage() {
  const ui = useUI();
  const router = useRouter();
  const [items, setItems] = useState<CheckoutCartItem[]>([]);
  const [walletPoints, setWalletPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setItems(readCheckoutCart());
  }, []);

  useEffect(() => {
    let alive = true;
    const refreshWallet = async () => {
      try {
        const balance = await dbService.getPointsBalance();
        if (alive) setWalletPoints(balance);
      } catch {
        // Keep current balance if the connection blips.
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

  const totalCents = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0),
    [items],
  );
  const totalPoints = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPointPrice * item.quantity, 0),
    [items],
  );
  const appliedPoints = usePoints ? Math.min(walletPoints, totalPoints, totalCents) : 0;
  const amountDueCents = Math.max(0, totalCents - appliedPoints);

  const persist = (nextItems: CheckoutCartItem[]) => {
    setItems(nextItems);
    writeCheckoutCart(nextItems);
  };

  const removeItem = (productId: string) => {
    persist(items.filter((item) => item.productId !== productId));
  };

  const updateQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    persist(
      items.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.min(20, quantity) } : item,
      ),
    );
  };

  const checkout = async () => {
    if (items.length === 0) {
      ui.toast("Seu carrinho está vazio.");
      return;
    }
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const result = await createMercadoPagoCheckout({
        data: {
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          requestedPoints: appliedPoints,
        },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      if (appliedPoints > 0) {
        const nextBalance = Math.max(0, walletPoints - Number(result.pointsUsed || 0));
        setWalletPoints(nextBalance);
        emitPointsBalanceChanged(nextBalance);
      }

      clearCheckoutCart();

      if (result.requiresMercadoPago) {
        window.location.href = result.checkoutUrl;
      } else {
        await router.navigate({
          to: "/clubedascolecionadoras/pagamento/sucesso",
          search: { order: result.orderId },
        });
      }
    } catch (error: any) {
      ui.toast(error?.message || "Erro ao iniciar pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="screen checkout-screen">
      <button type="button" className="checkout-back" onClick={() => router.navigate({ to: "/clubedascolecionadoras/loja" })}>
        <ArrowLeft size={16} />
        Voltar para loja
      </button>

      <section className="checkout-card">
        <div className="checkout-head">
          <div>
            <h1 className="section-title">Carrinho</h1>
            <p className="section-sub">Confira os itens antes de seguir para o pagamento.</p>
          </div>
          <ShoppingBag size={24} />
        </div>

        {items.length === 0 ? (
          <div className="checkout-empty">
            <ShoppingBag size={34} />
            <b>Seu carrinho está vazio.</b>
            <p>Escolha itens na loja para iniciar uma compra.</p>
          </div>
        ) : (
          <div className="checkout-lines">
            {items.map((item) => (
              <article className="checkout-line" key={item.productId}>
                <img src={item.image || "/verso-card.png"} alt="" />
                <div>
                  <b>{item.name}</b>
                  <span>
                    {formatMoneyFromCents(item.unitPriceCents)} ou{" "}
                    {item.unitPointPrice.toLocaleString("pt-BR")} pts
                  </span>
                </div>
                <div className="qty-stepper compact">
                  <button type="button" onClick={() => updateQty(item.productId, item.quantity - 1)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => updateQty(item.productId, item.quantity + 1)}>
                    +
                  </button>
                </div>
                <button type="button" className="shop-remove-btn" onClick={() => removeItem(item.productId)}>
                  <Trash2 size={15} />
                </button>
              </article>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="checkout-wallet">
              <label>
                <input
                  type="checkbox"
                  checked={usePoints}
                  onChange={(event) => setUsePoints(event.target.checked)}
                />
                <span>Usar pontos da carteira</span>
              </label>
              <div>
                <Coins size={15} />
                {walletPoints.toLocaleString("pt-BR")} pts disponíveis
              </div>
            </div>

            <div className="checkout-summary">
              <span>Total dos itens</span>
              <b>{formatMoneyFromCents(totalCents)}</b>
              <span>Pontos usados</span>
              <b>{appliedPoints.toLocaleString("pt-BR")} pts</b>
              <span>Diferença a pagar</span>
              <strong>{formatMoneyFromCents(amountDueCents)}</strong>
            </div>

            <button type="button" className="btn checkout-pay-btn" disabled={loading} onClick={checkout}>
              <CreditCard size={16} />
              {loading
                ? "Preparando pagamento..."
                : amountDueCents > 0
                  ? "Pagar com Mercado Pago"
                  : "Finalizar com pontos"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
