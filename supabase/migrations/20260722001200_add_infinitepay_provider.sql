-- Add InfinitePay as an optional payment provider without changing the
-- existing Mercado Pago flow. Only server-side code may process a payment.
begin;

alter table public.purchase_orders
  add column if not exists payment_provider text,
  add column if not exists provider_checkout_reference text;

create index if not exists purchase_orders_provider_reference_idx
  on public.purchase_orders(payment_provider, provider_checkout_reference)
  where provider_checkout_reference is not null;

create or replace function public.process_infinitepay_payment(payment_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  order_row public.purchase_orders%rowtype;
  order_id_param uuid;
  payment_row_id uuid;
  provider_payment_id text := nullif(payment_payload->>'transaction_nsu', '');
  invoice_slug text := nullif(payment_payload->>'slug', '');
  order_nsu text := nullif(payment_payload->>'order_nsu', '');
  paid boolean := coalesce((payment_payload->>'paid')::boolean, false);
  amount_cents integer := coalesce((payment_payload->>'amount')::integer, 0);
  paid_amount_cents integer := coalesce((payment_payload->>'paid_amount')::integer, 0);
  capture_method text := nullif(payment_payload->>'capture_method', '');
begin
  if provider_payment_id is null or invoice_slug is null or order_nsu is null then
    raise exception 'Resposta InfinitePay sem identificadores obrigatorios.';
  end if;

  begin
    order_id_param := order_nsu::uuid;
  exception when invalid_text_representation then
    raise exception 'order_nsu invalido.';
  end;

  select * into order_row
  from public.purchase_orders
  where id = order_id_param
  for update;

  if order_row.id is null then
    raise exception 'Pedido nao encontrado.';
  end if;

  if amount_cents <> order_row.amount_due_cents then
    raise exception 'Valor InfinitePay nao confere com o pedido.';
  end if;

  insert into public.purchase_payments (
    order_id, provider, provider_payment_id, provider_preference_id,
    status, status_detail, payment_method_id, payment_type_id,
    transaction_amount_cents, net_received_amount_cents, currency,
    raw_payload, approved_at
  ) values (
    order_row.id, 'infinitepay', provider_payment_id, invoice_slug,
    case when paid then 'approved' else 'pending' end,
    case when paid then 'paid' else 'waiting' end,
    capture_method, capture_method,
    amount_cents, paid_amount_cents, order_row.currency,
    payment_payload, case when paid then now() else null end
  )
  on conflict (provider, provider_payment_id) do update set
    provider_preference_id = excluded.provider_preference_id,
    status = excluded.status,
    status_detail = excluded.status_detail,
    payment_method_id = excluded.payment_method_id,
    payment_type_id = excluded.payment_type_id,
    transaction_amount_cents = excluded.transaction_amount_cents,
    net_received_amount_cents = excluded.net_received_amount_cents,
    raw_payload = excluded.raw_payload,
    approved_at = coalesce(public.purchase_payments.approved_at, excluded.approved_at),
    updated_at = now()
  returning id into payment_row_id;

  if paid then
    if order_row.status in ('refunded', 'chargeback')
       or order_row.payment_status in ('refunded', 'charged_back') then
      insert into public.payment_admin_alerts (
        order_id, payment_id, provider_payment_id, alert_type, severity, message, metadata
      ) values (
        order_row.id, payment_row_id, provider_payment_id,
        'approval_after_terminal_state', 'critical',
        'Pagamento InfinitePay aprovado depois de estorno ou chargeback; pedido nao foi reativado.',
        jsonb_build_object('provider', 'infinitepay', 'invoice_slug', invoice_slug)
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
          payment_provider = 'infinitepay',
          provider_checkout_reference = invoice_slug,
          payment_approved_at = coalesce(payment_approved_at, now()),
          payment_snapshot = payment_payload,
          cancelled_at = null,
          updated_at = now()
      where id = order_row.id;

      insert into public.purchase_events(order_id, payment_id, user_id, event_type, message, metadata)
      values (
        order_row.id, payment_row_id, order_row.user_id, 'payment_approved',
        'Pagamento InfinitePay aprovado.',
        jsonb_build_object('provider', 'infinitepay', 'provider_payment_id', provider_payment_id)
      );
    elsif exists (
      select 1
      from public.purchase_payments other
      where other.order_id = order_row.id
        and other.status = 'approved'
        and other.id <> payment_row_id
    ) then
      insert into public.payment_admin_alerts (
        order_id, payment_id, provider_payment_id, alert_type, severity, message, metadata
      ) values (
        order_row.id, payment_row_id, provider_payment_id,
        'multiple_approved_payments', 'critical',
        'Mais de um pagamento aprovado foi identificado para o mesmo pedido.',
        jsonb_build_object('provider', 'infinitepay', 'invoice_slug', invoice_slug)
      )
      on conflict (order_id, provider_payment_id, alert_type) do update set
        payment_id = excluded.payment_id,
        metadata = excluded.metadata,
        updated_at = now();
    end if;
  end if;

  return jsonb_build_object(
    'order_id', order_row.id,
    'payment_status', case when paid then 'approved' else 'pending' end,
    'processed', true,
    'provider', 'infinitepay'
  );
end;
$$;

revoke all on function public.process_infinitepay_payment(jsonb) from public, anon, authenticated;
grant execute on function public.process_infinitepay_payment(jsonb) to service_role;

-- Provider-independent alert for any second approved transaction. The order
-- processors remain idempotent, while operations receives a visible warning.
create or replace function public.alert_multiple_approved_payments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and exists (
    select 1 from public.purchase_payments other
    where other.order_id = new.order_id
      and other.status = 'approved'
      and other.id <> new.id
  ) then
    insert into public.payment_admin_alerts (
      order_id, payment_id, provider_payment_id, alert_type, severity, message, metadata
    ) values (
      new.order_id, new.id, new.provider_payment_id,
      'multiple_approved_payments', 'critical',
      'Mais de um pagamento aprovado foi identificado para o mesmo pedido.',
      jsonb_build_object('provider', new.provider)
    )
    on conflict (order_id, provider_payment_id, alert_type) do update set
      payment_id = excluded.payment_id,
      metadata = excluded.metadata,
      updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists purchase_payments_alert_multiple_approved on public.purchase_payments;
create trigger purchase_payments_alert_multiple_approved
after insert or update of status on public.purchase_payments
for each row execute function public.alert_multiple_approved_payments();

commit;

notify pgrst, 'reload schema';
