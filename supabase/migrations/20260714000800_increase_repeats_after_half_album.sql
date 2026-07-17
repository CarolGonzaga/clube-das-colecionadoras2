-- Make the configured repeat percentage an actual repeat probability for all
-- non-quiz rewards. The threshold counts only unique stickers 21-100.
create or replace function public.draw_non_quiz_sticker(
  user_id_param uuid,
  pool_numbers integer[]
)
returns integer as $$
declare
  owned_count integer;
  repeat_chance double precision;
  choose_repeat boolean;
  target_number integer;
begin
  if pool_numbers is null or array_length(pool_numbers, 1) is null then
    raise exception 'Pool de figurinhas vazia.';
  end if;

  select count(distinct us.sticker_number)::integer into owned_count
  from public.user_stickers us
  where us.user_id = user_id_param
    and us.copies > 0
    and us.sticker_number between 21 and 100;

  repeat_chance := case when owned_count >= 40 then 0.47 else 0.40 end;
  choose_repeat := random() < repeat_chance;

  if choose_repeat then
    select pool.sticker_number into target_number
    from unnest(pool_numbers) as pool(sticker_number)
    where exists (
      select 1
      from public.user_stickers us
      where us.user_id = user_id_param
        and us.sticker_number = pool.sticker_number
        and us.copies > 0
    )
    order by random()
    limit 1;
  end if;

  if target_number is null then
    select pool.sticker_number into target_number
    from unnest(pool_numbers) as pool(sticker_number)
    where not exists (
      select 1
      from public.user_stickers us
      where us.user_id = user_id_param
        and us.sticker_number = pool.sticker_number
        and us.copies > 0
    )
    order by random()
    limit 1;
  end if;

  if target_number is null then
    target_number := pool_numbers[floor(random() * array_length(pool_numbers, 1) + 1)];
  end if;

  return target_number;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.draw_non_quiz_sticker(uuid, integer[]) from public, anon, authenticated;

create or replace function public.redeem_code(code_param text)
returns jsonb as $$
declare
  user_id_param uuid;
  code_clean text;
  code_row record;
  pool_numbers integer[];
  reveals jsonb := '[]'::jsonb;
  draw_idx integer;
  target_number integer;
  target_slug text;
  was_new boolean;
  progression_reveals jsonb;
  release_date_str text;
  release_date_val timestamptz;
  days_elapsed integer;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  code_clean := upper(trim(code_param));

  select * into code_row
  from public.redeem_codes
  where code = code_clean and active = true;

  if not found then
    raise exception 'Código inválido.';
  end if;

  select value into release_date_str
  from public.app_settings
  where key = 'release_date';

  if release_date_str is null then
    release_date_val := '2026-07-02 00:00:00+00'::timestamptz;
  else
    release_date_val := (release_date_str || ' 00:00:00+00')::timestamptz;
  end if;

  days_elapsed := floor(extract(epoch from (now() - release_date_val)) / 86400)::integer + 1;
  if days_elapsed < code_row.release_day then
    raise exception 'Este código promocional ainda não está ativo! Será liberado no dia % do lançamento.', code_row.release_day;
  end if;

  if exists (
    select 1 from public.reward_grants
    where user_id = user_id_param and reward_key = 'code_' || code_clean
  ) then
    raise exception 'Você já usou esse código.';
  end if;

  select array_agg(sticker_number order by sticker_number) into pool_numbers
  from public.redeem_pools
  where code = code_clean;

  if pool_numbers is null or array_length(pool_numbers, 1) = 0 then
    raise exception 'Pool do código vazia.';
  end if;

  insert into public.reward_grants (user_id, reward_key)
  values (user_id_param, 'code_' || code_clean);

  for draw_idx in 1 .. 5 loop
    target_number := public.draw_non_quiz_sticker(user_id_param, pool_numbers);

    select case target_number
      when 1 then 'amor-fati' when 2 then 'cupidos-nao-se-apaixonam' when 3 then 'eu-minha-crush-e-minha-irma'
      when 4 then 'liz-flores-e-uma-farsa' when 5 then 'segundo-cliche' when 6 then 'desejos-ocultos-das-violetas'
      when 7 then 'o-casamento' when 8 then 'como-nao-se-apaixonar' when 9 then 'ela-e-mais-do-que-voce-imagina'
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
      else 'frase-' || (target_number - 47)
    end into target_slug;

    insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    values (user_id_param, target_number, 1, false, now())
    on conflict (user_id, sticker_number) do update
      set copies = public.user_stickers.copies + 1
    returning (copies = 1) into was_new;

    reveals := reveals || jsonb_build_object(
      'slug', target_slug,
      'number', target_number,
      'wasNew', was_new,
      'isRare', false,
      'repeat', not was_new,
      'reward', null
    );
  end loop;

  if code_row.element is not null then
    update public.user_styles
    set unlocked = true
    where user_id = user_id_param and style_id = code_row.element;
  end if;

  progression_reveals := public.check_and_grant_rewards(user_id_param);
  reveals := reveals || progression_reveals;

  return jsonb_build_object(
    'success', true,
    'reveals', reveals,
    'element', code_row.element
  );
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.redeem_code(text) from public, anon;
grant execute on function public.redeem_code(text) to authenticated;

-- Missions and the four random cards in family packs use this function.
create or replace function public.get_random_pool_sticker(user_id_param uuid)
returns integer as $$
declare
  pool_numbers integer[];
begin
  select array_agg(sticker_number order by sticker_number) into pool_numbers
  from generate_series(21, 100) as pool(sticker_number);

  return public.draw_non_quiz_sticker(user_id_param, pool_numbers);
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.get_random_pool_sticker(uuid) from public, anon, authenticated;
