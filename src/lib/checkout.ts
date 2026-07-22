// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

const createCheckoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1),
  requestedPoints: z.number().int().min(0).default(0),
  couponCode: z.string().optional(),
});

const validateCouponSchema = z.object({
  code: z.string().min(1),
});

export const validateCoupon = createServerFn({ method: "POST" })
  .validator((data) => validateCouponSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("validate_coupon", {
      coupon_code_param: data.code,
    });
    if (error) throw new Error(error.message);
    return result as {
      valid: boolean;
      code?: string;
      discount_percent?: number;
      discount_cents?: number;
      message: string;
    };
  });

const getOrderSchema = z.object({
  orderId: z.string().uuid(),
});

const reconcilePaymentSchema = z.object({
  orderId: z.string().uuid(),
  paymentId: z.string().min(1),
});

function getPublicBaseUrl() {
  const configured =
    process.env.PUBLIC_SITE_URL ||
    process.env.VITE_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (!configured) return "http://localhost:5173";
  return configured.startsWith("http") ? configured : `https://${configured}`;
}

function getMercadoPagoAccessToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado no ambiente da Vercel.");
  }
  return token.trim().replace(/^["']|["']$/g, "");
}

function centsToMoney(cents: number) {
  return Math.round(cents) / 100;
}

async function createMercadoPagoPreference({
  orderId,
  payerEmail,
  items,
  amountDueCents,
}: {
  orderId: string;
  payerEmail?: string | null;
  items: Array<{ product_name: string; quantity: number; total_price_cents: number }>;
  amountDueCents: number;
}) {
  const baseUrl = getPublicBaseUrl();
  const webhookUrl =
    process.env.MERCADO_PAGO_WEBHOOK_URL || `${baseUrl}/api/webhooks/mercado-pago`;
  const accessToken = getMercadoPagoAccessToken();

  const preferenceItems =
    items.length === 1
      ? [
          {
            id: orderId,
            title: items[0].product_name,
            quantity: 1,
            currency_id: "BRL",
            unit_price: centsToMoney(amountDueCents),
          },
        ]
      : [
          {
            id: orderId,
            title: "Clube das Colecionadoras",
            quantity: 1,
            currency_id: "BRL",
            unit_price: centsToMoney(amountDueCents),
          },
        ];

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: preferenceItems,
      payer: payerEmail ? { email: payerEmail } : undefined,
      external_reference: orderId,
      back_urls: {
        success: `${baseUrl}/clubedascolecionadoras/pagamento/sucesso?order=${orderId}`,
        pending: `${baseUrl}/clubedascolecionadoras/pagamento/pendente?order=${orderId}`,
        failure: `${baseUrl}/clubedascolecionadoras/pagamento/falha?order=${orderId}`,
      },
      auto_return: "approved",
      notification_url: webhookUrl,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("[MercadoPago Checkout Error]", {
      status: response.status,
      statusText: response.statusText,
      payload,
    });
    throw new Error(payload?.message || "Erro ao criar preferência no Mercado Pago.");
  }

  return payload as {
    id: string;
    init_point?: string;
    sandbox_init_point?: string;
  };
}

async function fetchMercadoPagoPayment(paymentId: string) {
  const { fetchMercadoPagoPaymentSecure } = await import("@/lib/mercadoPagoApi.server");
  return fetchMercadoPagoPaymentSecure(paymentId);
}

export const createMercadoPagoCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => createCheckoutSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: userResult } = await supabase.auth.getUser();
    const payerEmail = userResult.user?.email ?? null;

    const { data: createdOrder, error: createError } = await supabase.rpc(
      "create_purchase_order_from_cart",
      {
        cart_items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
    );
    if (createError) throw new Error(createError.message);

    const orderId = String((createdOrder as any).order_id);

    let amountDueCents = Number((createdOrder as any).amount_due_cents || 0);
    let pointsUsed = 0;
    let couponDiscountCents = 0;

    if (data.couponCode && data.couponCode.trim() !== "") {
      const { data: valResult, error: valError } = await supabaseAdmin.rpc("validate_coupon", {
        coupon_code_param: data.couponCode,
      });
      if (valError) throw new Error(valError.message);
      const val = valResult as any;
      if (!val.valid) {
        throw new Error(val.message || "Cupom inválido.");
      }

      if (val.discount_percent > 0) {
        couponDiscountCents = Math.round((amountDueCents * val.discount_percent) / 100);
      } else if (val.discount_cents > 0) {
        couponDiscountCents = Math.min(amountDueCents, val.discount_cents);
      }

      amountDueCents = Math.max(0, amountDueCents - couponDiscountCents);

      await supabaseAdmin
        .from("purchase_orders")
        .update({
          coupon_code: val.code,
          coupon_discount_cents: couponDiscountCents,
          amount_due_cents: amountDueCents,
        })
        .eq("id", orderId);

      // Increment coupon usage count
      const { data: cRow } = await supabaseAdmin
        .from("coupons")
        .select("uses_count")
        .eq("code", val.code)
        .maybeSingle();
      if (cRow) {
        await supabaseAdmin
          .from("coupons")
          .update({ uses_count: (cRow.uses_count || 0) + 1 })
          .eq("code", val.code);
      }
    }

    if (data.requestedPoints > 0 && amountDueCents > 0) {
      const { data: pointResult, error: pointError } = await supabase.rpc(
        "apply_points_to_purchase_order",
        {
          order_id_param: orderId,
          requested_points_param: data.requestedPoints,
        },
      );
      if (pointError) throw new Error(pointError.message);
      amountDueCents = Number((pointResult as any).amount_due_cents || 0);
      pointsUsed = Number((pointResult as any).points_used || 0);
    }

    if (amountDueCents === 0) {
      const { error: approveError } = await supabase.rpc("approve_points_only_purchase_order", {
        order_id_param: orderId,
      });
      if (approveError) throw new Error(approveError.message);

      return {
        orderId,
        checkoutUrl: `/clubedascolecionadoras/pagamento/sucesso?order=${orderId}`,
        amountDueCents,
        pointsUsed,
        requiresMercadoPago: false,
      };
    }

    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from("purchase_order_items")
      .select("product_name, quantity, total_price_cents")
      .eq("order_id", orderId);
    if (itemsError) throw new Error(itemsError.message);

    const preference = await createMercadoPagoPreference({
      orderId,
      payerEmail,
      items: orderItems || [],
      amountDueCents,
    });

    const checkoutUrl = preference.init_point || preference.sandbox_init_point;
    if (!checkoutUrl) {
      throw new Error("Mercado Pago não retornou URL de checkout.");
    }

    const { error: updateError } = await supabaseAdmin
      .from("purchase_orders")
      .update({
        status: "pending_payment",
        payment_status: "pending",
        payment_pending_at: new Date().toISOString(),
        mercado_pago_preference_id: preference.id,
        init_point: preference.init_point || null,
        sandbox_init_point: preference.sandbox_init_point || null,
        checkout_url: checkoutUrl,
      })
      .eq("id", orderId)
      .eq("user_id", userId);
    if (updateError) throw new Error(updateError.message);

    return {
      orderId,
      checkoutUrl,
      amountDueCents,
      pointsUsed,
      requiresMercadoPago: true,
    };
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data) => getOrderSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: order, error: orderError } = await supabase
      .from("purchase_orders")
      .select("*")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderError) throw new Error(orderError.message);
    if (!order) throw new Error("Pedido não encontrado.");

    const [{ data: items }, { data: packs }, { data: payments }] = await Promise.all([
      supabase
        .from("purchase_order_items")
        .select("*")
        .eq("order_id", data.orderId)
        .order("created_at", { ascending: true }),
      supabase
        .from("purchase_packs")
        .select("*")
        .eq("order_id", data.orderId)
        .order("pack_number", { ascending: true }),
      supabase
        .from("purchase_payments")
        .select("*")
        .eq("order_id", data.orderId)
        .order("created_at", { ascending: false }),
    ]);

    return {
      order,
      items: items || [],
      packs: packs || [],
      payments: payments || [],
    };
  });

export const reconcileMercadoPagoPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => reconcilePaymentSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error: orderError } = await supabase
      .from("purchase_orders")
      .select("id, user_id, amount_due_cents, currency, status, payment_status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderError) throw new Error(orderError.message);
    if (!order) throw new Error("Pedido não encontrado.");

    if (order.payment_status === "approved") {
      return { ok: true, already_approved: true };
    }

    const cleanPaymentId = decodeURIComponent(String(data.paymentId || "")).replace(/[^0-9]/g, "");

    const payment = await fetchMercadoPagoPayment(cleanPaymentId);

    if (String(payment?.external_reference || "") !== data.orderId) {
      throw new Error("O pagamento não pertence a este pedido.");
    }

    const { data: result, error: processError } = await supabaseAdmin.rpc(
      "process_mercado_pago_payment",
      { payment_payload: payment },
    );
    if (processError) throw new Error(processError.message);

    return result;
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data || [];
  });

