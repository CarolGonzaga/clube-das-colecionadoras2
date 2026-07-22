-- Enforce coupon usage limits per user atomically at checkout.

alter table public.coupons
  add column if not exists max_uses_per_user integer
  check (max_uses_per_user is null or max_uses_per_user > 0);

update public.coupons
set max_uses_per_user = 1,
    is_active = true
where upper(code) = 'LENDOSAFICOS10';

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  order_id uuid not null references public.purchase_orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (coupon_id, user_id, order_id)
);

create index if not exists coupon_redemptions_user_coupon_idx
  on public.coupon_redemptions(user_id, coupon_id);

insert into public.coupon_redemptions (coupon_id, user_id, order_id, created_at)
select c.id, po.user_id, po.id, po.created_at
from public.purchase_orders po
join public.coupons c on upper(c.code) = upper(po.coupon_code)
where po.coupon_code is not null
on conflict (coupon_id, user_id, order_id) do nothing;

alter table public.coupon_redemptions enable row level security;
revoke all on table public.coupon_redemptions from public, anon, authenticated;
grant all on table public.coupon_redemptions to service_role;

create or replace function public.validate_coupon_for_user(coupon_code_param text, user_id_param uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  coupon_row public.coupons%rowtype;
  user_uses integer;
  clean_code text := upper(trim(coalesce(coupon_code_param, '')));
begin
  if clean_code = '' then
    return jsonb_build_object('valid', false, 'message', 'Por favor, informe o código do cupom.');
  end if;

  select * into coupon_row from public.coupons where upper(code) = clean_code;
  if coupon_row.id is null then
    return jsonb_build_object('valid', false, 'message', 'Cupom inválido ou inexistente.');
  end if;
  if not coupon_row.is_active then
    return jsonb_build_object('valid', false, 'message', 'Este cupom não está mais ativo.');
  end if;
  if coupon_row.expires_at is not null and coupon_row.expires_at < now() then
    return jsonb_build_object('valid', false, 'message', 'Este cupom já expirou.');
  end if;
  if coupon_row.max_uses is not null and coupon_row.uses_count >= coupon_row.max_uses then
    return jsonb_build_object('valid', false, 'message', 'Este cupom atingiu o limite máximo de utilizações.');
  end if;

  select count(*) into user_uses
  from public.coupon_redemptions
  where coupon_id = coupon_row.id and user_id = user_id_param;

  if coupon_row.max_uses_per_user is not null and user_uses >= coupon_row.max_uses_per_user then
    return jsonb_build_object('valid', false, 'message', 'Você já utilizou este cupom.');
  end if;

  return jsonb_build_object(
    'valid', true, 'code', coupon_row.code,
    'discount_percent', coupon_row.discount_percent,
    'discount_cents', coupon_row.discount_cents,
    'message', 'Cupom aplicado com sucesso!'
  );
end;
$$;

revoke all on function public.validate_coupon_for_user(text, uuid) from public, anon, authenticated;
grant execute on function public.validate_coupon_for_user(text, uuid) to service_role;

create or replace function public.apply_coupon_to_purchase_order(
  order_id_param uuid,
  user_id_param uuid,
  coupon_code_param text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  order_row public.purchase_orders%rowtype;
  coupon_row public.coupons%rowtype;
  user_uses integer;
  discount_value integer;
  new_amount_due integer;
  clean_code text := upper(trim(coalesce(coupon_code_param, '')));
begin
  select * into order_row
  from public.purchase_orders
  where id = order_id_param
  for update;

  if order_row.id is null or order_row.user_id <> user_id_param then
    raise exception 'Pedido não encontrado.';
  end if;
  if order_row.status not in ('created', 'pending_payment')
     or order_row.payment_status in ('approved', 'refunded', 'charged_back') then
    raise exception 'Este pedido não aceita mais cupons.';
  end if;

  select * into coupon_row
  from public.coupons
  where upper(code) = clean_code
  for update;

  if coupon_row.id is null then
    return jsonb_build_object('valid', false, 'message', 'Cupom inválido ou inexistente.');
  end if;
  if not coupon_row.is_active then
    return jsonb_build_object('valid', false, 'message', 'Este cupom não está mais ativo.');
  end if;
  if coupon_row.expires_at is not null and coupon_row.expires_at < now() then
    return jsonb_build_object('valid', false, 'message', 'Este cupom já expirou.');
  end if;

  if order_row.coupon_code is not null then
    if upper(order_row.coupon_code) = upper(coupon_row.code) then
      return jsonb_build_object(
        'valid', true, 'code', coupon_row.code,
        'coupon_discount_cents', order_row.coupon_discount_cents,
        'amount_due_cents', order_row.amount_due_cents,
        'message', 'Cupom já aplicado a este pedido.'
      );
    end if;
    return jsonb_build_object('valid', false, 'message', 'Este pedido já possui outro cupom.');
  end if;

  if coupon_row.max_uses is not null and coupon_row.uses_count >= coupon_row.max_uses then
    return jsonb_build_object('valid', false, 'message', 'Este cupom atingiu o limite máximo de utilizações.');
  end if;

  select count(*) into user_uses
  from public.coupon_redemptions
  where coupon_id = coupon_row.id and user_id = user_id_param;

  if coupon_row.max_uses_per_user is not null and user_uses >= coupon_row.max_uses_per_user then
    return jsonb_build_object('valid', false, 'message', 'Você já utilizou este cupom.');
  end if;

  discount_value := case
    when coupon_row.discount_percent > 0
      then round(order_row.amount_due_cents * coupon_row.discount_percent / 100.0)
    else least(order_row.amount_due_cents, coupon_row.discount_cents)
  end;
  new_amount_due := greatest(0, order_row.amount_due_cents - discount_value);

  insert into public.coupon_redemptions(coupon_id, user_id, order_id)
  values (coupon_row.id, user_id_param, order_row.id);

  update public.coupons set uses_count = uses_count + 1 where id = coupon_row.id;
  update public.purchase_orders
  set coupon_code = coupon_row.code,
      coupon_discount_cents = discount_value,
      amount_due_cents = new_amount_due,
      updated_at = now()
  where id = order_row.id;

  return jsonb_build_object(
    'valid', true, 'code', coupon_row.code,
    'coupon_discount_cents', discount_value,
    'amount_due_cents', new_amount_due,
    'message', 'Cupom aplicado com sucesso!'
  );
end;
$$;

revoke all on function public.apply_coupon_to_purchase_order(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.apply_coupon_to_purchase_order(uuid, uuid, text) to service_role;

