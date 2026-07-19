-- Fix PL/pgSQL ambiguity between variables and purchase_payments columns.

create or replace function public.process_mercado_pago_payment(payment_payload jsonb)
returns jsonb as $$
declare
  order_row public.purchase_orders%rowtype;
  order_id_param uuid;
  mp_provider_payment_id text;
  mp_payment_status text;
  mp_status_detail text;
  mp_amount_cents integer;
  mp_currency text;
  mp_external_reference text;
  mp_approved_at timestamptz;
begin
  mp_provider_payment_id := payment_payload->>'id';
  mp_payment_status := payment_payload->>'status';
  mp_status_detail := payment_payload->>'status_detail';
  mp_currency := coalesce(payment_payload->>'currency_id', 'BRL');
  mp_external_reference := payment_payload->>'external_reference';
  mp_amount_cents := round(coalesce((payment_payload->>'transaction_amount')::numeric, 0) * 100);
  mp_approved_at := nullif(payment_payload->>'date_approved', '')::timestamptz;

  if mp_external_reference is null then
    raise exception 'Pagamento sem external_reference.';
  end if;

  order_id_param := mp_external_reference::uuid;

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
    mp_provider_payment_id,
    payment_payload->>'preference_id',
    payment_payload->>'merchant_order_id',
    mp_payment_status,
    mp_status_detail,
    payment_payload->>'payment_method_id',
    payment_payload->>'payment_type_id',
    mp_amount_cents,
    round(coalesce((payment_payload#>>'{transaction_details,net_received_amount}')::numeric, 0) * 100),
    mp_currency,
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

  if mp_payment_status = 'approved' then
    if mp_currency <> order_row.currency then
      raise exception 'Moeda do pagamento nao confere.';
    end if;

    if mp_amount_cents <> order_row.amount_due_cents then
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
        jsonb_build_object('provider_payment_id', mp_provider_payment_id)
      );
    end if;
  elsif mp_payment_status in ('rejected', 'cancelled') then
    update public.purchase_orders
    set status = 'cancelled',
        payment_status = case when mp_payment_status = 'cancelled' then 'cancelled' else 'rejected' end,
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
    'payment_status', mp_payment_status,
    'processed', true
  );
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.process_mercado_pago_payment(jsonb) from public, anon, authenticated;
grant execute on function public.process_mercado_pago_payment(jsonb) to service_role;
