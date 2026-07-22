-- Prevent public REST access from listing active coupon codes.
-- Validation remains available exclusively through the controlled RPC.

begin;

do $$
declare
  validation_function regprocedure := to_regprocedure('public.validate_coupon(text)');
begin
  if validation_function is null then
    raise exception 'validate_coupon(text) is missing; coupon hardening cancelled.';
  end if;

  if not (select prosecdef from pg_proc where oid = validation_function) then
    raise exception 'validate_coupon(text) is not SECURITY DEFINER; coupon hardening cancelled.';
  end if;
end;
$$;

revoke select, insert, update, delete
on table public.coupons
from public, anon, authenticated;

drop policy if exists "Leitura de cupons ativos" on public.coupons;

-- Anonymous checkout is supported, so both browser roles may validate a code
-- without gaining access to the underlying coupon catalogue.
revoke all on function public.validate_coupon(text) from public;
grant execute on function public.validate_coupon(text) to anon, authenticated, service_role;

do $$
begin
  if has_table_privilege('anon', 'public.coupons', 'SELECT')
     or has_table_privilege('authenticated', 'public.coupons', 'SELECT') then
    raise exception 'Coupon catalogue is still readable by a browser role; migration cancelled.';
  end if;

  if not has_function_privilege('anon', 'public.validate_coupon(text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.validate_coupon(text)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.validate_coupon(text)', 'EXECUTE') then
    raise exception 'Coupon validation RPC is unavailable; migration cancelled.';
  end if;
end;
$$;

commit;
