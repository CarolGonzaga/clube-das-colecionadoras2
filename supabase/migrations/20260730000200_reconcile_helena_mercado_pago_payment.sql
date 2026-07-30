-- Reconcile the Mercado Pago payment approved on 2026-07-29 that remained
-- pending locally. The checks below make the repair fail without changes if
-- the provider reference does not match the reported account and order.

do $$
declare
  expected_user_id constant uuid := 'dea35a18-60d6-4bdd-87bc-e3f8b789bf4f';
  expected_order_id constant uuid := '1f7a46e2-c2cd-473a-8151-72196e3e4fcb';
begin
  if not exists (
    select 1
    from auth.users
    where id = expected_user_id
      and lower(email) = 'hl5394731@gmail.com'
  ) then
    raise exception 'Mercado Pago repair aborted: the expected Helena account was not found.';
  end if;

  if not exists (
    select 1
    from public.purchase_orders
    where id = expected_order_id
      and user_id = expected_user_id
      and order_code = 'CDC-BC01727D41'
      and amount_due_cents = 1000
  ) then
    raise exception 'Mercado Pago repair aborted: order 1f7a46e2 does not match the expected user, code, and amount.';
  end if;

  if not exists (
    select 1
    from public.purchase_order_items
    where order_id = expected_order_id
      and lower(product_name) = 'pacote'
      and quantity = 4
  ) then
    raise exception 'Mercado Pago repair aborted: order 1f7a46e2 does not contain the expected four packs.';
  end if;

  perform public.process_mercado_pago_payment(
    jsonb_build_object(
      'id', '170255076765',
      'status', 'approved',
      'status_detail', 'accredited',
      'external_reference', expected_order_id::text,
      'transaction_amount', 10.00,
      'currency_id', 'BRL',
      'date_approved', '2026-07-29T20:54:00-03:00',
      'payment_type_id', 'bank_transfer',
      'payer', jsonb_build_object(
        'email', 'hl5394731@gmail.com'
      ),
      'transaction_details', jsonb_build_object(
        'net_received_amount', 9.90
      ),
      'reconciliation_source', 'manual_provider_confirmation'
    )
  );
end
$$;
