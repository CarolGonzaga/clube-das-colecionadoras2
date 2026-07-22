-- Prevent authenticated clients from changing their own wallet directly.
-- Legitimate balance changes continue through SECURITY DEFINER RPCs.

begin;

do $$
declare
  required_function regprocedure;
begin
  foreach required_function in array array[
    to_regprocedure('public.ensure_user_points(uuid)'),
    to_regprocedure('public.exchange_for_points(integer)'),
    to_regprocedure('public.apply_points_to_purchase_order(uuid,integer)'),
    to_regprocedure('public.refund_purchase_order_points(uuid)'),
    to_regprocedure('public.spend_shop_checkout_points(integer,integer)'),
    to_regprocedure('public.get_points_balance()')
  ]
  loop
    if required_function is null then
      raise exception 'Expected wallet RPC is missing; permission hardening cancelled.';
    end if;

    if not (select prosecdef from pg_proc where oid = required_function) then
      raise exception 'Wallet RPC % is not SECURITY DEFINER; permission hardening cancelled.', required_function;
    end if;
  end loop;
end;
$$;

revoke insert, update, delete on table public.user_points from public, anon, authenticated;
revoke insert, update, delete on table public.point_transactions from public, anon, authenticated;

drop policy if exists "Users update own points" on public.user_points;

-- Preserve the read-only behavior used by the balance display and Realtime.
grant select on table public.user_points to authenticated;
grant select on table public.point_transactions to authenticated;

do $$
begin
  if has_table_privilege('authenticated', 'public.user_points', 'INSERT')
     or has_table_privilege('authenticated', 'public.user_points', 'UPDATE')
     or has_table_privilege('authenticated', 'public.user_points', 'DELETE') then
    raise exception 'Authenticated still has direct wallet write privileges; migration cancelled.';
  end if;

  if has_table_privilege('anon', 'public.user_points', 'INSERT')
     or has_table_privilege('anon', 'public.user_points', 'UPDATE')
     or has_table_privilege('anon', 'public.user_points', 'DELETE') then
    raise exception 'Anon still has direct wallet write privileges; migration cancelled.';
  end if;

  if not has_table_privilege('authenticated', 'public.user_points', 'SELECT') then
    raise exception 'Authenticated lost wallet read access; migration cancelled.';
  end if;
end;
$$;

commit;
