-- Consolidate Mercado Pago state handling after the legacy processor was rerun.
-- Individual rejected/cancelled attempts keep the order payable. Refunds and
-- chargebacks cancel only unopened packs and create a restricted admin alert.

create table if not exists public.payment_admin_alerts (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.purchase_orders(id) on delete cascade,
  payment_id uuid references public.purchase_payments(id) on delete set null,
  provider_payment_id text,
  alert_type text not null,
  severity text not null default 'critical' check (severity in ('warning', 'critical')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  acknowledged boolean not null default false,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, provider_payment_id, alert_type)
);

create index if not exists payment_admin_alerts_open_created_idx
  on public.payment_admin_alerts(acknowledged, created_at desc);

alter table public.payment_admin_alerts enable row level security;
revoke all on table public.payment_admin_alerts from public, anon, authenticated;
grant all on table public.payment_admin_alerts to service_role;

create or replace function public.process_mercado_pago_payment(payment_payload jsonb)
returns jsonb as $$
declare
  order_row public.purchase_orders%rowtype;
  order_id_param uuid;
  payment_row_id uuid;
  mp_provider_payment_id text;
  mp_payment_status text;
  mp_status_detail text;
  mp_amount_cents integer;
  mp_currency text;
  mp_external_reference text;
  mp_approved_at timestamptz;
  opened_pack_count integer := 0;
  cancelled_pack_count integer := 0;
  terminal_order_status text;
  alert_message text;
begin
  mp_provider_payment_id := nullif(payment_payload->>'id', '');
  mp_payment_status := lower(coalesce(nullif(payment_payload->>'status', ''), 'pending'));
  mp_status_detail := payment_payload->>'status_detail';
  mp_currency := coalesce(nullif(payment_payload->>'currency_id', ''), 'BRL');
  mp_external_reference := nullif(payment_payload->>'external_reference', '');
  mp_amount_cents := round(coalesce(nullif(payment_payload->>'transaction_amount', '')::numeric, 0) * 100);
  mp_approved_at := nullif(payment_payload->>'date_approved', '')::timestamptz;

  if mp_provider_payment_id is null then
    raise exception 'Pagamento sem id do Mercado Pago.';
  end if;

  if mp_external_reference is null then
    raise exception 'Pagamento sem external_reference.';
  end if;

  begin
    order_id_param := mp_external_reference::uuid;
  exception when invalid_text_representation then
    raise exception 'external_reference invalida: %', mp_external_reference;
  end;

  select *
  into order_row
  from public.purchase_orders
  where id = order_id_param
  for update;

  if order_row.id is null then
    raise exception 'Pedido nao encontrado.';
  end if;

  insert into public.purchase_payments (
    order_id, provider, provider_payment_id, provider_preference_id,
    provider_merchant_order_id, status, status_detail, payment_method_id,
    payment_type_id, transaction_amount_cents, net_received_amount_cents,
    currency, payer_email, payer_id, raw_payload, approved_at
  ) values (
    order_row.id, 'mercadopago', mp_provider_payment_id,
    payment_payload->>'preference_id', payment_payload->>'merchant_order_id',
    mp_payment_status, mp_status_detail, payment_payload->>'payment_method_id',
    payment_payload->>'payment_type_id', mp_amount_cents,
    round(coalesce(nullif(payment_payload#>>'{transaction_details,net_received_amount}', '')::numeric, 0) * 100),
    mp_currency, payment_payload#>>'{payer,email}', payment_payload#>>'{payer,id}',
    payment_payload, mp_approved_at
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
    updated_at = now()
  returning id into payment_row_id;

  if mp_payment_status = 'approved' then
    if mp_currency <> order_row.currency then
      raise exception 'Moeda do pagamento nao confere.';
    end if;

    if mp_amount_cents <> order_row.amount_due_cents then
      raise exception 'Valor do pagamento nao confere.';
    end if;

    -- Never reactivate an order after a refund or chargeback due to a stale event.
    if order_row.status in ('refunded', 'chargeback')
       or order_row.payment_status in ('refunded', 'charged_back') then
      insert into public.payment_admin_alerts (
        order_id, payment_id, provider_payment_id, alert_type, severity, message, metadata
      ) values (
        order_row.id, payment_row_id, mp_provider_payment_id,
        'approval_after_terminal_state', 'critical',
        'Pagamento aprovado recebido depois de estorno ou chargeback; pedido nao foi reativado.',
        jsonb_build_object('order_status', order_row.status, 'payment_status', order_row.payment_status)
      )
      on conflict (order_id, provider_payment_id, alert_type) do update set
        payment_id = excluded.payment_id,
        metadata = excluded.metadata,
        updated_at = now();

    elsif order_row.payment_status <> 'approved' then
      update public.purchase_orders
      set status = 'approved',
          payment_status = 'approved',
          fulfillment_status = 'pending_opening',
          payment_approved_at = coalesce(payment_approved_at, mp_approved_at, now()),
          payment_snapshot = payment_payload,
          cancelled_at = null,
          updated_at = now()
      where id = order_row.id;

      insert into public.purchase_events(order_id, payment_id, user_id, event_type, message, metadata)
      values (
        order_row.id, payment_row_id, order_row.user_id, 'payment_approved',
        'Pagamento Mercado Pago aprovado.',
        jsonb_build_object('provider_payment_id', mp_provider_payment_id)
      );

    elsif not exists (
      select 1 from public.purchase_payments pp
      where pp.order_id = order_row.id
        and pp.provider = 'mercadopago'
        and pp.provider_payment_id <> mp_provider_payment_id
        and pp.status = 'approved'
    ) then
      update public.purchase_orders
      set payment_snapshot = payment_payload,
          updated_at = now()
      where id = order_row.id;
    else
      insert into public.payment_admin_alerts (
        order_id, payment_id, provider_payment_id, alert_type, severity, message, metadata
      ) values (
        order_row.id, payment_row_id, mp_provider_payment_id,
        'multiple_approved_payments', 'critical',
        'Mais de um pagamento aprovado foi identificado para o mesmo pedido.',
        jsonb_build_object('status_detail', mp_status_detail)
      )
      on conflict (order_id, provider_payment_id, alert_type) do update set
        payment_id = excluded.payment_id,
        metadata = excluded.metadata,
        updated_at = now();
    end if;

  elsif mp_payment_status in ('refunded', 'charged_back') then
    terminal_order_status := case when mp_payment_status = 'charged_back' then 'chargeback' else 'refunded' end;

    select count(*) into opened_pack_count
    from public.purchase_packs
    where order_id = order_row.id
      and status = 'opened';

    update public.purchase_packs
    set status = 'cancelled',
        updated_at = now()
    where order_id = order_row.id
      and status in ('pending', 'opening');
    get diagnostics cancelled_pack_count = row_count;

    update public.purchase_orders
    set status = terminal_order_status,
        payment_status = mp_payment_status,
        fulfillment_status = case when opened_pack_count > 0 then 'partially_opened' else 'cancelled' end,
        cancelled_at = coalesce(cancelled_at, now()),
        payment_snapshot = payment_payload,
        updated_at = now()
    where id = order_row.id;

    -- Return points only when no digital content from this order was opened.
    if opened_pack_count = 0 then
      perform public.refund_purchase_order_points(order_row.id);
    end if;

    alert_message := case
      when mp_payment_status = 'charged_back'
        then 'Chargeback recebido: pacotes fechados foram bloqueados; itens ja abertos foram preservados.'
      else 'Pagamento estornado: pacotes fechados foram bloqueados; itens ja abertos foram preservados.'
    end;

    insert into public.payment_admin_alerts (
      order_id, payment_id, provider_payment_id, alert_type, severity, message, metadata
    ) values (
      order_row.id, payment_row_id, mp_provider_payment_id, mp_payment_status, 'critical',
      alert_message,
      jsonb_build_object(
        'opened_packs_preserved', opened_pack_count,
        'unopened_packs_cancelled', cancelled_pack_count,
        'points_refunded', opened_pack_count = 0 and order_row.points_used > 0,
        'points_held_for_review', case when opened_pack_count > 0 then order_row.points_used else 0 end,
        'status_detail', mp_status_detail
      )
    )
    on conflict (order_id, provider_payment_id, alert_type) do update set
      payment_id = excluded.payment_id,
      message = excluded.message,
      metadata = excluded.metadata,
      updated_at = now();

    if order_row.status <> terminal_order_status
       or order_row.payment_status <> mp_payment_status then
      insert into public.purchase_events(order_id, payment_id, user_id, event_type, message, metadata)
      values (
        order_row.id, payment_row_id, order_row.user_id,
        case when mp_payment_status = 'charged_back' then 'payment_charged_back' else 'payment_refunded' end,
        alert_message,
        jsonb_build_object(
          'provider_payment_id', mp_provider_payment_id,
          'opened_packs_preserved', opened_pack_count,
          'unopened_packs_cancelled', cancelled_pack_count
        )
      );
    end if;

  elsif mp_payment_status in ('rejected', 'cancelled') then
    -- A failed attempt does not terminate the Checkout Pro preference: the same
    -- order may still be paid with Pix or a different card.
    if order_row.payment_status not in ('approved', 'refunded', 'charged_back') then
      update public.purchase_orders
      set status = 'pending_payment',
          payment_status = 'pending',
          fulfillment_status = 'waiting_payment',
          payment_pending_at = coalesce(payment_pending_at, now()),
          payment_snapshot = payment_payload,
          updated_at = now()
      where id = order_row.id;
    end if;

  else
    if order_row.payment_status not in ('approved', 'refunded', 'charged_back') then
      update public.purchase_orders
      set status = 'pending_payment',
          payment_status = 'pending',
          fulfillment_status = 'waiting_payment',
          payment_pending_at = coalesce(payment_pending_at, now()),
          payment_snapshot = payment_payload,
          updated_at = now()
      where id = order_row.id;
    end if;
  end if;

  return jsonb_build_object(
    'order_id', order_row.id,
    'payment_status', mp_payment_status,
    'processed', true,
    'opened_packs_preserved', opened_pack_count,
    'unopened_packs_cancelled', cancelled_pack_count
  );
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.process_mercado_pago_payment(jsonb) from public, anon, authenticated;
grant execute on function public.process_mercado_pago_payment(jsonb) to service_role;

