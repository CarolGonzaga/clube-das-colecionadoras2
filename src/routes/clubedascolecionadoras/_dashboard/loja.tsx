import { createFileRoute, useLoaderData, useRouter } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, ShoppingCart, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useUI } from "@/components/UIProvider";
import { dbService } from "@/lib/db";
import { writeCheckoutCart } from "@/lib/cartStorage";
import { POINTS_BALANCE_CHANGED, readPointsBalanceFromEvent } from "@/lib/walletEvents";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/loja")({
  component: LojaPage,
});

type StoreItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  pointsPrice: number;
  image: string;
  tag: string;
  section: "pacotes" | "unitarias" | "raras" | "exclusivas";
  stickerNumber?: number;
};

type CartLine = StoreItem & {
  qty: number;
};

const STORE_ITEMS: StoreItem[] = [
  {
    id: "pack-1",
    name: "Pacote",
    description: "Pacote com 5 figurinhas sortidas entre 194 e 319",
    price: 2.5,
    pointsPrice: 250,
    image: "/frames/1.webp",
    tag: "pacote",
    section: "pacotes",
  },
  {
    id: "pack-combo",
    name: "Combo",
    description: "Pacote com 50 figurinhas sortidas entre 194 e 319",
    price: 22.5,
    pointsPrice: 2250,
    image: "/frames/1.webp",
    tag: "combo",
    section: "pacotes",
  },
  {
    id: "single-random",
    name: "Figurinha unitária",
    description: "1x figurinha sortida entre 194 e 319",
    price: 1,
    pointsPrice: 100,
    image: "/verso-card.png",
    tag: "unitaria",
    section: "unitarias",
  },
];

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toCents(value: number) {
  return Math.round(value * 100);
}

function LojaPage() {
  const ui = useUI();
  const router = useRouter();
  const parentData = useLoaderData({ from: "/clubedascolecionadoras/_dashboard" });
  const [cart, setCart] = useState<CartLine[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "pending">("idle");
  const [useWalletPoints, setUseWalletPoints] = useState(false);
  const [walletPoints, setWalletPoints] = useState(parentData.pointsBalance || 0);
  const [storeFilter, setStoreFilter] = useState<"todos" | "pacotes" | "unitarias" | "exclusivas">(
    "todos",
  );

  const cartTotalCents = useMemo(() => {
    return cart.reduce((sum, item) => sum + toCents(item.price) * item.qty, 0);
  }, [cart]);
  const cartPointsTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.pointsPrice * item.qty, 0);
  }, [cart]);
  const availablePoints = Math.max(0, walletPoints);
  const appliedPoints = useWalletPoints ? Math.min(availablePoints, cartPointsTotal) : 0;
  const pointsDiscountCents = appliedPoints;
  const amountDueCents = Math.max(0, cartTotalCents - pointsDiscountCents);
  const cartTotal = cartTotalCents / 100;
  const amountDue = amountDueCents / 100;

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const featuredItems = STORE_ITEMS.filter(
    (item) => storeFilter === "todos" || item.section === storeFilter,
  );

  useEffect(() => {
    let alive = true;

    const refreshWallet = async () => {
      try {
        const balance = await dbService.getPointsBalance();
        if (alive) setWalletPoints(balance);
      } catch {
        // Keep the current balance visible if the connection blips.
      }
    };

    const handlePointsChange = (event: Event) => {
      const nextBalance = readPointsBalanceFromEvent(event);
      if (typeof nextBalance === "number") {
        setWalletPoints(nextBalance);
      } else {
        refreshWallet();
      }
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

  const getQty = (id: string) => quantities[id] || 1;

  const setQty = (id: string, next: number) => {
    setQuantities((current) => ({ ...current, [id]: Math.max(1, Math.min(20, next)) }));
  };

  const addToCart = (item: StoreItem) => {
    const qty = getQty(item.id);
    setCart((current) => {
      const existing = current.find((line) => line.id === item.id);
      if (existing) {
        return current.map((line) =>
          line.id === item.id ? { ...line, qty: Math.min(20, line.qty + qty) } : line,
        );
      }
      return [...current, { ...item, qty }];
    });
    setCartOpen(true);
    ui.toast("Item adicionado ao carrinho.");
  };

  const updateCartQty = (id: string, next: number) => {
    if (next <= 0) {
      setCart((current) => current.filter((item) => item.id !== id));
      return;
    }
    setCart((current) =>
      current.map((item) => (item.id === id ? { ...item, qty: Math.min(20, next) } : item)),
    );
  };

  const removeItem = (id: string) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      ui.toast("Adicione um item antes de finalizar.");
      return;
    }
    setCheckoutStatus("pending");
    try {
      writeCheckoutCart(cart.map((item) => ({
        productId: item.id,
        name: item.name,
        quantity: item.qty,
        unitPriceCents: toCents(item.price),
        unitPointPrice: item.pointsPrice,
        image: item.image,
      })));
      setCartOpen(false);
      await router.navigate({ to: "/clubedascolecionadoras/carrinho" });
    } catch (error: any) {
      ui.toast(error?.message || "Erro ao preparar o carrinho.");
    } finally {
      setCheckoutStatus("idle");
    }
  };

  return (
    <main className="screen shop-screen">
      <div className="shop-title-row">
        <div>
          <h1 className="section-title">Loja</h1>
          <p className="section-sub">Pacotes, unitárias e figurinhas exclusivas para completar sua coleção.</p>
        </div>
        <button type="button" className="shop-cart-button" onClick={() => setCartOpen(true)}>
          <ShoppingBag size={18} />
          {cartCount > 0 && <span>{cartCount}</span>}
        </button>
      </div>

      <section className="shop-filter-bar">
        {[
          ["todos", "Todos"],
          ["pacotes", "Pacotes"],
          ["unitarias", "Unitárias"],
          ["exclusivas", "Exclusivas"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={storeFilter === id ? "active" : ""}
            onClick={() => setStoreFilter(id as typeof storeFilter)}
          >
            {label}
          </button>
        ))}
      </section>

      {(storeFilter === "todos" || storeFilter === "pacotes" || storeFilter === "unitarias") && featuredItems.length > 0 && (
        <section className="shop-section">
          <div className="shop-section-head">
            <h2>Itens principais</h2>
            <span>Pacotes e unitárias da loja</span>
          </div>
          <div className="shop-grid featured">
            {featuredItems.map((item) => {
              const qty = getQty(item.id);

              return (
                <article className="shop-card" key={item.id}>
                  <div className="shop-card-media" style={{ position: "relative" }}>
                    <img src={item.image} alt={item.name} />
                    <small>{item.tag}</small>
                    {/* "10x" badge for the combo pack */}
                    {item.id === "pack-combo" && (
                      <span style={{
                        position: "absolute",
                        bottom: 8,
                        right: 10,
                        background: "rgba(194, 24, 91, 0.92)",
                        color: "#fff",
                        fontFamily: "Baloo 2",
                        fontWeight: 900,
                        fontSize: "18px",
                        lineHeight: 1,
                        padding: "3px 8px",
                        borderRadius: "10px",
                        letterSpacing: "-0.5px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                      }}>
                        10x
                      </span>
                    )}
                  </div>
                  <div className="shop-card-body">
                    <h2>{item.name}</h2>
                    <p>{item.description}</p>
                    <b>{formatMoney(item.price)} ou {item.pointsPrice.toLocaleString("pt-BR")} pts</b>
                  </div>
                  <div className="shop-card-actions">
                    <div className="qty-stepper">
                      <button type="button" onClick={() => setQty(item.id, qty - 1)} aria-label="Diminuir">
                        <Minus size={14} />
                      </button>
                      <span>{qty}</span>
                      <button type="button" onClick={() => setQty(item.id, qty + 1)} aria-label="Aumentar">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button type="button" className="btn shop-add-btn" onClick={() => addToCart(item)}>
                      <ShoppingCart size={15} />
                      Adicionar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Exclusive Stickers Section */}
      {(storeFilter === "todos" || storeFilter === "exclusivas") && (() => {
        const exclusiveStickers = parentData.stickers.filter((s) => s.number >= 320 && s.number <= 360);
        const alreadyOwned = (num: number) =>
          parentData.userStickers.some((us) => us.sticker_number === num && us.copies > 0);
        return exclusiveStickers.length > 0 ? (
          <section className="shop-section">
            <div className="shop-section-head">
              <h2><Sparkles size={16} style={{ display: "inline", verticalAlign: "middle" }} /> Exclusivas</h2>
              <span>Somente uma unidade de cada por usuário.</span>
            </div>
            <div className="shop-grid featured exclusive-shop-grid">
              {exclusiveStickers.map((sticker) => {
                const itemId = `exclusive-${sticker.number}`;
                const owned = alreadyOwned(sticker.number);
                const storeItem: StoreItem = {
                  id: itemId,
                  name: sticker.name,
                  description: sticker.author || "Autoria a definir",
                  price: 2.5,
                  pointsPrice: 250,
                  image: sticker.cover_url ? `/covers/${sticker.cover_url}` : "/verso-card.png",
                  tag: "exclusiva",
                  section: "exclusivas",
                  stickerNumber: sticker.number,
                };

                return (
                  <article className="shop-card exclusive-shop-card" key={itemId} style={{ opacity: owned ? 0.65 : 1 }}>
                    <div className="exclusive-shop-cover">
                      <img
                        src={storeItem.image}
                        alt={sticker.name}
                      />
                      {owned && (
                        <span style={{
                          position: "absolute", top: 8, right: 8,
                          background: "#22c55e", color: "#fff",
                          fontSize: "9px", fontWeight: 800,
                          padding: "3px 7px", borderRadius: "6px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        }}>
                          Já tenho
                        </span>
                      )}
                    </div>
                    <div className="shop-card-body">
                      <h2 className="exclusive-shop-title">#{String(sticker.number).padStart(3, "0")} {sticker.name}</h2>
                      <p className="exclusive-credit-line">
                        <span>{storeItem.description}</span>
                        {sticker.ilustrator && <span>arte: {sticker.ilustrator}</span>}
                      </p>
                      <b>{formatMoney(storeItem.price)} ou {storeItem.pointsPrice.toLocaleString("pt-BR")} pts</b>
                    </div>
                    <div className="shop-card-actions">
                      <button
                        type="button"
                        className="btn shop-add-btn"
                        disabled={owned || cart.some((c) => c.id === itemId)}
                        onClick={() => addToCart(storeItem)}
                        style={{ width: "100%" }}
                      >
                        {!owned && !cart.some((c) => c.id === itemId) && <ShoppingCart size={15} />}
                        {owned ? "Já adquirida" : cart.some((c) => c.id === itemId) ? "No carrinho" : "Adicionar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null;
      })()}

      {cartOpen && (
        <div className="modal-bg" onClick={(event) => event.target === event.currentTarget && setCartOpen(false)}>
          <div className="modal shop-cart-modal">
            <button type="button" className="shop-modal-close" onClick={() => setCartOpen(false)} aria-label="Fechar">
              <X size={18} />
            </button>
            <h2>Carrinho</h2>

            {cart.length === 0 ? (
              <div className="shop-empty-cart">
                <ShoppingBag size={30} />
                <p>Seu carrinho está vazio.</p>
              </div>
            ) : (
              <div className="shop-cart-lines">
                {cart.map((item) => (
                  <article className="shop-cart-line" key={item.id}>
                    <img src={item.image} alt="" />
                    <div>
                      <b>{item.name}</b>
                      <span>{formatMoney(item.price)} ou {item.pointsPrice.toLocaleString("pt-BR")} pts</span>
                    </div>
                    <div className="qty-stepper compact">
                      <button type="button" onClick={() => updateCartQty(item.id, item.qty - 1)}>
                        <Minus size={13} />
                      </button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => updateCartQty(item.id, item.qty + 1)}>
                        <Plus size={13} />
                      </button>
                    </div>
                    <button type="button" className="shop-remove-btn" onClick={() => removeItem(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>
            )}

            <div className="shop-cart-total">
              <span>Total</span>
              <b>{formatMoney(cartTotal)}</b>
            </div>

            {cart.length > 0 && (
              <div className="shop-points-payment">
                <label>
                  <input
                    type="checkbox"
                    checked={useWalletPoints}
                    onChange={(event) => setUseWalletPoints(event.target.checked)}
                  />
                  <span>Usar pontos da carteira</span>
                </label>
                <div className="shop-points-summary">
                  <span>Saldo disponível</span>
                  <b>{availablePoints.toLocaleString("pt-BR")} pts</b>
                  <span>Usados neste pedido</span>
                  <b>{appliedPoints.toLocaleString("pt-BR")} pts</b>
                  <span>Desconto em pontos</span>
                  <b>-{formatMoney(pointsDiscountCents / 100)}</b>
                  <span>Diferença a pagar</span>
                  <b>{formatMoney(amountDue)}</b>
                </div>
              </div>
            )}

            {checkoutStatus === "pending" && (
              <p className="shop-checkout-note">
                {amountDueCents > 0
                  ? "O Mercado Pago será aberto para pagar a diferença. Se o pagamento não for aprovado na hora, a confirmação chegará por email assim que o webhook liberar os itens."
                  : "Este pedido será quitado com pontos da carteira e os itens serão liberados sem Mercado Pago."}
              </p>
            )}

            <div className="shop-modal-actions">
              <button type="button" className="btn muted" onClick={() => setCartOpen(false)}>
                Continuar comprando
              </button>
              <button type="button" className="btn" onClick={handleCheckout}>
                Finalizar compra
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
