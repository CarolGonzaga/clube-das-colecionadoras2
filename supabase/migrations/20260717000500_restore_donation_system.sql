-- Restore donation system implementation

create or replace function public.generate_donation(sticker_number_param integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id_param uuid;
  existing_copies integer;
  random_code text;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  -- Check duplicate ownership
  select copies into existing_copies
  from public.user_stickers
  where user_id = user_id_param and sticker_number = sticker_number_param;

  if existing_copies is null or existing_copies <= 1 then
    raise exception 'Você não tem repetida dessa.';
  end if;

  -- Consume copy
  update public.user_stickers
  set copies = copies - 1
  where user_id = user_id_param and sticker_number = sticker_number_param;

  -- Generate 8 character random uppercase code
  loop
    random_code := upper(substring(md5(random()::text) from 1 for 8));
    exit when not exists (select 1 from public.donations where code = random_code);
  end loop;

  -- Create donation entry (expires in 24 hours)
  insert into public.donations (code, sticker_number, from_user, to_user, status, expires_at)
  values (
    random_code,
    sticker_number_param,
    user_id_param,
    null,
    'active',
    now() + interval '24 hours'
  );

  return random_code;
end;
$$;

create or replace function public.redeem_donation(code_param text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id_param uuid;
  code_clean text;
  donation_row record;
  target_slug text;
  was_new boolean;
  reveals jsonb := '[]'::jsonb;
  progression_reveals jsonb;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  code_clean := upper(trim(code_param));

  -- Get active donation
  select * into donation_row from public.donations where code = code_clean;
  if not found then
    raise exception 'Código inválido.';
  end if;

  if donation_row.status <> 'active' then
    raise exception 'Esse código de doação já foi usado ou expirou.';
  end if;

  -- Check if expired
  if now() > donation_row.expires_at then
    update public.donations set status = 'expired' where code = code_clean;
    
    -- Revert copy to sender
    insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    values (donation_row.from_user, donation_row.sticker_number, 1, false, now())
    on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1;
    
    raise exception 'Código de doação expirado.';
  end if;

  -- Prevent self-claiming
  if donation_row.from_user = user_id_param then
    raise exception 'Você não pode resgatar seu próprio código 😅';
  end if;

  -- Consume donation
  update public.donations
  set status = 'used', to_user = user_id_param
  where code = code_clean;

  -- Mapping slug
  select 
    case donation_row.sticker_number
      when 1 then 'amor-fati' when 2 then 'cupidos-nao-se-apaixonam' when 3 then 'eu-minha-crush-e-minha-irma'
      when 4 then 'liz-flores-e-uma-farsa' when 5 then 'segundo-cliche' when 6 then 'desejos-ocultos-das-violetas'
      when 7 then 'o-casamento' when 8 then 'como-não-se-apaixonar' when 9 then 'ela-e-mais-do-que-voce-imagina'
      when 10 then 'nao-conta-pra-ela' when 11 then 'opostas-em-guerra' when 12 then 'em-todas-as-gotas-de-chuva'
      when 13 then 'colegas-de-quarto' when 14 then 'imensuravel-uma-nova-chance-para-amar' when 15 then 'georgia-rose'
      when 16 then 'a-garota-do-topo' when 17 then 'nao-e-so-de-amor-que-eu-sei-falar' when 18 then 'os-segredos-que-contei-ao-oceano'
      when 19 then 'opostos-complementares' when 20 then 'cancao-dos-ossos'
      when 21 then 'classicos-saficos' when 22 then 'bright-falls' when 23 then 'romance-e-destino'
      when 24 then 'drama-e-superacao' when 25 then 'garotas-saficas' when 26 then 'intriga-e-paixao'
      when 27 then 'segredos-revelados' when 28 then 'amores-proibidos' when 29 then 'encontros-e-desencontros'
      when 30 then 'lendo-saficos' when 31 then 'orgulho-e-preconceito' when 32 then 'emma'
      when 33 then 'razao-e-sensibilidade' when 34 then 'mansfield-park' when 35 then 'persuasao'
      when 36 then 'ls-sticker-1' when 37 then 'ls-sticker-2' when 38 then 'ls-sticker-3' when 39 then 'ls-sticker-4' when 40 then 'ls-sticker-5'
      when 41 then 'historias-de-amor' when 42 then 'representatividade' when 43 then 'poesia-safica' when 44 then 'senhora' when 45 then 'lucia-mccartney'
      when 46 then 'frase-1' when 47 then 'frase-2' when 48 then 'frase-3' when 49 then 'persuasao' when 50 then 'lendo-saficos'
      else 'frase-' || (donation_row.sticker_number - 47)
    end into target_slug;

  -- Add to user stickers inventory
  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (user_id_param, donation_row.sticker_number, 1, false, now())
  on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
  returning (copies = 1) into was_new;

  reveals := reveals || jsonb_build_object(
    'slug', target_slug,
    'number', donation_row.sticker_number,
    'wasNew', was_new,
    'isRare', false,
    'repeat', not was_new,
    'reward', null
  );

  -- Check Progression achievements
  progression_reveals := public.check_and_grant_rewards(user_id_param);
  reveals := reveals || progression_reveals;

  return jsonb_build_object(
    'success', true,
    'reveals', reveals
  );
end;
$$;

create or replace function public.expire_donations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  donation_row record;
  expired_count integer := 0;
begin
  for donation_row in 
    update public.donations
    set status = 'expired'
    where status = 'active' and expires_at < now()
    returning *
  loop
    -- Revert copy to sender/creator
    insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    values (donation_row.from_user, donation_row.sticker_number, 1, false, now())
    on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1;

    expired_count := expired_count + 1;
  end loop;
  
  return expired_count;
end;
$$;

grant execute on function public.generate_donation(integer) to authenticated;
grant execute on function public.redeem_donation(text) to authenticated;
grant execute on function public.expire_donations() to authenticated;
