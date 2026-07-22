import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Coins, CreditCard, ShoppingBag, Tag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useUI } from "@/components/UIProvider";
import { clearCheckoutCart, readCheckoutCart, writeCheckoutCart, type CheckoutCartItem } from "@/lib/cartStorage";
import { createMercadoPagoCheckout, validateCoupon } from "@/lib/checkout";
import { dbService } from "@/lib/db";
import { POINTS_BALANCE_CHANGED, emitPointsBalanceChanged, readPointsBalanceFromEvent } from "@/lib/walletEvents";

declare global {
  interface Window {
    MP_DEVICE_SESSION_ID?: string;
  }
}

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/carrinho")({
  component: CartPage,
});

function formatMoneyFromCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function getMercadoPagoDeviceId() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const deviceId = window.MP_DEVICE_SESSION_ID?.trim();
    if (deviceId) return deviceId;
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }
  return undefined;
}

function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function isValidCpf(value: string) {
  const cpf = onlyDigits(value, 11);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length: number) => {
    const sum = cpf
      .slice(0, length)
      .split("")
      .reduce((total, current, index) => total + Number(current) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function CartPage() {
  const ui = useUI();
  const router = useRouter();
  const [items, setItems] = useState<CheckoutCartItem[]>([]);
  const [walletPoints, setWalletPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payer, setPayer] = useState({
    fullName: "",
    cpf: "",
    phone: "",
    zipCode: "",
    streetName: "",
    streetNumber: "",
  });

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number; cents: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    setItems(readCheckoutCart());
  }, []);

  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.mercadopago.com/v2/security.js"]',
    );
    if (existing) return;

    const script = document.createElement("script");
    script.src = "https://www.mercadopago.com/v2/security.js";
    script.async = true;
    script.dataset.view = "checkout";
    script.setAttribute("view", "checkout");
    document.head.appendChild(script);
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

  const couponDiscountCents = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.percent > 0) {
      return Math.round((totalCents * appliedCoupon.percent) / 100);
    }
    if (appliedCoupon.cents > 0) {
      return Math.min(totalCents, appliedCoupon.cents);
    }
    return 0;
  }, [appliedCoupon, totalCents]);

  const afterCouponCents = Math.max(0, totalCents - couponDiscountCents);
  const appliedPoints = usePoints ? Math.min(walletPoints, totalPoints, afterCouponCents) : 0;
  const amountDueCents = Math.max(0, afterCouponCents - appliedPoints);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await validateCoupon({ data: { code: couponInput } });
      if (res.valid) {
        setAppliedCoupon({
          code: res.code!,
          percent: res.discount_percent || 0,
          cents: res.discount_cents || 0,
        });
        ui.toast(res.message);
      } else {
        ui.toast(res.message);
      }
    } catch (err: any) {
      ui.toast(err?.message || "Erro ao validar cupom.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
  };

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
    if (amountDueCents > 0) {
      if (!payer.fullName.trim().includes(" ")) {
        ui.toast("Informe seu nome completo para o pagamento.");
        return;
      }
      if (!isValidCpf(payer.cpf)) {
        ui.toast("Informe um CPF válido para o pagamento.");
        return;
      }
      if (payer.phone.length < 10) {
        ui.toast("Informe um telefone válido com DDD.");
        return;
      }
      if (payer.zipCode.length !== 8 || payer.streetName.trim().length < 3 || !payer.streetNumber.trim()) {
        ui.toast("Preencha o CEP, endereço e número de cobrança.");
        return;
      }
    }
    setLoading(true);
    try {
      const deviceId = await getMercadoPagoDeviceId();
      const result = await createMercadoPagoCheckout({
        data: {
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          requestedPoints: appliedPoints,
          couponCode: appliedCoupon?.code,
          deviceId,
          payer: amountDueCents > 0 ? payer : undefined,
        },
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
            <div className="checkout-coupon">
              <div className="coupon-input-group">
                <Tag size={16} />
                <input
                  type="text"
                  placeholder="Cupom de desconto (ex: LENDOSAFICOS10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon || validatingCoupon}
                />
                {appliedCoupon ? (
                  <button type="button" className="btn muted compact" onClick={handleRemoveCoupon}>
                    Remover
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn compact"
                    disabled={validatingCoupon || !couponInput.trim()}
                    onClick={handleApplyCoupon}
                  >
                    {validatingCoupon ? "..." : "Aplicar"}
                  </button>
                )}
              </div>
              {appliedCoupon && (
                <p className="coupon-success-msg">
                  Cupom <b>{appliedCoupon.code}</b> aplicado! (
                  {appliedCoupon.percent > 0
                    ? `${appliedCoupon.percent}% OFF`
                    : `-${formatMoneyFromCents(appliedCoupon.cents)}`}
                  )
                </p>
              )}
            </div>

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

            {amountDueCents > 0 && (
              <section className="checkout-payer" aria-labelledby="checkout-payer-title">
                <div className="checkout-payer-heading">
                  <div>
                    <h2 id="checkout-payer-title">Dados para segurança do pagamento</h2>
                    <p>Enviados ao Mercado Pago nesta compra e não armazenados pelo Clube.</p>
                  </div>
                </div>
                <div className="checkout-payer-grid">
                  <label className="checkout-field checkout-field-wide">
                    <span>Nome completo</span>
                    <input
                      autoComplete="name"
                      value={payer.fullName}
                      onChange={(event) => setPayer((current) => ({ ...current, fullName: event.target.value.slice(0, 120) }))}
                      placeholder="Nome e sobrenome"
                    />
                  </label>
                  <label className="checkout-field">
                    <span>CPF</span>
                    <input
                      inputMode="numeric"
                      autoComplete="off"
                      value={payer.cpf}
                      onChange={(event) => setPayer((current) => ({ ...current, cpf: onlyDigits(event.target.value, 11) }))}
                      placeholder="Somente números"
                    />
                  </label>
                  <label className="checkout-field">
                    <span>Telefone com DDD</span>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={payer.phone}
                      onChange={(event) => setPayer((current) => ({ ...current, phone: onlyDigits(event.target.value, 11) }))}
                      placeholder="11999999999"
                    />
                  </label>
                  <label className="checkout-field">
                    <span>CEP de cobrança</span>
                    <input
                      inputMode="numeric"
                      autoComplete="postal-code"
                      value={payer.zipCode}
                      onChange={(event) => setPayer((current) => ({ ...current, zipCode: onlyDigits(event.target.value, 8) }))}
                      placeholder="Somente números"
                    />
                  </label>
                  <label className="checkout-field">
                    <span>Número</span>
                    <input
                      autoComplete="address-line2"
                      value={payer.streetNumber}
                      onChange={(event) => setPayer((current) => ({ ...current, streetNumber: event.target.value.slice(0, 20) }))}
                      placeholder="Número ou S/N"
                    />
                  </label>
                  <label className="checkout-field checkout-field-wide">
                    <span>Endereço de cobrança</span>
                    <input
                      autoComplete="street-address"
                      value={payer.streetName}
                      onChange={(event) => setPayer((current) => ({ ...current, streetName: event.target.value.slice(0, 160) }))}
                      placeholder="Rua, avenida ou equivalente"
                    />
                  </label>
                </div>
              </section>
            )}

            <div className="checkout-summary">
              <span>Total dos itens</span>
              <b>{formatMoneyFromCents(totalCents)}</b>
              {couponDiscountCents > 0 && (
                <>
                  <span>Desconto do cupom</span>
                  <b className="discount-text">-{formatMoneyFromCents(couponDiscountCents)}</b>
                </>
              )}
              {appliedPoints > 0 && (
                <>
                  <span>Pontos usados</span>
                  <b>{appliedPoints.toLocaleString("pt-BR")} pts</b>
                </>
              )}
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
