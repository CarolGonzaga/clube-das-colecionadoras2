import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useUI } from "@/components/UIProvider";

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
};

type CartLine = StoreItem & {
  qty: number;
};

const STORE_ITEMS: StoreItem[] = [
  {
    id: "pack-single",
    name: "Pacote com 5 figurinhas",
    description: "Sorteio de figurinhas comuns com chance especial.",
    price: 5.9,
    image: "/verso-card.png",
    tag: "pacote",
  },
  {
    id: "pack-combo",
    name: "Combo 3 pacotes",
    description: "Mais aberturas para completar o album.",
    price: 14.9,
    image: "/verso-card.png",
    tag: "combo",
  },
  {
    id: "rare-spotlight",
    name: "Figurinha rara avulsa",
    description: "Compra unica, liberada somente se ainda nao estiver no album.",
    price: 9.9,
    image: "/verso-card.png",
    tag: "rara",
  },
  {
    id: "credits-pack",
    name: "Pacote com creditos",
    description: "Creditos internos para trocar por novos pacotes.",
    price: 7.9,
    image: "/icons/recompensa.png",
    tag: "creditos",
  },
];

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function LojaPage() {
  const ui = useUI();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "pending">("idle");

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

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
  };

  return (
    <main className="screen shop-screen">
      <div className="shop-title-row">
        <div>
          <h1 className="section-title">Loja</h1>
          <p className="section-sub">Pacotes, raras e creditos para completar sua colecao.</p>
        </div>
        <button type="button" className="shop-cart-button" onClick={() => setCartOpen(true)}>
          <ShoppingBag size={18} />
          {cartCount > 0 && <span>{cartCount}</span>}
        </button>
      </div>

      <section className="shop-grid">
        {STORE_ITEMS.map((item) => {
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
      </section>

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
