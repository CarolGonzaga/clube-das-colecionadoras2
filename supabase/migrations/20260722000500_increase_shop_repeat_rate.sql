-- Target: approximately 280-320 repeats per 615 random shop stickers.
-- A 49% Bernoulli draw has an expected value of 301.35 repeats in 615 draws.
begin;

do $$
declare
  v_signature regprocedure := to_regprocedure('public.choose_shop_sticker_before_insert()');
  v_definition text;
  v_patched text;
begin
  if v_signature is null then
    raise exception 'choose_shop_sticker_before_insert() is missing; migration cancelled.';
  end if;

  select pg_get_functiondef(v_signature) into v_definition;
  if position('random() < 0.30' in v_definition) = 0 then
    raise exception 'Unexpected shop repeat function; migration cancelled without changes.';
  end if;

  v_patched := replace(v_definition, 'random() < 0.30', 'random() < 0.49');
  if position('random() < 0.30' in v_patched) > 0
     or position('random() < 0.49' in v_patched) = 0 then
    raise exception 'Shop repeat probability was not patched safely.';
  end if;

  execute v_patched;
end;
$$;

revoke all on function public.choose_shop_sticker_before_insert() from public, anon, authenticated;

commit;
