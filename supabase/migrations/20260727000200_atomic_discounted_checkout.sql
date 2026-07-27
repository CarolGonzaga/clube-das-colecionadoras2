-- Apply coupon and points in the same database transaction.
-- A failure in any step rolls back the order, coupon redemption and point debit.

create or replace function public.create_discounted_purchase_order_from_cart(
  cart_items jsonb,
  requested_points_param integer default 0,
  coupon_code_param text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_created jsonb;
  v_coupon_result jsonb;
  v_points_result jsonb;
  v_order public.purchase_orders%rowtype;
  v_order_id uuid;
  v_coupon_code text := nullif(btrim(coalesce(coupon_code_param, '')), '');
  v_requested_points integer := greatest(coalesce(requested_points_param, 0), 0);
begin
  if v_uid is null then
    raise exception 'Não autorizado.';
  end if;

  v_created := public.create_purchase_order_from_cart(cart_items);
  v_order_id := (v_created->>'order_id')::uuid;

  if v_coupon_code is not null then
    v_coupon_result := public.apply_coupon_to_purchase_order(
      v_order_id,
      v_uid,
      v_coupon_code
    );

    if not coalesce((v_coupon_result->>'valid')::boolean, false) then
      raise exception '%',
        coalesce(v_coupon_result->>'message', 'Não foi possível aplicar o cupom.');
    end if;
  end if;

  if v_requested_points > 0 then
    v_points_result := public.apply_points_to_purchase_order(
      v_order_id,
      v_requested_points
    );
  end if;

  select *
  into v_order
  from public.purchase_orders
  where id = v_order_id
    and user_id = v_uid;

  if v_order.id is null then
    raise exception 'Pedido não encontrado após o cálculo dos descontos.';
  end if;

  if v_order.amount_due_cents <> public.calculate_purchase_amount_due(
    greatest(v_order.total_cents, v_order.subtotal_cents),
    v_order.coupon_discount_cents,
    v_order.points_discount_cents
  ) then
    raise exception 'O valor final do pedido ficou inconsistente.';
  end if;

  return jsonb_build_object(
    'order_id', v_order.id,
    'total_cents', v_order.total_cents,
    'subtotal_cents', v_order.subtotal_cents,
    'coupon_code', v_order.coupon_code,
    'coupon_discount_cents', v_order.coupon_discount_cents,
    'points_used', v_order.points_used,
    'points_discount_cents', v_order.points_discount_cents,
    'amount_due_cents', v_order.amount_due_cents,
    'currency', v_order.currency
  );
end;
$$;

revoke all on function public.create_discounted_purchase_order_from_cart(
  jsonb,
  integer,
  text
) from public, anon;
grant execute on function public.create_discounted_purchase_order_from_cart(
  jsonb,
  integer,
  text
) to authenticated;

-- Compensating operation used only when the external provider fails before
-- returning a checkout URL. Approved orders and orders with approved payments
-- can never be cancelled by this function.
create or replace function public.cancel_failed_purchase_checkout(
  order_id_param uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.purchase_orders%rowtype;
  v_coupon_id uuid;
  v_refund jsonb;
begin
  if v_uid is null then
    raise exception 'Não autorizado.';
  end if;

  select *
  into v_order
  from public.purchase_orders
  where id = order_id_param
    and user_id = v_uid
  for update;

  if v_order.id is null then
    raise exception 'Pedido não encontrado.';
  end if;

  if v_order.payment_status = 'approved'
     or v_order.status in ('approved', 'partially_opened', 'completed')
     or exists (
       select 1
       from public.purchase_payments pp
       where pp.order_id = v_order.id
         and pp.status = 'approved'
     ) then
    raise exception 'Pedido aprovado não pode ser cancelado.';
  end if;

  update public.purchase_orders
  set status = 'cancelled',
      payment_status = 'cancelled',
      fulfillment_status = 'cancelled',
      cancelled_at = coalesce(cancelled_at, now()),
      checkout_url = null,
      init_point = null,
      sandbox_init_point = null,
      mercado_pago_preference_id = null,
      provider_checkout_reference = null,
      updated_at = now()
  where id = v_order.id;

  v_refund := public.refund_purchase_order_points(v_order.id);

  delete from public.coupon_redemptions
  where order_id = v_order.id
    and user_id = v_uid
  returning coupon_id into v_coupon_id;

  if v_coupon_id is not null then
    update public.coupons
    set uses_count = greatest(0, uses_count - 1)
    where id = v_coupon_id;
  end if;

  update public.purchase_orders
  set coupon_code = null,
      coupon_discount_cents = 0,
      amount_due_cents = greatest(total_cents, subtotal_cents),
      updated_at = now()
  where id = v_order.id;

  return jsonb_build_object(
    'order_id', v_order.id,
    'cancelled', true,
    'refunded_points', coalesce((v_refund->>'refunded_points')::integer, 0),
    'coupon_released', v_coupon_id is not null
  );
end;
$$;

revoke all on function public.cancel_failed_purchase_checkout(uuid)
  from public, anon;
grant execute on function public.cancel_failed_purchase_checkout(uuid)
  to authenticated;

notify pgrst, 'reload schema';
