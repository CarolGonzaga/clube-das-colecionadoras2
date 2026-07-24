-- Reconcile two Mercado Pago payments that were approved by the provider on
-- 2026-07-23 but remained pending locally. The identity and amount checks make
-- this repair fail atomically if either provider reference points elsewhere.

do $$
declare
  expected_user_id constant uuid := 'c78d1148-3ec7-4f68-94ec-b0633b9e2a2e';
begin
  if not exists (
    select 1
    from public.purchase_orders
    where id = 'f00171e0-acfd-4b79-93fe-1fa173b6e904'::uuid
      and user_id = expected_user_id
      and amount_due_cents = 2250
  ) then
    raise exception 'Mercado Pago repair aborted: order f00171e0 does not match the expected user and amount.';
  end if;

  if not exists (
    select 1
    from public.purchase_orders
    where id = 'ddd73612-0d1d-44dd-9e89-07ee0455a6e7'::uuid
      and user_id = expected_user_id
      and amount_due_cents = 250
  ) then
    raise exception 'Mercado Pago repair aborted: order ddd73612 does not match the expected user and amount.';
  end if;

  perform public.process_mercado_pago_payment(
    jsonb_build_object(
      'id', '170186981660',
      'status', 'approved',
      'status_detail', 'accredited',
      'external_reference', 'f00171e0-acfd-4b79-93fe-1fa173b6e904',
      'transaction_amount', 22.50,
      'currency_id', 'BRL',
      'date_approved', '2026-07-23T13:02:00-03:00',
      'payer', jsonb_build_object(
        'email', 'quelra.silva.rs@gmail.com'
      ),
      'transaction_details', jsonb_build_object(
        'net_received_amount', 21.38
      ),
      'reconciliation_source', 'manual_provider_confirmation'
    )
  );

  perform public.process_mercado_pago_payment(
    jsonb_build_object(
      'id', '170202451328',
      'status', 'approved',
      'status_detail', 'accredited',
      'external_reference', 'ddd73612-0d1d-44dd-9e89-07ee0455a6e7',
      'transaction_amount', 2.50,
      'currency_id', 'BRL',
      'date_approved', '2026-07-23T14:42:00-03:00',
      'payer', jsonb_build_object(
        'email', 'quelra.silva.rs@gmail.com'
      ),
      'transaction_details', jsonb_build_object(
        'net_received_amount', 2.38
      ),
      'reconciliation_source', 'manual_provider_confirmation'
    )
  );
end
$$;
