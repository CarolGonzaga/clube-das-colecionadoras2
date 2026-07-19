-- Align older V2 shop simulation tables with the Mercado Pago checkout schema.
-- This is safe to run after the initial simulation patch because all changes are
-- additive and preserve existing orders/packs.

alter table public.purchase_orders
  add column if not exists order_code text,
  add column if not exists payment_provider text not null default 'mercadopago',
  add column if not exists external_reference text,
  add column if not exists checkout_url text,
  add column if not exists init_point text,
  add column if not exists sandbox_init_point text,
  add column if not exists items_snapshot jsonb not null default '[]'::jsonb,
  add column if not exists payment_snapshot jsonb,
  add column if not exists payment_pending_at timestamptz,
  add column if not exists payment_approved_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists subtotal_cents integer not null default 0,
  add column if not exists points_used integer not null default 0,
  add column if not exists points_discount_cents integer not null default 0,
  add column if not exists amount_due_cents integer not null default 0,
  add column if not exists points_applied_at timestamptz,
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists fulfillment_status text not null default 'waiting_payment',
  add column if not exists mercado_pago_preference_id text;

update public.purchase_orders
set payment_provider = coalesce(payment_provider, provider, 'mercadopago')
where payment_provider is null;

update public.purchase_orders
set external_reference = id::text
where external_reference is null;

update public.purchase_orders
set order_code = 'CDC-' || upper(substr(replace(id::text, '-', ''), 1, 10))
where order_code is null;

alter table public.purchase_orders
  alter column external_reference set default uuid_generate_v4()::text,
  alter column order_code set default ('CDC-' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 10)));

create unique index if not exists purchase_orders_order_code_key
  on public.purchase_orders(order_code);

create unique index if not exists purchase_orders_external_reference_key
  on public.purchase_orders(external_reference);

create index if not exists purchase_orders_user_created_idx
  on public.purchase_orders(user_id, created_at desc);

create index if not exists purchase_orders_status_idx
  on public.purchase_orders(status);

create index if not exists purchase_orders_payment_status_idx
  on public.purchase_orders(payment_status, created_at desc);

alter table public.purchase_order_items
  add column if not exists sticker_number integer references public.stickers(number) on delete restrict,
  add column if not exists total_price_cents integer not null default 0,
  add column if not exists pack_count integer not null default 0,
  add column if not exists stickers_per_pack integer not null default 0,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists unit_point_price integer not null default 0,
  add column if not exists total_point_price integer not null default 0;

create index if not exists purchase_order_items_order_idx
  on public.purchase_order_items(order_id);

alter table public.purchase_packs
  add column if not exists order_item_id uuid references public.purchase_order_items(id) on delete set null,
  add column if not exists pack_number integer,
  add column if not exists pack_type text not null default 'pack',
  add column if not exists generated_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists purchase_packs_user_status_idx
  on public.purchase_packs(user_id, status, created_at desc);

create table if not exists public.purchase_payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.purchase_orders(id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_payment_id text,
  provider_preference_id text,
  provider_merchant_order_id text,
  status text not null default 'created',
  status_detail text,
  payment_method_id text,
  payment_type_id text,
  transaction_amount_cents integer,
  net_received_amount_cents integer,
  currency text not null default 'BRL',
  payer_email text,
  payer_id text,
  webhook_event_id text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(provider, provider_payment_id),
  unique(provider, webhook_event_id)
);

create index if not exists purchase_payments_order_idx
  on public.purchase_payments(order_id, created_at desc);

create table if not exists public.purchase_pack_stickers (
  id uuid primary key default uuid_generate_v4(),
  pack_id uuid not null references public.purchase_packs(id) on delete cascade,
  order_id uuid not null references public.purchase_orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  sticker_number integer not null references public.stickers(number) on delete restrict,
  position integer not null check (position > 0),
  was_new_at_generation boolean,
  was_repeat_at_generation boolean,
  is_rare boolean not null default false,
  source text not null default 'shop',
  applied_to_inventory_at timestamptz,
  created_at timestamptz not null default now(),
  unique(pack_id, position)
);

create index if not exists purchase_pack_stickers_pack_idx
  on public.purchase_pack_stickers(pack_id, position);

create index if not exists purchase_pack_stickers_user_created_idx
  on public.purchase_pack_stickers(user_id, created_at desc);

create table if not exists public.purchase_events (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.purchase_orders(id) on delete cascade,
  payment_id uuid references public.purchase_payments(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists purchase_events_order_created_idx
  on public.purchase_events(order_id, created_at desc);

alter table public.purchase_payments enable row level security;
alter table public.purchase_pack_stickers enable row level security;
alter table public.purchase_events enable row level security;

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

drop policy if exists "purchase_pack_stickers_read_own" on public.purchase_pack_stickers;
create policy "purchase_pack_stickers_read_own"
  on public.purchase_pack_stickers for select
  to authenticated
  using (auth.uid() = user_id);

grant select on public.purchase_payments to authenticated;
grant select on public.purchase_pack_stickers to authenticated;
grant select on public.purchase_events to authenticated;

grant all on public.purchase_orders to service_role;
grant all on public.purchase_order_items to service_role;
grant all on public.purchase_packs to service_role;
grant all on public.purchase_payments to service_role;
grant all on public.purchase_pack_stickers to service_role;
grant all on public.purchase_events to service_role;
