// @ts-nocheck
import { createHmac, timingSafeEqual } from "node:crypto";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function parseSignatureHeader(header: string | null) {
  const parts = new Map<string, string>();
  for (const part of (header || "").split(",")) {
    const [key, value] = part.split("=");
    if (key && value) parts.set(key.trim(), value.trim());
  }
  return {
    ts: parts.get("ts") || "",
    v1: parts.get("v1") || "",
  };
}

function verifyMercadoPagoSignature({
  xSignature,
  xRequestId,
  candidateDataIds,
  secret,
}: {
  xSignature: string | null;
  xRequestId: string | null;
  candidateDataIds: Array<string | null | undefined>;
  secret: string;
}) {
  const { ts, v1 } = parseSignatureHeader(xSignature);
  if (!ts || !v1) return false;

  const cleanSecret = secret.trim();

  // Try candidate data IDs to ensure robust matching across all MP API variants
  const candidateIds = Array.from(
    new Set(
      candidateDataIds
        .map((id) => (id ? String(id).trim() : ""))
        .concat([""]) // Always include empty id option
    )
  );

  for (const rawId of candidateIds) {
    const dataId = rawId ? (/[a-zA-Z]/.test(rawId) ? rawId.toLowerCase() : rawId) : "";
    const manifest = [
      dataId ? `id:${dataId};` : "",
      xRequestId ? `request-id:${xRequestId.trim()};` : "",
      `ts:${ts};`,
    ].join("");

    const digest = createHmac("sha256", cleanSecret).update(manifest).digest("hex");
    const expected = Buffer.from(digest, "hex");
    const received = Buffer.from(v1, "hex");

    if (
      expected.length === received.length &&
      expected.length > 0 &&
      timingSafeEqual(expected, received)
    ) {
      return true;
    }
  }

  return false;
}

async function fetchMercadoPagoPayment(paymentId: string) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.VITE_MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");

  const cleanId = decodeURIComponent(String(paymentId || "")).replace(/[^0-9]/g, "");

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${cleanId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Erro ao consultar pagamento no Mercado Pago.");
  }
  return payload;
}

export async function handleMercadoPagoWebhook(request: Request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return jsonResponse({ error: "Webhook secret não configurado." }, 500);
  }

  const url = new URL(request.url);
  const rawBody = await request.text();
  const payload = rawBody ? JSON.parse(rawBody) : {};
  const signatureDataId = url.searchParams.get("data.id") || url.searchParams.get("data_id") || "";
  const bodyDataId = payload?.data?.id ? String(payload.data.id) : "";
  const eventId = payload?.id ? String(payload.id) : "";
  const paymentId = signatureDataId || bodyDataId || url.searchParams.get("id") || "";
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  if (
    !verifyMercadoPagoSignature({
      xSignature,
      xRequestId,
      candidateDataIds: [signatureDataId, bodyDataId, eventId],
      secret: webhookSecret,
    })
  ) {
    console.error("[MercadoPago Webhook] Assinatura inválida!", {
      xSignature,
      xRequestId,
      signatureDataId,
      bodyDataId,
      eventId,
      hasSecret: Boolean(webhookSecret),
      secretPrefix: webhookSecret ? webhookSecret.trim().substring(0, 5) + "..." : "none",
    });
    return jsonResponse({ error: "Assinatura inválida." }, 401);
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const providerEventId = payload?.id ? String(payload.id) : null;

  const eventInsert = {
    provider_event_id: providerEventId,
    provider_payment_id: paymentId || null,
    x_request_id: xRequestId,
    x_signature: xSignature,
    action: payload?.action || null,
    event_type: payload?.type || null,
    live_mode: typeof payload?.live_mode === "boolean" ? payload.live_mode : null,
    raw_payload: payload,
  };

  const { error: eventError } = await supabaseAdmin
    .from("mercado_pago_webhook_events")
    .upsert(eventInsert as any, {
      onConflict: providerEventId ? "provider_event_id" : "x_request_id,provider_payment_id",
      ignoreDuplicates: true,
    });
  if (eventError) throw new Error(eventError.message);

  if (payload?.type !== "payment" && !String(payload?.action || "").startsWith("payment.")) {
    return jsonResponse({ ok: true, ignored: true });
  }

  try {
    if (!paymentId) {
      throw new Error("Notificação sem ID de pagamento.");
    }

    // Se for teste de simulação (fake ID "123456" enviado pelo painel do MP), responda OK sem falhar
    if (paymentId === "123456" || payload?.live_mode === false) {
      try {
        const payment = await fetchMercadoPagoPayment(String(paymentId));
        const { data: result, error: processError } = await supabaseAdmin.rpc(
          "process_mercado_pago_payment",
          { payment_payload: payment },
        );
        if (processError) throw new Error(processError.message);
        return jsonResponse({ ok: true, result });
      } catch (simError: any) {
        if (paymentId === "123456") {
          console.log("[MercadoPago Webhook] Simulação de teste recebida com sucesso (ID fictício 123456).");
          return jsonResponse({ ok: true, simulated: true });
        }
        throw simError;
      }
    }

    const payment = await fetchMercadoPagoPayment(String(paymentId));
    const { data: result, error: processError } = await supabaseAdmin.rpc(
      "process_mercado_pago_payment",
      { payment_payload: payment },
    );
    if (processError) throw new Error(processError.message);

    await supabaseAdmin
      .from("mercado_pago_webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString(), processing_error: null })
      .match(
        providerEventId
          ? { provider_event_id: providerEventId }
          : { x_request_id: xRequestId, provider_payment_id: paymentId },
      );

    return jsonResponse({ ok: true, result });
  } catch (error: any) {
    await supabaseAdmin
      .from("mercado_pago_webhook_events")
      .update({ processed: false, processing_error: error?.message || "Erro desconhecido" })
      .match(
        providerEventId
          ? { provider_event_id: providerEventId }
          : { x_request_id: xRequestId, provider_payment_id: paymentId },
      );
    console.error("[MercadoPago Webhook Error]", error);
    return jsonResponse({ error: error?.message || "Erro ao processar webhook." }, 500);
  }
}

