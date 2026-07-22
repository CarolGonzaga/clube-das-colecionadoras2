// @ts-nocheck

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function handleInfinitePayWebhook(request: Request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let incoming: any;
  try {
    incoming = await request.json();
  } catch {
    return jsonResponse({ error: "Corpo JSON inválido." }, 400);
  }

  const orderNsu = String(incoming?.order_nsu || "").trim();
  const transactionNsu = String(incoming?.transaction_nsu || "").trim();
  const slug = String(incoming?.invoice_slug || incoming?.slug || "").trim();
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(orderNsu) || !uuidPattern.test(transactionNsu) || !slug || slug.length > 200) {
    return jsonResponse({ error: "Notificação sem identificadores obrigatórios." }, 400);
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error: orderError } = await supabaseAdmin
      .from("purchase_orders")
      .select("id, payment_provider")
      .eq("id", orderNsu)
      .maybeSingle();
    if (orderError) throw new Error(orderError.message);
    if (!order || order.payment_provider !== "infinitepay") {
      return jsonResponse({ error: "Pedido InfinitePay não encontrado." }, 400);
    }

    const { checkInfinitePayPayment } = await import("./infinitePay.server");
    const verified = await checkInfinitePayPayment({ orderNsu, transactionNsu, slug });
    if (verified?.success !== true || verified?.paid !== true) {
      return jsonResponse({ error: "Pagamento ainda não confirmado pela InfinitePay." }, 400);
    }

    const { data, error } = await supabaseAdmin.rpc("process_infinitepay_payment", {
      payment_payload: verified,
    });
    if (error) throw new Error(error.message);
    return jsonResponse({ ok: true, result: data });
  } catch (error: any) {
    console.error("[InfinitePay Webhook Error]", {
      orderNsu,
      transactionNsu,
      message: error?.message || "Erro desconhecido",
    });
    return jsonResponse({ error: error?.message || "Erro ao confirmar pagamento." }, 400);
  }
}
