-- Temporary-safe point debit for the current simulated checkout.
-- It records the wallet movement in Supabase even before Mercado Pago/order RPCs are fully connected.

alter table public.point_transactions
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create or replace function public.spend_shop_checkout_points(
  requested_points_param integer,
  cart_point_total_param integer
)
returns jsonb as $$
declare
  caller_id uuid;
  current_balance integer;
  points_to_use integer;
  new_balance integer;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Unauthorized';
  end if;

  if requested_points_param is null or requested_points_param < 0 then
    raise exception 'Quantidade de pontos invalida.';
  end if;

  if cart_point_total_param is null or cart_point_total_param < 0 then
    raise exception 'Total de pontos do carrinho invalido.';
  end if;

  perform public.ensure_user_points(caller_id);

  select balance
  into current_balance
  from public.user_points
  where user_id = caller_id
  for update;

  points_to_use := least(requested_points_param, cart_point_total_param, current_balance);

  if points_to_use <= 0 then
    return jsonb_build_object('points_used', 0, 'new_balance', current_balance);
  end if;

  update public.user_points
  set balance = balance - points_to_use,
      updated_at = now()
  where user_id = caller_id
  returning balance into new_balance;

  insert into public.point_transactions(user_id, amount, reason, metadata)
  values (
    caller_id,
    -points_to_use,
    'shop_checkout_payment',
    jsonb_build_object(
      'cart_point_total', cart_point_total_param,
      'requested_points', requested_points_param,
      'checkout_mode', 'simulated'
    )
  );

  return jsonb_build_object(
    'points_used', points_to_use,
    'new_balance', new_balance
  );
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.spend_shop_checkout_points(integer, integer) from public, anon, authenticated;
grant execute on function public.spend_shop_checkout_points(integer, integer) to authenticated;
