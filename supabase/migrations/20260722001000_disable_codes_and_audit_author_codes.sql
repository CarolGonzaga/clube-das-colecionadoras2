-- Disable retired codes without deleting redemption history, and normalize the
-- permanent two-redemption author packages.

update public.redeem_codes
set active = false
where upper(code) in ('X8Y2Z5W1', 'K9P2X5Y1', 'T5R8Z1KA');

-- Author codes are the exact-sticker packages created with this label. Keep
-- them permanent, with two total redemptions and one copy of each listed item.
update public.redeem_codes
set active = true,
    max_redemptions = 2,
    copies_per_sticker = 1
where grant_all_pool = true
  and label like 'Pacote de %'
  and upper(code) not in ('X8Y2Z5W1', 'K9P2X5Y1', 'T5R8Z1KA');

do $$
declare
  invalid_codes text;
begin
  select string_agg(rc.code, ', ' order by rc.code)
  into invalid_codes
  from public.redeem_codes rc
  where rc.grant_all_pool = true
    and rc.label like 'Pacote de %'
    and (
      rc.active is not true
      or rc.max_redemptions <> 2
      or rc.copies_per_sticker <> 1
      or not exists (
        select 1 from public.redeem_pools rp where rp.code = rc.code
      )
      or exists (
        select 1
        from public.redeem_pools rp
        left join public.stickers s on s.number = rp.sticker_number
        where rp.code = rc.code and s.number is null
      )
    );

  if invalid_codes is not null then
    raise exception 'Códigos de autoras inconsistentes: %', invalid_codes;
  end if;

  if exists (
    select 1 from public.redeem_codes
    where upper(code) in ('X8Y2Z5W1', 'K9P2X5Y1', 'T5R8Z1KA')
      and active = true
  ) then
    raise exception 'Um ou mais códigos retirados continuam ativos.';
  end if;
end;
$$;
