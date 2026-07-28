-- Keep checkout transactions short by postponing random sticker generation
-- until each paid pack is opened.
--
-- Existing orders are compatible:
--   * packs that already contain stickers are returned unchanged;
--   * new orders create only the order, item and pack ledgers at checkout;
--   * a pack is populated exactly once, under a row lock, when it is opened.

create or replace function public.create_purchase_order_from_cart(cart_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
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
  pack_index integer;
begin
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

    -- Pack rows are cheap and let the paid order become visible immediately.
    -- Sticker selection is intentionally deferred to open_purchased_pack().
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
          when product_row.product_type = 'single_random' then 'Figurinha unitaria'
          when product_row.product_type = 'exclusive' then product_row.name
          else 'Pacote'
        end,
        case
          when product_row.product_type = 'single_random' then 'single_random'
          when product_row.product_type = 'exclusive' then 'exclusive'
          else 'pack'
        end,
        'pending'
      );
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
    jsonb_build_object(
      'total_cents', order_total,
      'sticker_generation', 'deferred_until_pack_open'
    )
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
$$;

revoke all on function public.create_purchase_order_from_cart(jsonb)
  from public, anon, authenticated;
grant execute on function public.create_purchase_order_from_cart(jsonb)
  to authenticated;

create or replace function public.generate_purchase_pack_stickers(pack_id_param uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  pack_row public.purchase_packs%rowtype;
  item_row public.purchase_order_items%rowtype;
  expected_count integer;
  existing_count integer;
  sticker_index integer;
  seed_sticker integer;
begin
  select *
  into pack_row
  from public.purchase_packs
  where id = pack_id_param
  for update;

  if pack_row.id is null then
    raise exception 'Pacote nao encontrado.';
  end if;

  select *
  into item_row
  from public.purchase_order_items
  where id = pack_row.order_item_id;

  if item_row.id is null then
    raise exception 'Item do pacote nao encontrado.';
  end if;

  expected_count := greatest(item_row.stickers_per_pack, 1);

  select count(*)
  into existing_count
  from public.purchase_pack_stickers
  where pack_id = pack_row.id;

  if existing_count = expected_count then
    return existing_count;
  end if;

  if existing_count <> 0 then
    raise exception
      'Pacote inconsistente: esperadas % figurinhas, encontradas %.',
      expected_count,
      existing_count;
  end if;

  if item_row.product_type = 'exclusive' then
    seed_sticker := item_row.sticker_number;
  else
    seed_sticker := coalesce((item_row.metadata->>'pool_start')::integer, 194);
  end if;

  if seed_sticker is null or not exists (
    select 1 from public.stickers where number = seed_sticker
  ) then
    raise exception 'Configuracao de figurinhas invalida para este produto.';
  end if;

  for sticker_index in 1..expected_count
  loop
    -- choose_shop_sticker_before_insert() replaces the seed for random packs
    -- and preserves fixed sticker numbers for exclusive products.
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
      pack_row.id,
      pack_row.order_id,
      pack_row.user_id,
      seed_sticker,
      sticker_index,
      false,
      'shop'
    );
  end loop;

  return expected_count;
end;
$$;

revoke all on function public.generate_purchase_pack_stickers(uuid)
  from public, anon, authenticated;

create or replace function public.open_purchased_pack(pack_id_param uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pack_row public.purchase_packs%rowtype;
  sticker_row record;
  reveals jsonb := '[]'::jsonb;
  was_new boolean;
  should_be_rare boolean;
  has_rare_already boolean;
  rolled_rare boolean;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  select *
  into pack_row
  from public.purchase_packs
  where id = pack_id_param
    and user_id = auth.uid()
  for update;

  if pack_row.id is null then
    raise exception 'Pacote nao encontrado.';
  end if;

  if pack_row.status = 'opened' then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'slug', s.slug,
          'number', pps.sticker_number,
          'name', s.name,
          'author', s.author,
          'wasNew', pps.was_new_at_generation,
          'isRare', pps.is_rare,
          'repeat', pps.was_repeat_at_generation,
          'reward', null
        )
        order by pps.position
      ),
      '[]'::jsonb
    )
    into reveals
    from public.purchase_pack_stickers pps
    join public.stickers s on s.number = pps.sticker_number
    where pps.pack_id = pack_id_param;

    return reveals;
  end if;

  if pack_row.status <> 'pending' then
    raise exception 'Este pacote nao esta disponivel para abertura.';
  end if;

  if not exists (
    select 1
    from public.purchase_orders po
    where po.id = pack_row.order_id
      and po.user_id = auth.uid()
      and po.status in ('approved', 'partially_opened', 'completed')
      and po.payment_status = 'approved'
      and po.fulfillment_status in ('pending_opening', 'partially_opened', 'released')
  ) then
    raise exception 'Pagamento ainda nao aprovado para este pacote.';
  end if;

  -- New orders reach this point without sticker rows. Old orders already have
  -- all rows and are returned unchanged by the idempotent generator.
  perform public.generate_purchase_pack_stickers(pack_id_param);

  update public.purchase_packs
  set status = 'opening'
  where id = pack_id_param;

  for sticker_row in
    select pps.id, pps.sticker_number, pps.position, s.slug, s.name, s.author
    from public.purchase_pack_stickers pps
    join public.stickers s on s.number = pps.sticker_number
    where pps.pack_id = pack_id_param
    order by pps.position
    for update of pps
  loop
    select not exists (
      select 1
      from public.user_stickers us
      where us.user_id = auth.uid()
        and us.sticker_number = sticker_row.sticker_number
        and us.copies > 0
    ) into was_new;

    should_be_rare := false;
    if sticker_row.sticker_number in (258, 298, 194, 292) then
      rolled_rare := random() < 0.40;
      if rolled_rare then
        select coalesce(is_rare, false)
        into has_rare_already
        from public.user_stickers
        where user_id = auth.uid()
          and sticker_number = sticker_row.sticker_number;

        if not coalesce(has_rare_already, false) then
          should_be_rare := true;
        end if;
      end if;
    end if;

    if should_be_rare then
      insert into public.user_stickers (
        user_id, sticker_number, copies, is_rare, first_unlocked_at
      )
      values (auth.uid(), sticker_row.sticker_number, 1, true, now())
      on conflict (user_id, sticker_number) do update set
        copies = public.user_stickers.copies + 1,
        is_rare = true;
    else
      insert into public.user_stickers (
        user_id, sticker_number, copies, is_rare, first_unlocked_at
      )
      values (auth.uid(), sticker_row.sticker_number, 1, false, now())
      on conflict (user_id, sticker_number) do update set
        copies = public.user_stickers.copies + 1;
    end if;

    update public.purchase_pack_stickers
    set applied_to_inventory_at = coalesce(applied_to_inventory_at, now()),
        was_new_at_generation = coalesce(was_new_at_generation, was_new),
        was_repeat_at_generation = coalesce(was_repeat_at_generation, not was_new),
        is_rare = should_be_rare
    where id = sticker_row.id;

    reveals := reveals || jsonb_build_object(
      'slug', sticker_row.slug,
      'number', sticker_row.sticker_number,
      'name', sticker_row.name,
      'author', sticker_row.author,
      'wasNew', was_new,
      'isRare', should_be_rare,
      'repeat', not was_new,
      'reward', null
    );
  end loop;

  if jsonb_array_length(reveals) = 0 then
    raise exception 'O pacote nao possui figurinhas para abertura.';
  end if;

  update public.purchase_packs
  set status = 'opened',
      opened_at = now()
  where id = pack_id_param;

  if exists (
    select 1
    from public.purchase_packs
    where order_id = pack_row.order_id
      and status = 'pending'
  ) then
    update public.purchase_orders
    set status = 'partially_opened',
        fulfillment_status = 'partially_opened'
    where id = pack_row.order_id;
  else
    update public.purchase_orders
    set status = 'completed',
        fulfillment_status = 'released',
        completed_at = coalesce(completed_at, now())
    where id = pack_row.order_id;
  end if;

  insert into public.purchase_events(order_id, user_id, event_type, message, metadata)
  values (
    pack_row.order_id,
    auth.uid(),
    'pack_opened',
    'Pacote aberto e figurinhas aplicadas ao inventario.',
    jsonb_build_object(
      'pack_id', pack_id_param,
      'sticker_generation', 'on_demand'
    )
  );

  return reveals;
end;
$$;

revoke all on function public.open_purchased_pack(uuid)
  from public, anon;
grant execute on function public.open_purchased_pack(uuid)
  to authenticated;

notify pgrst, 'reload schema';
