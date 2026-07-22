-- A rejected card attempt does not cancel a Checkout Pro order: the same
-- preference can still be paid with Pix or another payment method.
begin;

do $$
declare
  v_signature regprocedure := to_regprocedure('public.process_mercado_pago_payment(jsonb)');
  v_definition text;
  v_old text := $block$
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
$block$;
  v_new text := $block$
  elsif mp_payment_status in ('rejected', 'cancelled') then
    -- This status belongs to one payment attempt, not to the whole order.
    -- Keep the order and reserved points available for Pix/another card.
    update public.purchase_orders
    set status = 'pending_payment',
        payment_status = 'pending',
        fulfillment_status = 'waiting_payment',
        payment_pending_at = coalesce(payment_pending_at, now()),
        payment_snapshot = payment_payload
    where id = order_row.id
      and payment_status <> 'approved';
$block$;
  v_patched text;
begin
  if v_signature is null then
    raise exception 'process_mercado_pago_payment(jsonb) is missing; migration cancelled.';
  end if;

  select pg_get_functiondef(v_signature) into v_definition;
  if position(v_old in v_definition) = 0 then
    raise exception 'Unexpected payment processor definition; migration cancelled without changes.';
  end if;

  v_patched := replace(v_definition, v_old, v_new);
  if position(v_old in v_patched) > 0
     or position('perform public.refund_purchase_order_points(order_row.id)' in v_patched) > 0 then
    raise exception 'Unsafe rejected-payment behavior remains; migration cancelled.';
  end if;

  execute v_patched;
end;
$$;

create or replace function public.expire_stale_purchase_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_count integer := 0;
begin
  for v_order in
    select id
    from public.purchase_orders
    where payment_status in ('unpaid', 'pending')
      and status in ('created', 'pending_payment')
      and coalesce(payment_pending_at, created_at) < now() - interval '24 hours'
    for update skip locked
  loop
    update public.purchase_orders
    set status = 'cancelled',
        payment_status = 'cancelled',
        fulfillment_status = 'cancelled',
        cancelled_at = coalesce(cancelled_at, now())
    where id = v_order.id
      and payment_status <> 'approved';

    if found then
      perform public.refund_purchase_order_points(v_order.id);
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.process_mercado_pago_payment(jsonb) from public, anon, authenticated;
grant execute on function public.process_mercado_pago_payment(jsonb) to service_role;
revoke all on function public.expire_stale_purchase_orders() from public, anon, authenticated;
grant execute on function public.expire_stale_purchase_orders() to service_role;

do $$
declare
  v_job_id bigint;
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    for v_job_id in
      select jobid from cron.job where jobname = 'expire-stale-purchase-orders'
    loop
      perform cron.unschedule(v_job_id);
    end loop;

    perform cron.schedule(
      'expire-stale-purchase-orders',
      '15 * * * *',
      'select public.expire_stale_purchase_orders()'
    );
  end if;
end;
$$;

commit;
