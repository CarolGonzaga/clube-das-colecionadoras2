// @ts-nocheck

const INFINITEPAY_API = "https://api.checkout.infinitepay.io";

function clean(value?: string) {
  return String(value || "").trim().replace(/^['"]|['"]$/g, "");
}

export function getInfinitePayHandle() {
  return clean(process.env.INFINITEPAY_HANDLE || "ana-flavia-nue");
}

export function isInfinitePayEnabledForUser(userId: string) {
  if (clean(process.env.INFINITEPAY_ENABLED).toLowerCase() !== "true") return false;
  const allowed = clean(process.env.INFINITEPAY_TEST_USER_IDS)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(userId);
}

async function parseResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      payload?.message || payload?.error || `InfinitePay respondeu com status ${response.status}.`,
    );
    (error as any).status = response.status;
    (error as any).payload = payload;
    throw error;
  }
  return payload;
}

export async function createInfinitePayLink({
  orderId,
  items,
  customer,
  redirectUrl,
  webhookUrl,
}: {
  orderId: string;
  items: Array<{ quantity: number; price: number; description: string }>;
  customer?: { name: string; email: string; phone_number: string };
  redirectUrl: string;
  webhookUrl: string;
}) {
  const handle = getInfinitePayHandle();
  if (!handle) throw new Error("INFINITEPAY_HANDLE não configurado.");

  const response = await fetch(`${INFINITEPAY_API}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle,
      order_nsu: orderId,
      items,
      customer,
      redirect_url: redirectUrl,
      webhook_url: webhookUrl,
    }),
  });
  return parseResponse(response);
}

export async function checkInfinitePayPayment({
  orderNsu,
  transactionNsu,
  slug,
}: {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
}) {
  const handle = getInfinitePayHandle();
  if (!handle) throw new Error("INFINITEPAY_HANDLE não configurado.");

  const response = await fetch(`${INFINITEPAY_API}/payment_check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle,
      order_nsu: orderNsu,
      transaction_nsu: transactionNsu,
      slug,
    }),
  });
  const payload = await parseResponse(response);
  return {
    ...payload,
    order_nsu: orderNsu,
    transaction_nsu: transactionNsu,
    slug,
  };
}

