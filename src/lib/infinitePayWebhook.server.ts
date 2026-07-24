// @ts-nocheck

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function handleInfinitePayWebhook(request: Request) {
  if (request.method !== "POST") {
    return jsonResponse({ success: false, message: "Method not allowed" }, 405);
  }

  const rawBody = await request.text();
  if (rawBody.length > 131_072) {
    return jsonResponse({ success: false, message: "Notificação muito grande." }, 413);
  }

  let incoming: any;
  try {
    incoming = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return jsonResponse({ success: false, message: "Corpo JSON inválido." }, 400);
  }

  const orderNsu = String(incoming?.order_nsu || "").trim();
  const transactionNsu = String(incoming?.transaction_nsu || "").trim();
  const slug = String(incoming?.invoice_slug || incoming?.slug || "").trim();
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (
    !uuidPattern.test(orderNsu) ||
    !transactionNsu ||
    transactionNsu.length > 200 ||
    !slug ||
    slug.length > 200
  ) {
    return jsonResponse(
      { success: false, message: "Notificação sem identificadores obrigatórios." },
      400,
    );
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let auditId: string | null = null;
  const { data: audit, error: auditError } = await supabaseAdmin
    .from("infinitepay_webhook_events")
    .insert({
      order_nsu: orderNsu,
      transaction_nsu: transactionNsu,
      invoice_slug: slug,
      raw_payload: incoming,
    })
    .select("id")
    .maybeSingle();

  if (auditError) {
    // Audit logging must never prevent an approved payment from being released.
    console.error("[InfinitePay Webhook Audit Error]", {
      orderNsu,
      transactionNsu,
      message: auditError.message,
    });
  } else {
    auditId = audit?.id || null;
  }

  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from("purchase_orders")
      .select("id, payment_provider, payment_status")
      .eq("id", orderNsu)
      .maybeSingle();
    if (orderError) throw new Error(orderError.message);
    if (!order || order.payment_provider !== "infinitepay") {
      throw new Error("Pedido InfinitePay não encontrado.");
    }

    if (order.payment_status === "approved") {
      if (auditId) {
        await supabaseAdmin
          .from("infinitepay_webhook_events")
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq("id", auditId);
      }
      return jsonResponse({ success: true, message: null, already_processed: true });
    }

    // InfinitePay does not document a webhook signature. Never trust the
    // incoming body as proof of payment: verify it against payment_check.
    const { checkInfinitePayPayment } = await import("./infinitePay.server");
    const verified = await checkInfinitePayPayment({ orderNsu, transactionNsu, slug });
    if (verified?.success !== true || verified?.paid !== true) {
      throw new Error("Pagamento ainda não confirmado pela InfinitePay.");
    }

    const { data, error } = await supabaseAdmin.rpc("process_infinitepay_payment", {
      payment_payload: verified,
    });
    if (error) throw new Error(error.message);

    if (auditId) {
      await supabaseAdmin
        .from("infinitepay_webhook_events")
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          processing_error: null,
        })
        .eq("id", auditId);
    }

    return jsonResponse({ success: true, message: null, result: data });
  } catch (error: any) {
    if (auditId) {
      await supabaseAdmin
        .from("infinitepay_webhook_events")
        .update({
          processed: false,
          processing_error: error?.message || "Erro desconhecido",
        })
        .eq("id", auditId);
    }

    console.error("[InfinitePay Webhook Error]", {
      orderNsu,
      transactionNsu,
      message: error?.message || "Erro desconhecido",
    });

    // InfinitePay retries the notification after a 400 response.
    return jsonResponse(
      { success: false, message: error?.message || "Erro ao confirmar pagamento." },
      400,
    );
  }
}
