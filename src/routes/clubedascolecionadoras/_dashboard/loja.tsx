import { createFileRoute, useLoaderData, useRouter } from "@tanstack/react-router";
import { Minus, Plus, Search, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useUI } from "@/components/UIProvider";
import { purchaseStorage, type SimPurchaseItem } from "@/lib/shopSimulation";
import AutographSeal from "@/components/AutographSeal";
import Stamp from "@/components/Stamp";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/loja")({
  component: LojaPage,
});

type StoreItem = {
  id: string;
  name: string;
  description: string;
  price: number;
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
    id: "pack-single",
    name: "Pacote com 5 figurinhas",
    description: "Pacote sortido para abrir na tela de registros.",
    price: 2.5,
    image: "/verso-card.png",
    tag: "pacote",
    section: "pacotes",
  },
  {
    id: "pack-combo",
    name: "Combo com 10 pacotes",
    description: "Economia para completar o album mais rapido.",
    price: 22.5,
    image: "/verso-card.png",
    tag: "combo",
    section: "pacotes",
  },
  {
    id: "single-random",
    name: "Figurinha unitária sortida",
    description: "Uma figurinha comum sorteada automaticamente.",
    price: 1,
    image: "/verso-card.png",
    tag: "unitaria",
    section: "unitarias",
  },
];

const RARE_ITEMS: StoreItem[] = [];

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function LojaPage() {
  const ui = useUI();
  const router = useRouter();
  const parentData = useLoaderData({ from: "/clubedascolecionadoras/_dashboard" });
  const [cart, setCart] = useState<CartLine[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "pending">("idle");
  const [storeFilter, setStoreFilter] = useState<"todos" | "pacotes" | "unitarias" | "exclusivas">(
    "todos",
  );
  const [rareSearch, setRareSearch] = useState("");

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const featuredItems = STORE_ITEMS.filter(
    (item) => storeFilter === "todos" || item.section === storeFilter,
  );
  const rareItems: StoreItem[] = [];

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

  const handleCheckout = () => {
    if (cart.length === 0) {
      ui.toast("Adicione um item antes de finalizar.");
      return;
    }
    setCheckoutStatus("pending");
    const items: SimPurchaseItem[] = cart.map((item) => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      price: item.price,
      kind: item.section === "exclusivas" ? "exclusive" : item.id === "single-random" ? "single" : "pack",
    }));
    purchaseStorage.createPurchase({
      userId: parentData.profile.id,
      items,
      stickers: parentData.stickers,
      userStickers: parentData.userStickers,
    });
    setCart([]);
    setCartOpen(false);
    setCheckoutStatus("idle");
    ui.toast("Compra simulada aprovada. Itens adicionados em Registros.");
    router.navigate({ to: "/clubedascolecionadoras/registros" });
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
          ["exclusivas", "Exclusivas ✨"],
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
                  <div className="shop-card-media">
                    <img src={item.image} alt={item.name} />
                    <small>{item.tag}</small>
                  </div>
                  <div className="shop-card-body">
                    <h2>{item.name}</h2>
                    <p>{item.description}</p>
                    <b>{formatMoney(item.price)}</b>
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
        const exclusiveStickers = parentData.stickers.filter((s) => s.number >= 330 && s.number <= 360);
        const alreadyOwned = (num: number) =>
          parentData.userStickers.some((us) => us.sticker_number === num && us.copies > 0);
        return exclusiveStickers.length > 0 ? (
          <section className="shop-section">
            <div className="shop-section-head">
              <h2><Sparkles size={16} style={{ display: "inline", verticalAlign: "middle" }} /> Exclusivas</h2>
              <span>R$ 2,50 cada &middot; uma por usuária</span>
            </div>
            <div className="shop-grid featured">
              {exclusiveStickers.map((sticker) => {
                const itemId = `exclusive-${sticker.number}`;
                const owned = alreadyOwned(sticker.number);
                const storeItem: StoreItem = {
                  id: itemId,
                  name: sticker.name,
                  description: sticker.author ? `Arte: ${sticker.author}` : "Figurinha exclusiva do clube.",
                  price: 2.5,
                  image: sticker.cover_url ? `/covers/${sticker.cover_url}` : "/verso-card.png",
                  tag: "exclusiva",
                  section: "exclusivas",
                  stickerNumber: sticker.number,
                };

                return (
                  <article className="shop-card" key={itemId} style={{ opacity: owned ? 0.55 : 1 }}>
                    <div className="shop-card-media" style={{ position: "relative" }}>
                      <img src={storeItem.image} alt={sticker.name} />
                      <small style={{ background: "linear-gradient(135deg, #9c27b0, #e91e63)" }}>{storeItem.tag}</small>
                      {owned && (
                        <span style={{
                          position: "absolute", top: 6, right: 6,
                          background: "#22c55e", color: "#fff",
                          fontSize: "9px", fontWeight: 800,
                          padding: "2px 6px", borderRadius: "6px",
                        }}>
                          Já tenho
                        </span>
                      )}
                    </div>
                    <div className="shop-card-body">
                      <h2>#{String(sticker.number).padStart(3, "0")} {sticker.name}</h2>
                      <p>{storeItem.description}</p>
                      <b>{formatMoney(storeItem.price)}</b>
                    </div>
                    <div className="shop-card-actions">
                      <button
                        type="button"
                        className="btn shop-add-btn"
                        disabled={owned || cart.some((c) => c.id === itemId)}
                        onClick={() => addToCart(storeItem)}
                        style={{ width: "100%" }}
                      >
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
                <p>Seu carrinho esta vazio.</p>
              </div>
            ) : (
              <div className="shop-cart-lines">
                {cart.map((item) => (
                  <article className="shop-cart-line" key={item.id}>
                    <img src={item.image} alt="" />
                    <div>
                      <b>{item.name}</b>
                      <span>{formatMoney(item.price)}</span>
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

            {checkoutStatus === "pending" && (
              <p className="shop-checkout-note">
                O Mercado Pago sera aberto para finalizar a compra. Se o pagamento nao for aprovado
                na hora, a confirmacao chegara por email assim que o webhook liberar os itens.
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
