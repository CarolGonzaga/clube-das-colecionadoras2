import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Acesso administrativo não autorizado.");
  return supabaseAdmin;
}

async function audit(admin: any, adminUserId: string, action: string, entityType: string, entityId: string | null, beforeData: unknown, afterData: unknown) {
  const { error } = await admin.from("admin_audit_logs").insert({
    admin_user_id: adminUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before_data: beforeData || null,
    after_data: afterData || null,
  });
  if (error) throw new Error(`Não foi possível registrar a auditoria: ${error.message}`);
}

const dashboardSchema = z.object({
  search: z.string().max(120).optional().default(""),
  sort: z.enum(["nick", "email", "created_at", "last_sign_in_at", "total_spent"]).optional().default("nick"),
  page: z.number().int().min(1).optional().default(1),
});

export const getAdminDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => dashboardSchema.parse(value))
  .handler(async ({ context, data }) => {
    const admin = await requireAdmin(context.userId);
    const [metricsResult, ordersResult, couponsResult, productsResult, redeemCodesResult] = await Promise.all([
      admin.from("admin_user_metrics").select("*"),
      admin.from("purchase_orders").select("id,order_code,user_id,status,payment_status,payment_provider,total_cents,points_used,coupon_code,coupon_discount_cents,amount_due_cents,created_at,payment_approved_at,purchase_order_items(product_name,quantity,total_price_cents)").order("created_at", { ascending: false }).limit(200),
      admin.from("coupons").select("id,code,discount_percent,discount_cents,max_uses,max_uses_per_user,uses_count,expires_at,is_active,created_at").order("created_at", { ascending: false }),
      admin.from("shop_products").select("id,name,description,product_type,sticker_number,pack_count,stickers_per_pack,price_cents,point_price,currency,active,metadata,image_url,display_section,sort_order,created_at,updated_at").order("sort_order").order("name"),
      admin.from("admin_redeem_code_metrics").select("*").order("active", { ascending: false }).order("code"),
    ]);
    for (const result of [metricsResult, ordersResult, couponsResult, productsResult]) {
      if (result.error) throw new Error(result.error.message);
    }
    let redeemCodes = redeemCodesResult.data || [];
    if (redeemCodesResult.error) {
      const fallback = await admin
        .from("redeem_codes")
        .select("code,label,element,active,max_redemptions,grant_all_pool,copies_per_sticker,redeem_pools(sticker_number)")
        .order("active", { ascending: false })
        .order("code");
      if (fallback.error) throw new Error(fallback.error.message);
      redeemCodes = (fallback.data || []).map((row: any) => ({
        ...row,
        redemption_count: null,
        sticker_numbers: (row.redeem_pools || []).map((item: any) => item.sticker_number).sort((a: number, b: number) => a - b),
      }));
    }

    const authUsers: any[] = [];
    for (let page = 1; page <= 10; page += 1) {
      const { data: authPage, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);
      authUsers.push(...authPage.users);
      if (authPage.users.length < 1000) break;
    }
    const metrics = new Map((metricsResult.data || []).map((row: any) => [row.user_id, row]));
    let users = authUsers.map((user) => ({
      id: user.id,
      email: user.email || "",
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      banned_until: user.banned_until,
      ...(metrics.get(user.id) || { nick: "", distinct_stickers: 0, rare_stickers: 0, repeat_copies: 0, total_spent_cents: 0, approved_orders: 0 }),
    }));
    const search = data.search.trim().toLocaleLowerCase("pt-BR");
    if (search) users = users.filter((user) => user.email.toLocaleLowerCase("pt-BR").includes(search) || String(user.nick || "").toLocaleLowerCase("pt-BR").includes(search));
    users.sort((a, b) => {
      if (data.sort === "total_spent") return Number(b.total_spent_cents) - Number(a.total_spent_cents);
      if (data.sort === "created_at" || data.sort === "last_sign_in_at") return new Date(b[data.sort] || 0).getTime() - new Date(a[data.sort] || 0).getTime();
      return String(a[data.sort] || "").localeCompare(String(b[data.sort] || ""), "pt-BR");
    });
    const perPage = 50;
    const totalUsers = users.length;
    users = users.slice((data.page - 1) * perPage, data.page * perPage);
    return { users, totalUsers, perPage, orders: ordersResult.data || [], coupons: couponsResult.data || [], products: productsResult.data || [], redeemCodes };
  });

const couponSchema = z.object({
  id: z.string().uuid().optional(), code: z.string().trim().min(3).max(80).regex(/^[A-Za-z0-9_-]+$/, "Use somente letras, números, hífen e sublinhado."),
  discountPercent: z.number().int().min(0).max(100), expiresAt: z.string().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(), maxUsesPerUser: z.number().int().positive().nullable().optional(),
  active: z.boolean(),
});

export const saveAdminCoupon = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((v) => couponSchema.parse(v)).handler(async ({ context, data }) => {
  const admin = await requireAdmin(context.userId);
  const { data: duplicate } = await admin.from("coupons").select("id").ilike("code", data.code).neq("id", data.id || "00000000-0000-0000-0000-000000000000").maybeSingle();
  if (duplicate) throw new Error("Já existe um cupom com esse nome.");
  const before = data.id ? (await admin.from("coupons").select("*").eq("id", data.id).maybeSingle()).data : null;
  const payload = { code: data.code, discount_percent: data.discountPercent, discount_cents: 0, expires_at: data.expiresAt || null, max_uses: data.maxUses || null, max_uses_per_user: data.maxUsesPerUser || null, is_active: data.active };
  const result = data.id ? await admin.from("coupons").update(payload).eq("id", data.id).select().single() : await admin.from("coupons").insert(payload).select().single();
  if (result.error) throw new Error(result.error.message);
  await audit(admin, context.userId, data.id ? "coupon.update" : "coupon.create", "coupon", result.data.id, before, result.data);
  return result.data;
});

export const deleteAdminCoupon = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((v) => z.object({ id: z.string().uuid() }).parse(v)).handler(async ({ context, data }) => {
  const admin = await requireAdmin(context.userId);
  const before = (await admin.from("coupons").select("*").eq("id", data.id).single()).data;
  if (!before) throw new Error("Cupom não encontrado.");
  const { error } = await admin.from("coupons").update({ is_active: false }).eq("id", data.id);
  if (error) throw new Error(error.message);
  await audit(admin, context.userId, "coupon.archive", "coupon", data.id, before, { ...before, is_active: false });
  return { success: true };
});

const productSchema = z.object({
  id: z.string().trim().min(3).max(80).regex(/^[a-z0-9-]+$/, "O ID deve usar letras minúsculas, números e hífen."), name: z.string().trim().min(2).max(150), description: z.string().max(1000),
  productType: z.enum(["pack", "combo", "single_random", "exclusive"]), stickerNumber: z.number().int().min(1).max(359).nullable().optional(),
  packCount: z.number().int().min(0), stickersPerPack: z.number().int().min(0), priceCents: z.number().int().min(0), pointPrice: z.number().int().min(0),
  imageUrl: z.string().trim().max(500), displaySection: z.enum(["pacotes", "unitarias", "exclusivas"]), sortOrder: z.number().int(), active: z.boolean(),
});

export const saveAdminProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((v) => productSchema.parse(v)).handler(async ({ context, data }) => {
  const admin = await requireAdmin(context.userId);
  if (data.productType === "exclusive" && !data.stickerNumber) throw new Error("Selecione a figurinha exclusiva.");
  const before = (await admin.from("shop_products").select("*").eq("id", data.id).maybeSingle()).data;
  const payload = { id: data.id, name: data.name, description: data.description, product_type: data.productType, sticker_number: data.productType === "exclusive" ? data.stickerNumber : null, pack_count: data.packCount, stickers_per_pack: data.stickersPerPack, price_cents: data.priceCents, point_price: data.pointPrice, image_url: data.imageUrl || null, display_section: data.displaySection, sort_order: data.sortOrder, active: data.active, metadata: data.productType === "exclusive" ? {} : { pool_start: 194, pool_end: 319 } };
  const { data: saved, error } = await admin.from("shop_products").upsert(payload).select().single();
  if (error) throw new Error(error.message);
  await audit(admin, context.userId, before ? "product.update" : "product.create", "shop_product", data.id, before, saved);
  return saved;
});

export const archiveAdminProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((v) => z.object({ id: z.string() }).parse(v)).handler(async ({ context, data }) => {
  const admin = await requireAdmin(context.userId);
  const before = (await admin.from("shop_products").select("*").eq("id", data.id).single()).data;
  if (!before) throw new Error("Produto não encontrado.");
  const { error } = await admin.from("shop_products").update({ active: false }).eq("id", data.id);
  if (error) throw new Error(error.message);
  await audit(admin, context.userId, "product.archive", "shop_product", data.id, before, { ...before, active: false });
  return { success: true };
});

export const setAdminRedeemCodeActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => z.object({ code: z.string().trim().min(1).max(80), active: z.boolean() }).parse(value))
  .handler(async ({ context, data }) => {
    const admin = await requireAdmin(context.userId);
    const before = (await admin.from("redeem_codes").select("*").eq("code", data.code).maybeSingle()).data;
    if (!before) throw new Error("Código de resgate não encontrado.");
    const { data: saved, error } = await admin
      .from("redeem_codes")
      .update({ active: data.active })
      .eq("code", data.code)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await audit(admin, context.userId, data.active ? "redeem_code.activate" : "redeem_code.deactivate", "redeem_code", data.code, before, saved);
    return saved;
  });
