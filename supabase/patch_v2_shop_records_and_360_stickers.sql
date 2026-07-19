-- V2 simulation/commerce structure.
-- Run after bootstrap_empty_v2_project.sql and patch_quiz_v1_flow.sql.

alter table public.stickers
  add column if not exists category text;

update public.stickers
set category = case
  when number between 1 and 20 then 'quiz'
  when number between 320 and 360 then 'exclusiva'
  else 'comum'
end
where category is null;

insert into public.stickers (number, slug, name, author, type, cover_url, category)
select
  n,
  'sticker-' || n::text,
  case
    when n between 101 and 319 then 'Figurinha comum ' || n::text
    when n between 320 and 360 then 'Figurinha exclusiva ' || n::text
  end,
  'Autoria a definir',
  case when n between 320 and 360 then 'exclusiva' else 'sorteio' end,
  null,
  case when n between 320 and 360 then 'exclusiva' else 'comum' end
from generate_series(101, 360) as n
on conflict (number) do update
set category = excluded.category,
    name = case
      when public.stickers.name is null or public.stickers.name like 'Figurinha comum %' or public.stickers.name like 'Figurinha exclusiva %'
      then excluded.name
      else public.stickers.name
    end,
    author = coalesce(public.stickers.author, excluded.author);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'simulation',
  provider_reference text,
  status text not null default 'approved',
  total_cents integer not null default 0,
  currency text not null default 'BRL',
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  quantity integer not null default 1,
  unit_price_cents integer not null default 0,
  product_type text not null
);

create table if not exists public.purchase_packs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.purchase_orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  opened_at timestamptz
);

create table if not exists public.purchase_pack_items (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.purchase_packs(id) on delete cascade,
  sticker_number integer not null references public.stickers(number) on delete restrict,
  is_rare boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.purchase_packs enable row level security;
alter table public.purchase_pack_items enable row level security;

drop policy if exists "purchase_orders_own_select" on public.purchase_orders;
create policy "purchase_orders_own_select" on public.purchase_orders
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "purchase_packs_own_select" on public.purchase_packs;
create policy "purchase_packs_own_select" on public.purchase_packs
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "purchase_order_items_own_select" on public.purchase_order_items;
create policy "purchase_order_items_own_select" on public.purchase_order_items
  for select to authenticated using (
    exists (
      select 1 from public.purchase_orders po
      where po.id = order_id and po.user_id = auth.uid()
    )
  );

drop policy if exists "purchase_pack_items_own_select" on public.purchase_pack_items;
create policy "purchase_pack_items_own_select" on public.purchase_pack_items
  for select to authenticated using (
    exists (
      select 1 from public.purchase_packs pp
      where pp.id = pack_id and pp.user_id = auth.uid()
    )
  );

grant select on public.purchase_orders to authenticated;
grant select on public.purchase_order_items to authenticated;
grant select on public.purchase_packs to authenticated;
grant select on public.purchase_pack_items to authenticated;

grant all on public.purchase_orders to service_role;
grant all on public.purchase_order_items to service_role;
grant all on public.purchase_packs to service_role;
grant all on public.purchase_pack_items to service_role;
