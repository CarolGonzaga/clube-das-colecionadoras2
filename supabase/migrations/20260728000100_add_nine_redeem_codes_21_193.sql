-- Nine permanent promotional codes.
-- Each redemption grants five random stickers from 21..193.
-- The existing redeem_code RPC and reward_grants unique key enforce one
-- redemption of each code per user.

begin;

do $$
declare
  v_codes constant text[] := array[
    'R4T7Y2U9',
    'E7W3Q8P2',
    'L5K8J2H6',
    'S4D7F1G9',
    'U6I3O8P2',
    'C4V7B1N9',
    'A8Z3X6C2',
    'T7R4E9W1',
    'G5H8J2K6'
  ]::text[];
  v_existing text[];
begin
  select array_agg(rc.code order by rc.code)
  into v_existing
  from public.redeem_codes rc
  where rc.code = any (v_codes);

  if v_existing is not null then
    raise exception
      'Um ou mais códigos já existem; criação cancelada: %.',
      array_to_string(v_existing, ', ');
  end if;
end
$$;

insert into public.redeem_codes (
  code,
  label,
  element,
  active,
  release_day,
  max_redemptions,
  grant_all_pool,
  copies_per_sticker,
  available_from,
  available_until
)
select
  code,
  'Pacote permanente — 5 figurinhas entre 21 e 193',
  null,
  true,
  1,
  null,
  false,
  1,
  null,
  null
from unnest(array[
  'R4T7Y2U9',
  'E7W3Q8P2',
  'L5K8J2H6',
  'S4D7F1G9',
  'U6I3O8P2',
  'C4V7B1N9',
  'A8Z3X6C2',
  'T7R4E9W1',
  'G5H8J2K6'
]::text[]) as code;

insert into public.redeem_pools (code, sticker_number)
select code, sticker_number
from unnest(array[
  'R4T7Y2U9',
  'E7W3Q8P2',
  'L5K8J2H6',
  'S4D7F1G9',
  'U6I3O8P2',
  'C4V7B1N9',
  'A8Z3X6C2',
  'T7R4E9W1',
  'G5H8J2K6'
]::text[]) as code
cross join generate_series(21, 193) as sticker_number;

do $$
declare
  v_code text;
  v_pool_count integer;
begin
  foreach v_code in array array[
    'R4T7Y2U9',
    'E7W3Q8P2',
    'L5K8J2H6',
    'S4D7F1G9',
    'U6I3O8P2',
    'C4V7B1N9',
    'A8Z3X6C2',
    'T7R4E9W1',
    'G5H8J2K6'
  ]::text[]
  loop
    select count(*)
    into v_pool_count
    from public.redeem_pools
    where code = v_code
      and sticker_number between 21 and 193;

    if v_pool_count <> 173 then
      raise exception
        'Código % deveria possuir 173 itens no pool, mas possui %.',
        v_code,
        v_pool_count;
    end if;

    if exists (
      select 1
      from public.redeem_pools
      where code = v_code
        and sticker_number not between 21 and 193
    ) then
      raise exception 'Código % contém item fora do intervalo 21..193.', v_code;
    end if;
  end loop;
end
$$;

notify pgrst, 'reload schema';

commit;
