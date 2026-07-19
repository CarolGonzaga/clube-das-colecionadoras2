-- Mercado Pago checkout support for the V2 shop.
-- Orders are created from server-validated products, payments are reconciled from
-- Mercado Pago API responses, and repeated webhook deliveries are idempotent.

alter table public.purchase_orders
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back')),
  add column if not exists fulfillment_status text not null default 'waiting_payment'
    check (fulfillment_status in ('waiting_payment', 'pending_opening', 'partially_opened', 'released', 'cancelled')),
  add column if not exists mercado_pago_preference_id text;

create index if not exists purchase_orders_payment_status_idx
  on public.purchase_orders(payment_status, created_at desc);

create table if not exists public.mercado_pago_webhook_events (
  id uuid primary key default uuid_generate_v4(),
  provider_event_id text,
  provider_payment_id text,
  x_request_id text,
  x_signature text,
  action text,
  event_type text,
  live_mode boolean,
  processed boolean not null default false,
  processing_error text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider_event_id),
  unique(x_request_id, provider_payment_id)
);

alter table public.mercado_pago_webhook_events enable row level security;

grant all on public.mercado_pago_webhook_events to service_role;

drop policy if exists "purchase_payments_read_own" on public.purchase_payments;
create policy "purchase_payments_read_own"
  on public.purchase_payments for select
  to authenticated
  using (
    exists (
      select 1
      from public.purchase_orders po
      where po.id = purchase_payments.order_id
        and po.user_id = auth.uid()
    )
  );

grant select on public.purchase_payments to authenticated;

create or replace function public.create_purchase_order_from_cart(cart_items jsonb)
returns jsonb as $$
declare
  caller_id uuid;
  item jsonb;
  product_row public.shop_products%rowtype;
  order_id uuid := uuid_generate_v4();
  order_total integer := 0;
  order_items_snapshot jsonb := '[]'::jsonb;
  quantity integer;
  item_total integer;
  item_points integer;
  order_item_id uuid;
  pack_number integer := 0;
  pack_id uuid;
  pack_index integer;
  sticker_index integer;
  picked_sticker integer;
  duplicate_chance numeric;
  owned_count integer;
  pool_start integer;
  pool_end integer;
  duplicate_counts jsonb := '{}'::jsonb;
  current_duplicate_count integer;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Unauthorized';
  end if;

  if jsonb_typeof(cart_items) <> 'array' or jsonb_array_length(cart_items) = 0 then
    raise exception 'Carrinho vazio.';
  end if;

  insert into public.purchase_orders (
    id,
    user_id,
    status,
    payment_status,
    fulfillment_status,
    payment_provider,
    external_reference,
    currency
  )
  values (
    order_id,
    caller_id,
    'created',
    'unpaid',
    'waiting_payment',
    'mercadopago',
    order_id::text,
    'BRL'
  );

  for item in select * from jsonb_array_elements(cart_items)
  loop
    quantity := greatest(1, least(coalesce((item->>'quantity')::integer, 1), 20));

    select *
    into product_row
    from public.shop_products
    where id = item->>'productId'
      and active = true;

    if product_row.id is null then
      raise exception 'Produto indisponivel.';
    end if;

    if product_row.product_type = 'exclusive' and quantity > 1 then
      raise exception 'Permitida somente uma unidade de cada figurinha exclusiva.';
    end if;

    if product_row.product_type = 'exclusive' and exists (
      select 1
      from public.user_stickers us
      where us.user_id = caller_id
        and us.sticker_number = product_row.sticker_number
        and us.copies > 0
    ) then
      raise exception 'Voce ja possui esta figurinha exclusiva.';
    end if;

    item_total := product_row.price_cents * quantity;
    item_points := product_row.point_price * quantity;
    order_total := order_total + item_total;

    insert into public.purchase_order_items (
      order_id,
      product_id,
      product_name,
      product_type,
      sticker_number,
      quantity,
      unit_price_cents,
      total_price_cents,
      pack_count,
      stickers_per_pack,
      unit_point_price,
      total_point_price,
      metadata
    )
    values (
      order_id,
      product_row.id,
      product_row.name,
      product_row.product_type,
      product_row.sticker_number,
      quantity,
      product_row.price_cents,
      item_total,
      product_row.pack_count,
      product_row.stickers_per_pack,
      product_row.point_price,
      item_points,
      product_row.metadata
    )
    returning id into order_item_id;

    order_items_snapshot := order_items_snapshot || jsonb_build_object(
      'product_id', product_row.id,
      'name', product_row.name,
      'type', product_row.product_type,
      'quantity', quantity,
      'unit_price_cents', product_row.price_cents,
      'total_price_cents', item_total,
      'unit_point_price', product_row.point_price,
      'total_point_price', item_points,
      'sticker_number', product_row.sticker_number
    );

    for pack_index in 1..(product_row.pack_count * quantity)
    loop
      pack_number := pack_number + 1;

      insert into public.purchase_packs (
        order_id,
        order_item_id,
        user_id,
        pack_number,
        title,
        pack_type,
        status
      )
      values (
        order_id,
        order_item_id,
        caller_id,
        pack_number,
        case
          when product_row.product_type = 'single_random' then 'Figurinha unitária'
          when product_row.product_type = 'exclusive' then product_row.name
          else 'Pacote'
        end,
        case
          when product_row.product_type = 'single_random' then 'single_random'
          when product_row.product_type = 'exclusive' then 'exclusive'
          else 'pack'
        end,
        'pending'
      )
      returning id into pack_id;

      duplicate_counts := '{}'::jsonb;
      pool_start := coalesce((product_row.metadata->>'pool_start')::integer, 194);
      pool_end := coalesce((product_row.metadata->>'pool_end')::integer, 319);

      for sticker_index in 1..greatest(product_row.stickers_per_pack, 1)
      loop
        if product_row.product_type = 'exclusive' then
          picked_sticker := product_row.sticker_number;
        else
          select count(*)
          into owned_count
          from public.user_stickers
          where user_id = caller_id
            and copies > 0;

          duplicate_chance := case when owned_count >= 180 then 0.47 else 0.40 end;

          if random() < duplicate_chance and exists (
            select 1
            from public.user_stickers us
            join public.stickers s on s.number = us.sticker_number
            where us.user_id = caller_id
              and us.copies > 0
              and s.number between pool_start and pool_end
          ) then
            select s.number
            into picked_sticker
            from public.user_stickers us
            join public.stickers s on s.number = us.sticker_number
            where us.user_id = caller_id
              and us.copies > 0
              and s.number between pool_start and pool_end
              and coalesce((duplicate_counts->>s.number::text)::integer, 0) < 2
            order by random()
            limit 1;
          end if;

          if picked_sticker is null then
            select s.number
            into picked_sticker
            from public.stickers s
            where s.number between pool_start and pool_end
              and not exists (
                select 1
                from public.user_stickers us
                where us.user_id = caller_id
                  and us.sticker_number = s.number
                  and us.copies > 0
              )
            order by random()
            limit 1;
          end if;

          if picked_sticker is null then
            select s.number
            into picked_sticker
            from public.stickers s
            where s.number between pool_start and pool_end
              and coalesce((duplicate_counts->>s.number::text)::integer, 0) < 2
            order by random()
            limit 1;
          end if;
        end if;

        if picked_sticker is null then
          raise exception 'Nao foi possivel sortear figurinha para o pacote.';
        end if;

        current_duplicate_count := coalesce((duplicate_counts->>picked_sticker::text)::integer, 0);
        duplicate_counts := jsonb_set(
          duplicate_counts,
          array[picked_sticker::text],
          to_jsonb(current_duplicate_count + 1),
          true
        );

        insert into public.purchase_pack_stickers (
          pack_id,
          order_id,
          user_id,
          sticker_number,
          position,
          is_rare,
          source
        )
        values (
          pack_id,
          order_id,
          caller_id,
          picked_sticker,
          sticker_index,
          false,
          'shop'
        );

        picked_sticker := null;
      end loop;
    end loop;
  end loop;

  update public.purchase_orders
  set total_cents = order_total,
      subtotal_cents = order_total,
      amount_due_cents = order_total,
      items_snapshot = order_items_snapshot
  where id = order_id;

  insert into public.purchase_events(order_id, user_id, event_type, message, metadata)
  values (
    order_id,
    caller_id,
    'order_created',
    'Pedido criado pelo checkout.',
    jsonb_build_object('total_cents', order_total)
  );

  return jsonb_build_object(
    'order_id', order_id,
    'total_cents', order_total,
    'amount_due_cents', order_total,
    'currency', 'BRL'
  );
exception
  when others then
    delete from public.purchase_orders where id = order_id;
    raise;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.create_purchase_order_from_cart(jsonb) from public, anon, authenticated;
grant execute on function public.create_purchase_order_from_cart(jsonb) to authenticated;

create or replace function public.approve_points_only_purchase_order(order_id_param uuid)
returns jsonb as $$
declare
  caller_id uuid := auth.uid();
  order_row public.purchase_orders%rowtype;
begin
  if caller_id is null then
    raise exception 'Unauthorized';
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

  if order_row.amount_due_cents <> 0 then
    raise exception 'Este pedido ainda possui valor em aberto.';
  end if;

  update public.purchase_orders
  set status = 'approved',
      payment_status = 'approved',
      fulfillment_status = 'pending_opening',
      payment_approved_at = coalesce(payment_approved_at, now()),
      payment_snapshot = jsonb_build_object('provider', 'points', 'points_used', points_used)
  where id = order_id_param;

  insert into public.purchase_payments (
    order_id,
    provider,
    provider_payment_id,
    status,
    transaction_amount_cents,
    currency,
    raw_payload,
    approved_at
  )
  values (
    order_id_param,
    'points',
    'points-' || order_id_param::text,
    'approved',
    0,
    'BRL',
    jsonb_build_object('points_used', order_row.points_used),
    now()
  )
  on conflict (provider, provider_payment_id) do nothing;

  insert into public.purchase_events(order_id, user_id, event_type, message, metadata)
  values (
    order_id_param,
    caller_id,
    'order_approved_points',
    'Pedido aprovado com pontos.',
    jsonb_build_object('points_used', order_row.points_used)
  );

  return jsonb_build_object('order_id', order_id_param, 'approved', true);
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.approve_points_only_purchase_order(uuid) from public, anon, authenticated;
grant execute on function public.approve_points_only_purchase_order(uuid) to authenticated;

create or replace function public.process_mercado_pago_payment(payment_payload jsonb)
returns jsonb as $$
declare
  order_row public.purchase_orders%rowtype;
  order_id_param uuid;
  provider_payment_id text;
  payment_status_value text;
  payment_status_detail text;
  payment_amount_cents integer;
  payment_currency text;
  payment_external_reference text;
  mp_approved_at timestamptz;
begin
  provider_payment_id := payment_payload->>'id';
  payment_status_value := payment_payload->>'status';
  payment_status_detail := payment_payload->>'status_detail';
  payment_currency := coalesce(payment_payload->>'currency_id', 'BRL');
  payment_external_reference := payment_payload->>'external_reference';
  payment_amount_cents := round(coalesce((payment_payload->>'transaction_amount')::numeric, 0) * 100);
  mp_approved_at := nullif(payment_payload->>'date_approved', '')::timestamptz;

  if payment_external_reference is null then
    raise exception 'Pagamento sem external_reference.';
  end if;

  order_id_param := payment_external_reference::uuid;

  select *
  into order_row
  from public.purchase_orders
  where id = order_id_param
  for update;

  if order_row.id is null then
    raise exception 'Pedido nao encontrado.';
  end if;

  insert into public.purchase_payments (
    order_id,
    provider,
    provider_payment_id,
    provider_preference_id,
    provider_merchant_order_id,
    status,
    status_detail,
    payment_method_id,
    payment_type_id,
    transaction_amount_cents,
    net_received_amount_cents,
    currency,
    payer_email,
    payer_id,
    raw_payload,
    approved_at
  )
  values (
    order_row.id,
    'mercadopago',
    provider_payment_id,
    payment_payload->>'preference_id',
    payment_payload->>'merchant_order_id',
    payment_status_value,
    payment_status_detail,
    payment_payload->>'payment_method_id',
    payment_payload->>'payment_type_id',
    payment_amount_cents,
    round(coalesce((payment_payload#>>'{transaction_details,net_received_amount}')::numeric, 0) * 100),
    payment_currency,
    payment_payload#>>'{payer,email}',
    payment_payload#>>'{payer,id}',
    payment_payload,
    mp_approved_at
  )
  on conflict (provider, provider_payment_id) do update set
    status = excluded.status,
    status_detail = excluded.status_detail,
    payment_method_id = excluded.payment_method_id,
    payment_type_id = excluded.payment_type_id,
    transaction_amount_cents = excluded.transaction_amount_cents,
    net_received_amount_cents = excluded.net_received_amount_cents,
    currency = excluded.currency,
    payer_email = excluded.payer_email,
    payer_id = excluded.payer_id,
    raw_payload = excluded.raw_payload,
    approved_at = excluded.approved_at,
    updated_at = now();

  if payment_status_value = 'approved' then
    if payment_currency <> order_row.currency then
      raise exception 'Moeda do pagamento nao confere.';
    end if;

    if payment_amount_cents <> order_row.amount_due_cents then
      raise exception 'Valor do pagamento nao confere.';
    end if;

    if order_row.payment_status <> 'approved' then
      update public.purchase_orders
      set status = 'approved',
          payment_status = 'approved',
          fulfillment_status = 'pending_opening',
          payment_approved_at = coalesce(public.purchase_orders.payment_approved_at, mp_approved_at, now()),
          payment_snapshot = payment_payload
      where id = order_row.id;

      insert into public.purchase_events(order_id, user_id, event_type, message, metadata)
      values (
        order_row.id,
        order_row.user_id,
        'payment_approved',
        'Pagamento Mercado Pago aprovado.',
        jsonb_build_object('provider_payment_id', provider_payment_id)
      );
    end if;
  elsif payment_status_value in ('rejected', 'cancelled') then
    update public.purchase_orders
    set status = 'cancelled',
        payment_status = case when payment_status_value = 'cancelled' then 'cancelled' else 'rejected' end,
        fulfillment_status = 'cancelled',
        cancelled_at = coalesce(cancelled_at, now()),
        payment_snapshot = payment_payload
    where id = order_row.id
      and payment_status <> 'approved';

    perform public.refund_purchase_order_points(order_row.id);
  else
    update public.purchase_orders
    set status = 'pending_payment',
        payment_status = 'pending',
        payment_pending_at = coalesce(payment_pending_at, now()),
        payment_snapshot = payment_payload
    where id = order_row.id
      and payment_status <> 'approved';
  end if;

  return jsonb_build_object(
    'order_id', order_row.id,
    'payment_status', payment_status_value,
    'processed', true
  );
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.process_mercado_pago_payment(jsonb) from public, anon, authenticated;
grant execute on function public.process_mercado_pago_payment(jsonb) to service_role;
