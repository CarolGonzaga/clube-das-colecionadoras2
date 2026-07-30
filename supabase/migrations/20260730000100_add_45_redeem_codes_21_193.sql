-- 45 permanent promotional codes.
-- Each code draws five random stickers from 21..193 through the legacy
-- redemption flow. reward_grants enforces one redemption per code/user.

begin;

do $$
declare
  v_codes constant text[] := array[
    'Q2A7Z4M9', 'W5S1X8N3', 'E8D4C2B7', 'R1F6V9K3', 'T4G8B2L7',
    'Y7H3N6P1', 'U2J9M5Q8', 'I5K1L7R4', 'O8L4K2S6', 'P1M7J9T3',
    'A4N8H2V5', 'S7B3G6W1', 'D2V9F5X8', 'F5C1D7Y4', 'G8X4S2Z6',
    'H1Z7A9Q3', 'J4Q8P2W5', 'K7W3O6E1', 'L2E9I5R8', 'Z5R1U7T4',
    'X8T4Y2U6', 'C1Y7T9I3', 'V4U8R2O5', 'B7I3E6P1', 'N2O9W5A8',
    'M5P1Q7S4', 'Q8A4Z2D6', 'W1S7X9F3', 'E4D8C2G5', 'R7F3V6H1',
    'T2G9B5J8', 'Y5H1N7K4', 'U8J4M2L6', 'I1K7L9Z3', 'O4L8K2X5',
    'P7M3J6C1', 'A2N9H5V8', 'S5B1G7N4', 'D8V4F2M6', 'F1C7D9Q3',
    'G4X8S2W5', 'H7Z3A6E1', 'J2Q9P5R8', 'K5W1O7T4', 'L8E4I2Y6'
  ]::text[];
  v_code text;
  v_existing text[];
  v_pool_count integer;
begin
  if cardinality(v_codes) <> 45 then
    raise exception 'Esperados 45 códigos, mas foram informados %.', cardinality(v_codes);
  end if;

  select array_agg(rc.code order by rc.code)
  into v_existing
  from public.redeem_codes rc
  where rc.code = any (v_codes);

  if v_existing is not null then
    raise exception
      'Um ou mais códigos já existem; criação cancelada: %.',
      array_to_string(v_existing, ', ');
  end if;

  foreach v_code in array v_codes
  loop
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
    values (
      v_code,
      'Pacote permanente — 5 figurinhas entre 21 e 193',
      null,
      true,
      1,
      null,
      false,
      1,
      null,
      null
    );

    insert into public.redeem_pools (code, sticker_number)
    select v_code, s.number
    from public.stickers s
    where s.number between 21 and 193;

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
