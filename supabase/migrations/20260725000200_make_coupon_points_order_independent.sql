-- Make checkout discounts order-independent:
-- amount due = gross order total - coupon discount - points discount.
-- Keep the existing RPC signatures, response fields and permissions intact.

create or replace function public.calculate_purchase_amount_due(
  base_amount_cents integer,
  coupon_discount_cents integer,
  points_discount_cents integer
)
returns integer
language sql
immutable
strict
set search_path = public
as $$
  select greatest(
    greatest(base_amount_cents, 0)
      - greatest(coupon_discount_cents, 0)
      - greatest(points_discount_cents, 0),
    0
  );
$$;

revoke all on function public.calculate_purchase_amount_due(
  integer,
  integer,
  integer
) from public, anon, authenticated;
grant execute on function public.calculate_purchase_amount_due(
  integer,
  integer,
  integer
) to service_role;

create or replace function public.apply_points_to_purchase_order(
  order_id_param uuid,
  requested_points_param integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid;
  order_row public.purchase_orders%rowtype;
  current_balance integer;
  cart_point_total integer;
  base_amount integer;
  amount_after_coupon integer;
  usable_points integer;
  new_amount_due integer;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Unauthorized';
  end if;

  if requested_points_param is null or requested_points_param < 0 then
    raise exception 'Quantidade de pontos invalida.';
  end if;

  select *
  into order_row
  from public.purchase_orders
  where id = order_id_param
    and user_id = caller_id
  for update;

  if order_row.id is null then
    raise exception 'Pedido nao encontrado.';
  end if;

  if order_row.status not in ('created', 'pending_payment') then
    raise exception 'Este pedido nao permite alteracao de pontos.';
  end if;

  if order_row.points_used > 0 or order_row.points_applied_at is not null then
    raise exception 'Pontos ja aplicados neste pedido.';
  end if;

  perform public.ensure_user_points(caller_id);

  select balance
  into current_balance
  from public.user_points
  where user_id = caller_id
  for update;

  select coalesce(sum(total_point_price), 0)
  into cart_point_total
  from public.purchase_order_items
  where order_id = order_id_param;

  base_amount := greatest(order_row.total_cents, order_row.subtotal_cents);
  amount_after_coupon := greatest(
    base_amount - order_row.coupon_discount_cents,
    0
  );

  usable_points := least(
    requested_points_param,
    current_balance,
    cart_point_total,
    amount_after_coupon
  );

  new_amount_due := public.calculate_purchase_amount_due(
    base_amount,
    order_row.coupon_discount_cents,
    usable_points
  );

  update public.user_points
  set balance = balance - usable_points,
      updated_at = now()
  where user_id = caller_id;

  insert into public.point_transactions(
    user_id,
    amount,
    reason,
    order_id,
    metadata
  )
  values (
    caller_id,
    -usable_points,
    'shop_payment',
    order_id_param,
    jsonb_build_object(
      'requested_points', requested_points_param,
      'cart_point_total', cart_point_total,
      'coupon_discount_cents', order_row.coupon_discount_cents,
      'amount_due_cents', new_amount_due
    )
  );

  update public.purchase_orders
  set subtotal_cents = base_amount,
      points_used = usable_points,
      points_discount_cents = usable_points,
      amount_due_cents = new_amount_due,
      points_applied_at = now(),
      status = case
        when new_amount_due = 0 then 'approved'
        else 'pending_payment'
      end,
      updated_at = now()
  where id = order_id_param;

  insert into public.purchase_events(
    order_id,
    user_id,
    event_type,
    message,
    metadata
  )
  values (
    order_id_param,
    caller_id,
    'points_applied',
    'Pontos aplicados ao pedido.',
    jsonb_build_object(
      'points_used', usable_points,
      'points_discount_cents', usable_points,
      'coupon_discount_cents', order_row.coupon_discount_cents,
      'amount_due_cents', new_amount_due
    )
  );

  return jsonb_build_object(
    'order_id', order_id_param,
    'points_used', usable_points,
    'points_discount_cents', usable_points,
    'amount_due_cents', new_amount_due,
    'requires_mercado_pago', new_amount_due > 0
  );
end;
$$;

revoke all on function public.apply_points_to_purchase_order(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.apply_points_to_purchase_order(uuid, integer)
  to authenticated;

create or replace function public.apply_coupon_to_purchase_order(
  order_id_param uuid,
  user_id_param uuid,
  coupon_code_param text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  order_row public.purchase_orders%rowtype;
  coupon_row public.coupons%rowtype;
  user_uses integer;
  base_amount integer;
  discount_value integer;
  adjusted_points integer;
  points_to_refund integer;
  new_amount_due integer;
  clean_code text := upper(trim(coalesce(coupon_code_param, '')));
begin
  select *
  into order_row
  from public.purchase_orders
  where id = order_id_param
  for update;

  if order_row.id is null or order_row.user_id <> user_id_param then
    raise exception 'Pedido nao encontrado.';
  end if;

  if order_row.status not in ('created', 'pending_payment')
     or order_row.payment_status in ('approved', 'refunded', 'charged_back') then
    raise exception 'Este pedido nao aceita mais cupons.';
  end if;

  select *
  into coupon_row
  from public.coupons
  where upper(code) = clean_code
  for update;

  if coupon_row.id is null then
    return jsonb_build_object(
      'valid', false,
      'message', 'Cupom invalido ou inexistente.'
    );
  end if;

  if not coupon_row.is_active then
    return jsonb_build_object(
      'valid', false,
      'message', 'Este cupom nao esta mais ativo.'
    );
  end if;

  if coupon_row.expires_at is not null and coupon_row.expires_at < now() then
    return jsonb_build_object(
      'valid', false,
      'message', 'Este cupom ja expirou.'
    );
  end if;

  if order_row.coupon_code is not null then
    if upper(order_row.coupon_code) = upper(coupon_row.code) then
      return jsonb_build_object(
        'valid', true,
        'code', coupon_row.code,
        'coupon_discount_cents', order_row.coupon_discount_cents,
        'amount_due_cents', order_row.amount_due_cents,
        'message', 'Cupom ja aplicado a este pedido.'
      );
    end if;

    return jsonb_build_object(
      'valid', false,
      'message', 'Este pedido ja possui outro cupom.'
    );
  end if;

  if coupon_row.max_uses is not null
     and coupon_row.uses_count >= coupon_row.max_uses then
    return jsonb_build_object(
      'valid', false,
      'message', 'Este cupom atingiu o limite maximo de utilizacoes.'
    );
  end if;

  select count(*)
  into user_uses
  from public.coupon_redemptions
  where coupon_id = coupon_row.id
    and user_id = user_id_param;

  if coupon_row.max_uses_per_user is not null
     and user_uses >= coupon_row.max_uses_per_user then
    return jsonb_build_object(
      'valid', false,
      'message', 'Voce ja utilizou este cupom.'
    );
  end if;

  base_amount := greatest(order_row.total_cents, order_row.subtotal_cents);
  discount_value := case
    when coupon_row.discount_percent > 0
      then round(base_amount * coupon_row.discount_percent / 100.0)
    else least(base_amount, coupon_row.discount_cents)
  end;

  -- If points happened to be applied first and exceed the post-coupon total,
  -- return only the excess. The ledger remains balanced and later cancellation
  -- refunds exactly the points that remain attached to the order.
  adjusted_points := least(
    order_row.points_discount_cents,
    greatest(base_amount - discount_value, 0)
  );
  points_to_refund := order_row.points_discount_cents - adjusted_points;
  new_amount_due := public.calculate_purchase_amount_due(
    base_amount,
    discount_value,
    adjusted_points
  );

  if points_to_refund > 0 then
    perform public.ensure_user_points(user_id_param);

    update public.user_points
    set balance = balance + points_to_refund,
        updated_at = now()
    where user_id = user_id_param;

    insert into public.point_transactions(
      user_id,
      amount,
      reason,
      order_id,
      metadata
    )
    values (
      user_id_param,
      points_to_refund,
      'shop_payment_adjustment',
      order_id_param,
      jsonb_build_object(
        'reason', 'coupon_applied_after_points',
        'previous_points_used', order_row.points_discount_cents,
        'adjusted_points_used', adjusted_points,
        'coupon_discount_cents', discount_value
      )
    );
  end if;

  insert into public.coupon_redemptions(coupon_id, user_id, order_id)
  values (coupon_row.id, user_id_param, order_row.id);

  update public.coupons
  set uses_count = uses_count + 1
  where id = coupon_row.id;

  update public.purchase_orders
  set subtotal_cents = base_amount,
      coupon_code = coupon_row.code,
      coupon_discount_cents = discount_value,
      points_used = adjusted_points,
      points_discount_cents = adjusted_points,
      amount_due_cents = new_amount_due,
      status = case
        when new_amount_due = 0 then 'approved'
        else 'pending_payment'
      end,
      updated_at = now()
  where id = order_row.id;

  return jsonb_build_object(
    'valid', true,
    'code', coupon_row.code,
    'coupon_discount_cents', discount_value,
    'points_used', adjusted_points,
    'points_refunded', points_to_refund,
    'amount_due_cents', new_amount_due,
    'message', 'Cupom aplicado com sucesso!'
  );
end;
$$;

revoke all on function public.apply_coupon_to_purchase_order(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.apply_coupon_to_purchase_order(uuid, uuid, text)
  to service_role;

-- Guard the formulas used by both RPCs against accidental regression.
do $$
begin
  if public.calculate_purchase_amount_due(9000, 900, 120) <> 7980 then
    raise exception 'Falha na regra combinada de cupom e pontos.';
  end if;

  if public.calculate_purchase_amount_due(9000, 900, 0) <> 8100 then
    raise exception 'Falha na regra de cupom sem pontos.';
  end if;

  if public.calculate_purchase_amount_due(9000, 0, 120) <> 8880 then
    raise exception 'Falha na regra de pontos sem cupom.';
  end if;

  if public.calculate_purchase_amount_due(9000, 0, 0) <> 9000 then
    raise exception 'Falha na regra sem descontos.';
  end if;

  if public.calculate_purchase_amount_due(9000, 900, 9000) <> 0 then
    raise exception 'Falha no limite inferior do valor do checkout.';
  end if;
end;
$$;

notify pgrst, 'reload schema';
