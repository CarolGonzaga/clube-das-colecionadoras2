-- Make every non-quiz sticker available through every promotional code.
--
-- The redemption RPC keeps its existing behavior:
--   * 40% of draws come freely from the complete pool and may repeat;
--   * 60% prioritize a sticker the user does not own yet;
--   * after the user owns the pool, every draw can repeat.
--
-- Missions and family bonus packs already use get_random_pool_sticker(),
-- which covers 21-100, so they do not need a logic change.
insert into public.redeem_pools (code, sticker_number)
select rc.code, generated.sticker_number
from public.redeem_codes rc
cross join generate_series(21, 100) as generated(sticker_number)
on conflict (code, sticker_number) do nothing;

do $$
begin
  if exists (
    select 1
    from public.redeem_codes rc
    cross join generate_series(21, 100) as expected(sticker_number)
    where not exists (
      select 1
      from public.redeem_pools rp
      where rp.code = rc.code
        and rp.sticker_number = expected.sticker_number
    )
  ) then
    raise exception 'Falha ao completar os pools promocionais com as figurinhas 21-100';
  end if;
end;
$$;
