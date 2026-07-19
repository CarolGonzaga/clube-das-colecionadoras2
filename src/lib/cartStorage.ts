export type CheckoutCartItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  unitPointPrice: number;
  image?: string;
};

const CART_KEY = "club_v2_checkout_cart";

export function readCheckoutCart(): CheckoutCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCheckoutCart(items: CheckoutCartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("checkout_cart_change"));
}

export function clearCheckoutCart() {
  writeCheckoutCart([]);
}
