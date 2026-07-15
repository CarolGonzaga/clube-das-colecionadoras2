create extension if not exists "uuid-ossp";

create table if not exists public.album_versions (
  id integer primary key,
  slug text not null unique,
  name text not null,
  sticker_count integer not null,
  status text not null check (status in ('draft', 'active', 'archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

insert into public.album_versions (id, slug, name, sticker_count, status)
values
  (1, 'v1', 'Clube das Colecionadoras V1', 100, 'archived'),
  (2, 'v2', 'Clube das Colecionadoras 2.0', 300, 'active')
on conflict (id) do nothing;

create table if not exists public.terms_versions (
  id uuid primary key default uuid_generate_v4(),
  album_version_id integer references public.album_versions(id) not null,
  title text not null,
  url text not null,
  version_label text not null,
  active boolean not null default false,
  published_at timestamptz not null default now()
);

create table if not exists public.terms_acceptances (
  user_id uuid references auth.users(id) on delete cascade,
  terms_version_id uuid references public.terms_versions(id),
  accepted_at timestamptz not null default now(),
  primary key (user_id, terms_version_id)
);

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text not null unique,
  username_normalized text not null unique,
  display_name text not null,
  avatar_url text,
  last_active_album_version integer references public.album_versions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_album_access (
  user_id uuid references auth.users(id) on delete cascade,
  album_version_id integer references public.album_versions(id),
  access_type text not null check (access_type in ('free', 'paid', 'complete', 'admin')),
  status text not null check (status in ('active', 'inactive', 'refunded')),
  source text,
  granted_at timestamptz not null default now(),
  primary key (user_id, album_version_id)
);

create table if not exists public.pending_paid_signups (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  email_normalized text not null,
  album_version_id integer references public.album_versions(id) not null default 2,
  payment_provider text not null default 'mercadopago',
  provider_payment_id text unique,
  status text not null check (status in ('pending', 'approved', 'linked', 'refunded', 'cancelled')),
  amount_cents integer,
  currency text not null default 'BRL',
  linked_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  linked_at timestamptz
);

create table if not exists public.payment_webhook_events (
  id uuid primary key default uuid_generate_v4(),
  provider text not null,
  provider_event_id text not null,
  event_type text,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table if not exists public.v2_stickers (
  number integer primary key check (number between 1 and 300),
  slug text not null unique,
  name text not null,
  author text,
  collection_group text,
  is_rare boolean not null default false,
  is_v1_legacy boolean not null default false,
  cover_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.v2_user_stickers (
  user_id uuid references auth.users(id) on delete cascade,
  sticker_number integer references public.v2_stickers(number),
  owned boolean not null default false,
  duplicate_copies integer not null default 0 check (duplicate_copies >= 0),
  acquired_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, sticker_number)
);

create table if not exists public.v2_migration_claims (
  user_id uuid references auth.users(id) on delete cascade primary key,
  source_unique_count integer not null default 0,
  source_duplicate_count integer not null default 0,
  credits_granted integer not null default 0,
  claimed_at timestamptz not null default now()
);

create table if not exists public.v2_credit_ledger (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount integer not null,
  reason text not null,
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.v2_sticker_packs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  source text not null check (source in ('purchase', 'credit', 'migration_bonus', 'admin')),
  status text not null check (status in ('ready_to_open', 'opened')) default 'ready_to_open',
  purchase_id uuid references public.pending_paid_signups(id),
  created_at timestamptz not null default now(),
  opened_at timestamptz
);

create table if not exists public.v2_sticker_pack_items (
  id uuid primary key default uuid_generate_v4(),
  pack_id uuid references public.v2_sticker_packs(id) on delete cascade not null,
  sticker_number integer references public.v2_stickers(number) not null,
  position integer not null check (position between 1 and 20),
  was_new boolean not null,
  is_rare boolean not null,
  created_at timestamptz not null default now(),
  unique (pack_id, position)
);

create table if not exists public.v2_trade_offers (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid references auth.users(id) on delete cascade not null,
  offered_sticker_number integer references public.v2_stickers(number) not null,
  requested_sticker_number integer references public.v2_stickers(number) not null,
  status text not null check (status in ('open', 'accepted', 'cancelled', 'expired')) default 'open',
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days')
);

create table if not exists public.v2_trade_events (
  id uuid primary key default uuid_generate_v4(),
  trade_offer_id uuid references public.v2_trade_offers(id) on delete cascade not null,
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.deleted_account_requests (
  user_id uuid references auth.users(id) on delete cascade primary key,
  status text not null check (status in ('requested', 'cancelled', 'completed')),
  requested_at timestamptz not null default now(),
  scheduled_delete_at timestamptz not null default (now() + interval '7 days'),
  completed_at timestamptz
);

alter table public.album_versions enable row level security;
alter table public.terms_versions enable row level security;
alter table public.terms_acceptances enable row level security;
alter table public.profiles enable row level security;
alter table public.user_album_access enable row level security;
alter table public.pending_paid_signups enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.v2_stickers enable row level security;
alter table public.v2_user_stickers enable row level security;
alter table public.v2_migration_claims enable row level security;
alter table public.v2_credit_ledger enable row level security;
alter table public.v2_sticker_packs enable row level security;
alter table public.v2_sticker_pack_items enable row level security;
alter table public.v2_trade_offers enable row level security;
alter table public.v2_trade_events enable row level security;
alter table public.deleted_account_requests enable row level security;

create policy "Read album versions" on public.album_versions for select using (true);
create policy "Read active terms" on public.terms_versions for select using (active = true);
create policy "Read stickers" on public.v2_stickers for select using (active = true);

create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users read own access" on public.user_album_access for select using (auth.uid() = user_id);
create policy "Users read own terms" on public.terms_acceptances for select using (auth.uid() = user_id);
create policy "Users insert own terms" on public.terms_acceptances for insert with check (auth.uid() = user_id);

create policy "Users read own stickers" on public.v2_user_stickers for select using (auth.uid() = user_id);
create policy "Users read own migration claim" on public.v2_migration_claims for select using (auth.uid() = user_id);
create policy "Users read own credit ledger" on public.v2_credit_ledger for select using (auth.uid() = user_id);
create policy "Users read own packs" on public.v2_sticker_packs for select using (auth.uid() = user_id);
create policy "Users read own pack items" on public.v2_sticker_pack_items
for select using (
  exists (
    select 1 from public.v2_sticker_packs p
    where p.id = pack_id and p.user_id = auth.uid()
  )
);

create policy "Users read own trade offers" on public.v2_trade_offers
for select using (auth.uid() = from_user_id or auth.uid() = accepted_by or status = 'open');

create policy "Users read own delete request" on public.deleted_account_requests
for select using (auth.uid() = user_id);

create or replace function public.can_access_album(target_album_version_id integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_album_access access
    where access.user_id = auth.uid()
      and access.album_version_id = target_album_version_id
      and access.status = 'active'
  );
$$;

revoke all on function public.can_access_album(integer) from public, anon;
grant execute on function public.can_access_album(integer) to authenticated;

create or replace function public.mark_v2_pack_opened(pack_id_param uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.v2_sticker_packs
  set status = 'opened',
      opened_at = coalesce(opened_at, now())
  where id = pack_id_param
    and user_id = auth.uid();
end;
$$;

revoke all on function public.mark_v2_pack_opened(uuid) from public, anon;
grant execute on function public.mark_v2_pack_opened(uuid) to authenticated;
