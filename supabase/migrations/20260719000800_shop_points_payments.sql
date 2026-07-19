-- Points as a payment method for the V2 shop.
-- 1 point = R$0.01. Cash remainder is paid through Mercado Pago.

alter table public.shop_products
  add column if not exists point_price integer not null default 0 check (point_price >= 0);

alter table public.purchase_orders
  add column if not exists subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  add column if not exists points_used integer not null default 0 check (points_used >= 0),
  add column if not exists points_discount_cents integer not null default 0 check (points_discount_cents >= 0),
  add column if not exists amount_due_cents integer not null default 0 check (amount_due_cents >= 0),
  add column if not exists points_applied_at timestamptz;

alter table public.purchase_order_items
  add column if not exists unit_point_price integer not null default 0 check (unit_point_price >= 0),
  add column if not exists total_point_price integer not null default 0 check (total_point_price >= 0);

alter table public.point_transactions
  add column if not exists order_id uuid references public.purchase_orders(id) on delete set null,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists point_transactions_order_idx
  on public.point_transactions(order_id);

update public.shop_products
set point_price = case id
  when 'pack-1' then 250
  when 'pack-combo' then 2250
  when 'single-random' then 100
  else point_price
end,
updated_at = now()
where id in ('pack-1', 'pack-combo', 'single-random');

update public.shop_products
set point_price = 250,
    price_cents = 250,
    updated_at = now()
where product_type = 'exclusive';

create or replace function public.apply_points_to_purchase_order(
  order_id_param uuid,
  requested_points_param integer
)
returns jsonb as $$
declare
  caller_id uuid;
  order_row public.purchase_orders%rowtype;
  current_balance integer;
  cart_point_total integer;
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

  usable_points := least(
    requested_points_param,
    current_balance,
    cart_point_total,
    greatest(order_row.total_cents, order_row.subtotal_cents)
  );

  new_amount_due := greatest(greatest(order_row.total_cents, order_row.subtotal_cents) - usable_points, 0);

  update public.user_points
  set balance = balance - usable_points,
      updated_at = now()
  where user_id = caller_id;

  insert into public.point_transactions(user_id, amount, reason, order_id, metadata)
  values (
    caller_id,
    -usable_points,
    'shop_payment',
    order_id_param,
    jsonb_build_object(
      'requested_points', requested_points_param,
      'cart_point_total', cart_point_total,
      'amount_due_cents', new_amount_due
    )
  );

  update public.purchase_orders
  set subtotal_cents = greatest(total_cents, subtotal_cents),
      points_used = usable_points,
      points_discount_cents = usable_points,
      amount_due_cents = new_amount_due,
      points_applied_at = now(),
      status = case when new_amount_due = 0 then 'approved' else 'pending_payment' end
  where id = order_id_param
  returning * into order_row;

  insert into public.purchase_events(order_id, user_id, event_type, message, metadata)
  values (
    order_id_param,
    caller_id,
    'points_applied',
    'Pontos aplicados ao pedido.',
    jsonb_build_object(
      'points_used', usable_points,
      'points_discount_cents', usable_points,
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
$$ language plpgsql security definer set search_path = public;

revoke all on function public.apply_points_to_purchase_order(uuid, integer) from public, anon, authenticated;
grant execute on function public.apply_points_to_purchase_order(uuid, integer) to authenticated;

create or replace function public.refund_purchase_order_points(order_id_param uuid)
returns jsonb as $$
declare
  order_row public.purchase_orders%rowtype;
begin
  select *
  into order_row
  from public.purchase_orders
  where id = order_id_param
  for update;

  if order_row.id is null then
    raise exception 'Pedido nao encontrado.';
  end if;

  if order_row.points_used <= 0 then
    return jsonb_build_object('refunded_points', 0);
  end if;

  if exists (
    select 1
    from public.point_transactions
    where order_id = order_id_param
      and reason = 'shop_payment_refund'
  ) then
    return jsonb_build_object('refunded_points', 0, 'already_refunded', true);
  end if;

  perform public.ensure_user_points(order_row.user_id);

  update public.user_points
  set balance = balance + order_row.points_used,
      updated_at = now()
  where user_id = order_row.user_id;

  insert into public.point_transactions(user_id, amount, reason, order_id, metadata)
  values (
    order_row.user_id,
    order_row.points_used,
    'shop_payment_refund',
    order_id_param,
    jsonb_build_object('source_status', order_row.status)
  );

  insert into public.purchase_events(order_id, user_id, event_type, message, metadata)
  values (
    order_id_param,
    order_row.user_id,
    'points_refunded',
    'Pontos devolvidos ao usuario.',
    jsonb_build_object('points_refunded', order_row.points_used)
  );

  update public.purchase_orders
  set points_used = 0,
      points_discount_cents = 0,
      amount_due_cents = greatest(total_cents, subtotal_cents)
  where id = order_id_param;

  return jsonb_build_object('refunded_points', order_row.points_used);
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.refund_purchase_order_points(uuid) from public, anon, authenticated;
grant execute on function public.refund_purchase_order_points(uuid) to service_role;
