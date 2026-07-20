-- Migração para configurar as novas figurinhas raras, regras de substituição de raras e gerar os códigos de resgate.

-- 0. Garantir tabelas de redeem_codes
create table if not exists public.redeem_codes (
  code text primary key,
  element text,
  active boolean default true,
  release_day integer not null default 1
);

create table if not exists public.redeem_pools (
  code text references public.redeem_codes on delete cascade,
  sticker_number integer not null,
  primary key (code, sticker_number)
);

alter table public.redeem_codes enable row level security;
alter table public.redeem_pools enable row level security;
-- 1. Atualizar o trigger para não limitar cópias de figurinhas da Loja/Sorteio raras a 1 (apenas Quiz 1-20 e Exclusivas 320-360)
create or replace function public.enforce_no_duplicate_rare_or_exclusive()
returns trigger as $$
begin
  if NEW.sticker_number between 1 and 20 
     or NEW.sticker_number between 320 and 360 then
    if NEW.copies > 1 then
      NEW.copies := 1;
    END if;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- 2. Atualizar a função de abertura de pacotes da loja para aplicar 40% de chance para raras da loja (258, 298, 194, 292)
create or replace function public.open_purchased_pack(pack_id_param uuid)
returns jsonb as $$
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
  ) then
    raise exception 'Pagamento ainda nao aprovado para este pacote.';
  end if;

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
    -- Verificar se já tem a figurinha para calcular was_new
    select not exists (
      select 1
      from public.user_stickers us
      where us.user_id = auth.uid()
        and us.sticker_number = sticker_row.sticker_number
        and us.copies > 0
    ) into was_new;

    -- Verificar se a figurinha é uma das raras da Loja (258, 298, 194, 292) e rodar a chance de 40%
    should_be_rare := false;
    if sticker_row.sticker_number in (258, 298, 194, 292) then
      rolled_rare := (random() < 0.40);
      if rolled_rare then
        select coalesce(is_rare, false) into has_rare_already
        from public.user_stickers
        where user_id = auth.uid() and sticker_number = sticker_row.sticker_number;
        
        if not coalesce(has_rare_already, false) then
          should_be_rare := true;
        end if;
      end if;
    end if;

    -- Inserir ou atualizar inventário
    if should_be_rare then
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (auth.uid(), sticker_row.sticker_number, 1, true, now())
      on conflict (user_id, sticker_number) do update set
        copies = public.user_stickers.copies + 1,
        is_rare = true;
    else
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
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

  update public.purchase_packs
  set status = 'opened',
      opened_at = now()
  where id = pack_id_param;

  if exists (
    select 1 from public.purchase_packs
    where order_id = pack_row.order_id
      and status = 'pending'
  ) then
    update public.purchase_orders
    set status = 'partially_opened'
    where id = pack_row.order_id;
  else
    update public.purchase_orders
    set status = 'completed',
        completed_at = coalesce(completed_at, now())
    where id = pack_row.order_id;
  end if;

  insert into public.purchase_events(order_id, user_id, event_type, message, metadata)
  values (
    pack_row.order_id,
    auth.uid(),
    'pack_opened',
    'Pacote aberto e figurinhas aplicadas ao inventario.',
    jsonb_build_object('pack_id', pack_id_param)
  );

  return reveals;
end;
$$ language plpgsql security definer set search_path = public;

-- 3. Atualizar a função redeem_code para aplicar as novas regras das raras de Sorteio (45, 47, 79, 112, 164, 167)
create or replace function public.redeem_code(code_param text)
returns jsonb as $$
declare
  user_id_param uuid;
  code_clean text;
  code_row record;
  pool_numbers integer[];
  available_pool integer[];
  package_numbers integer[] := '{}'::integer[];
  reveals jsonb := '[]'::jsonb;
  draw_idx integer;
  target_number integer;
  target_slug text;
  was_new boolean;
  styles_unlocked jsonb := '[]'::jsonb;
  progression_reveals jsonb;
  release_date_str text;
  release_date_val timestamptz;
  days_elapsed integer;
  should_be_rare boolean;
  rolled_rare boolean;
  has_rare_already boolean;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  code_clean := upper(trim(code_param));

  -- Verify code validity
  select * into code_row from public.redeem_codes where code = code_clean and active = true;
  if not found then
    raise exception 'Código inválido.';
  end if;

  -- Verify release schedule based on app launch settings
  select value into release_date_str from public.app_settings where key = 'release_date';
  if release_date_str is null then
    release_date_val := '2026-07-02 00:00:00+00'::timestamptz;
  else
    release_date_val := (release_date_str || ' 00:00:00+00')::timestamptz;
  end if;

  days_elapsed := floor(extract(epoch from (now() - release_date_val)) / 86400)::integer + 1;
  if days_elapsed < code_row.release_day then
    raise exception 'Este código promocional ainda não está ativo! Será liberado no dia % do lançamento.', code_row.release_day;
  end if;

  -- Ensure user hasn't redeemed this code before
  if exists (
    select 1 from public.reward_grants
    where user_id = user_id_param and reward_key = 'code_' || code_clean
  ) then
    raise exception 'Você já usou esse código.';
  end if;

  -- Get code sticker pool
  select array_agg(sticker_number) into pool_numbers
  from public.redeem_pools
  where code = code_clean;

  if pool_numbers is null or array_length(pool_numbers, 1) = 0 then
    raise exception 'Pool do código vazia.';
  end if;

  -- Mark code as redeemed for this user
  insert into public.reward_grants (user_id, reward_key) values (user_id_param, 'code_' || code_clean);

  -- Perform 5 random sticker draws
  for draw_idx in 1 .. 5 loop
    available_pool := public.pack_available_pool(pool_numbers, package_numbers);
    target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
    package_numbers := array_append(package_numbers, target_number);

    -- Get sticker details (slug)
    select s.slug into target_slug
    from public.stickers s
    where s.number = target_number;

    if target_slug is null then
      target_slug := 'frase-' || target_number;
    end if;

    -- Verificar se já tem a figurinha para calcular was_new
    select not exists (
      select 1
      from public.user_stickers us
      where us.user_id = user_id_param
        and us.sticker_number = target_number
        and us.copies > 0
    ) into was_new;

    -- Verificar se a figurinha sorteada é uma das raras de Sorteio (167, 47, 112, 45, 79, 164) e rodar a chance de 30%
    should_be_rare := false;
    if target_number in (167, 47, 112, 45, 79, 164) then
      rolled_rare := (random() < 0.30);
      if rolled_rare then
        select coalesce(is_rare, false) into has_rare_already
        from public.user_stickers
        where user_id = user_id_param and sticker_number = target_number;
        
        if not coalesce(has_rare_already, false) then
          should_be_rare := true;
        end if;
      end if;
    end if;

    -- Inserir ou atualizar inventário
    if should_be_rare then
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, target_number, 1, true, now())
      on conflict (user_id, sticker_number) do update set
        copies = public.user_stickers.copies + 1,
        is_rare = true;
    else
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, target_number, 1, false, now())
      on conflict (user_id, sticker_number) do update set
        copies = public.user_stickers.copies + 1;
    end if;

    reveals := reveals || jsonb_build_object(
      'slug', target_slug,
      'number', target_number,
      'wasNew', was_new,
      'isRare', should_be_rare,
      'repeat', not was_new,
      'reward', null
    );
  end loop;

  -- Unlock cosmetic layout style if attached to promo code
  if code_row.element is not null then
    update public.user_styles
    set unlocked = true
    where user_id = user_id_param and style_id = code_row.element;
  end if;

  return reveals;
end;
$$ language plpgsql security definer;

-- 4. Gerar os 20 códigos normais (CLUB-...) e o especial
-- Códigos normais
update public.redeem_codes set active = false;

insert into public.redeem_codes (code, element, active, release_day)
values 
  ('K9P2X5Y1', null, true, 1),
  ('M8N5Q1R7', null, true, 1),
  ('D6E9F2G8', null, true, 1),
  ('J1K4L7M3', null, true, 1),
  ('P3Q6R9S5', null, true, 1),
  ('B2V8C5X1', null, true, 1),
  ('F9H4J7K2', null, true, 1),
  ('W3E6R9T1', null, true, 1),
  ('Y5U8I1O4', null, true, 1),
  ('Z2X5C8V1', null, true, 1),
  ('N7M3L9K2', null, true, 1),
  ('G8F4D2S6', null, true, 1),
  ('H1J4K7L3', null, true, 1),
  ('Q9W5E1R8', null, true, 1),
  ('T2Y5U8I1', null, true, 1),
  ('A6S3D9F2', null, true, 1),
  ('P8O4I2U7', null, true, 1),
  ('V2B5N8M1', null, true, 1),
  ('C9X5Z1A7', null, true, 1),
  ('K3L7J9H2', null, true, 1)
on conflict (code) do update set active = true;

-- Associar figurinhas de 21 a 193 ao pool de cada código normal
insert into public.redeem_pools (code, sticker_number)
select c, s
from unnest(array[
  'K9P2X5Y1', 'M8N5Q1R7', 'D6E9F2G8', 'J1K4L7M3', 'P3Q6R9S5',
  'B2V8C5X1', 'F9H4J7K2', 'W3E6R9T1', 'Y5U8I1O4', 'Z2X5C8V1',
  'N7M3L9K2', 'G8F4D2S6', 'H1J4K7L3', 'Q9W5E1R8', 'T2Y5U8I1',
  'A6S3D9F2', 'P8O4I2U7', 'V2B5N8M1', 'C9X5Z1A7', 'K3L7J9H2'
]) c, generate_series(21, 193) s
on conflict (code, sticker_number) do nothing;

-- Código especial
insert into public.redeem_codes (code, element, active, release_day)
values ('X8Y2Z5W1', null, true, 1)
on conflict (code) do update set active = true;

-- Associar figurinhas de 101 a 193 ao pool do código especial
insert into public.redeem_pools (code, sticker_number)
select 'X8Y2Z5W1', generate_series(101, 193)
on conflict (code, sticker_number) do nothing;
