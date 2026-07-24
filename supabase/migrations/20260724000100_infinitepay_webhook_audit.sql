begin;

create table if not exists public.infinitepay_webhook_events (
  id uuid primary key default gen_random_uuid(),
  order_nsu text,
  transaction_nsu text,
  invoice_slug text,
  raw_payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists infinitepay_webhook_events_order_idx
  on public.infinitepay_webhook_events(order_nsu, received_at desc);

create index if not exists infinitepay_webhook_events_transaction_idx
  on public.infinitepay_webhook_events(transaction_nsu, received_at desc);

create index if not exists infinitepay_webhook_events_pending_idx
  on public.infinitepay_webhook_events(received_at)
  where processed = false;

alter table public.infinitepay_webhook_events enable row level security;

revoke all on table public.infinitepay_webhook_events from public, anon, authenticated;
grant all on table public.infinitepay_webhook_events to service_role;

commit;

notify pgrst, 'reload schema';
