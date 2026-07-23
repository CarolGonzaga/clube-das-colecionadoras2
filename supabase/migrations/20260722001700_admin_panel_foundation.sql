-- Isolated administrative foundation. Browser roles cannot read audit data or
-- aggregated user metrics; access is mediated by authenticated server code.

alter table public.shop_products
  add column if not exists image_url text,
  add column if not exists display_section text not null default 'pacotes'
    check (display_section in ('pacotes', 'unitarias', 'exclusivas')),
  add column if not exists sort_order integer not null default 100;

update public.shop_products
set image_url = case
      when id in ('pack-1', 'pack-combo') then '/frames/1.webp'
      when id = 'single-random' then '/verso-card.png'
      else image_url
    end,
    display_section = case
      when product_type = 'exclusive' then 'exclusivas'
      when product_type = 'single_random' then 'unitarias'
      else 'pacotes'
    end
where image_url is null;

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx
  on public.admin_audit_logs(created_at desc);

alter table public.admin_audit_logs enable row level security;
revoke all on table public.admin_audit_logs from public, anon, authenticated;
grant all on table public.admin_audit_logs to service_role;

create or replace view public.admin_user_metrics
with (security_invoker = true)
as
select
  p.id as user_id,
  p.nick,
  p.created_at,
  coalesce(st.distinct_stickers, 0)::integer as distinct_stickers,
  coalesce(st.rare_stickers, 0)::integer as rare_stickers,
  coalesce(st.repeat_copies, 0)::integer as repeat_copies,
  coalesce(po.total_spent_cents, 0)::bigint as total_spent_cents,
  coalesce(po.approved_orders, 0)::integer as approved_orders
from public.profiles p
left join lateral (
  select
    count(*) filter (where us.copies > 0) as distinct_stickers,
    count(*) filter (where us.copies > 0 and us.is_rare) as rare_stickers,
    sum(greatest(us.copies - 1, 0)) as repeat_copies
  from public.user_stickers us
  where us.user_id = p.id
) st on true
left join lateral (
  select
    sum(o.amount_due_cents) filter (where o.payment_status = 'approved') as total_spent_cents,
    count(*) filter (where o.payment_status = 'approved') as approved_orders
  from public.purchase_orders o
  where o.user_id = p.id
) po on true;

revoke all on table public.admin_user_metrics from public, anon, authenticated;
grant select on table public.admin_user_metrics to service_role;

notify pgrst, 'reload schema';
