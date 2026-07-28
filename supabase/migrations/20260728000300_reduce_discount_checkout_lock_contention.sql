-- Reduce checkout contention when many users redeem the same coupon.
--
-- Applying the shared coupon first kept its row lock until all user-specific
-- point operations had finished. Apply points first and acquire the shared
-- coupon lock only at the very end of the transaction. The existing discount
-- functions are order-independent and refund any point excess caused by the
-- coupon, so totals and ledgers remain unchanged.

create index if not exists coupons_upper_code_idx
  on public.coupons (upper(code));

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
    raise exception 'Nao autorizado.';
  end if;

  v_created := public.create_purchase_order_from_cart(cart_items);
  v_order_id := (v_created->>'order_id')::uuid;

  -- This lock is scoped to one user and cannot make unrelated checkouts wait.
  if v_requested_points > 0 then
    v_points_result := public.apply_points_to_purchase_order(
      v_order_id,
      v_requested_points
    );
  end if;

  -- The coupon row is shared by every buyer. Acquire it last so it is held for
  -- only the final few statements before this transaction commits.
  if v_coupon_code is not null then
    v_coupon_result := public.apply_coupon_to_purchase_order(
      v_order_id,
      v_uid,
      v_coupon_code
    );

    if not coalesce((v_coupon_result->>'valid')::boolean, false) then
      raise exception '%',
        coalesce(v_coupon_result->>'message', 'Nao foi possivel aplicar o cupom.');
    end if;
  end if;

  select *
  into v_order
  from public.purchase_orders
  where id = v_order_id
    and user_id = v_uid;

  if v_order.id is null then
    raise exception 'Pedido nao encontrado apos o calculo dos descontos.';
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

notify pgrst, 'reload schema';
