-- Keep pack fulfillment consistent when an unpaid purchase order expires or is
-- otherwise cancelled. Opened packs are intentionally preserved; only content
-- that has not been consumed is blocked.

create or replace function public.cancel_unopened_packs_with_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' or new.payment_status = 'cancelled' then
    update public.purchase_packs
    set status = 'cancelled',
        updated_at = now()
    where order_id = new.id
      and status in ('pending', 'opening');
  end if;

  return new;
end;
$$;

revoke all on function public.cancel_unopened_packs_with_order()
  from public, anon, authenticated;
grant execute on function public.cancel_unopened_packs_with_order()
  to service_role;

drop trigger if exists purchase_orders_cancel_unopened_packs
  on public.purchase_orders;
create trigger purchase_orders_cancel_unopened_packs
after insert or update of status, payment_status
on public.purchase_orders
for each row
when (new.status = 'cancelled' or new.payment_status = 'cancelled')
execute function public.cancel_unopened_packs_with_order();

-- Repair any orphaned unopened packs created before this invariant existed.
update public.purchase_packs pp
set status = 'cancelled',
    updated_at = now()
from public.purchase_orders po
where pp.order_id = po.id
  and (po.status = 'cancelled' or po.payment_status = 'cancelled')
  and pp.status in ('pending', 'opening');

notify pgrst, 'reload schema';
