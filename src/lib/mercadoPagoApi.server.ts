// @ts-nocheck

let oauthTokenCache: { token: string; expiresAt: number } | null = null;

function cleanSecret(value?: string) {
  return String(value || "").trim().replace(/^["']|["']$/g, "");
}

function getStaticAccessToken() {
  return cleanSecret(
    process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN,
  );
}

async function getOAuthAccessToken() {
  if (oauthTokenCache && oauthTokenCache.expiresAt > Date.now() + 60_000) {
    return oauthTokenCache.token;
  }

  const clientId = cleanSecret(process.env.MERCADO_PAGO_CLIENT_ID);
  const clientSecret = cleanSecret(process.env.MERCADO_PAGO_CLIENT_SECRET);
  if (!clientId || !clientSecret) return "";

  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.message || "Não foi possível autenticar a aplicação no Mercado Pago.");
  }

  oauthTokenCache = {
    token: cleanSecret(payload.access_token),
    expiresAt: Date.now() + Math.max(60, Number(payload.expires_in) || 21_600) * 1000,
  };
  return oauthTokenCache.token;
}

async function requestPayment(paymentId: string, accessToken: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

export async function fetchMercadoPagoPaymentSecure(paymentId: string) {
  const cleanId = decodeURIComponent(String(paymentId || "")).replace(/[^0-9]/g, "");
  if (!cleanId) throw new Error("ID de pagamento inválido.");

  const staticToken = getStaticAccessToken();
  if (!staticToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");

  let result = await requestPayment(cleanId, staticToken);
  if (result.response.ok) return result.payload;

  if (result.response.status === 401) {
    const oauthToken = await getOAuthAccessToken();
    if (oauthToken && oauthToken !== staticToken) {
      result = await requestPayment(cleanId, oauthToken);
      if (result.response.ok) return result.payload;
    }
  }

  console.error("[MercadoPago Fetch Payment Error]", {
    cleanId,
    status: result.response.status,
    payload: result.payload,
    oauthFallbackConfigured: Boolean(
      process.env.MERCADO_PAGO_CLIENT_ID && process.env.MERCADO_PAGO_CLIENT_SECRET,
    ),
  });
  const error = new Error(result.payload?.message || "Erro ao consultar pagamento no Mercado Pago.");
  (error as any).status = result.response.status;
  (error as any).payload = result.payload;
  throw error;
}
