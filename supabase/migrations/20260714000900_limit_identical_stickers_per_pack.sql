-- Limit identical stickers to two occurrences in every five-sticker package.
-- Keeps the existing 40%/47% repeat probabilities unchanged.

-- Remove from a draw pool only the sticker numbers that already appeared twice
-- in the package currently being assembled. This preserves repeat odds while
-- preventing three or more identical stickers in the same five-sticker pack.
create or replace function public.pack_available_pool(
  pool_numbers integer[],
  package_numbers integer[]
)
returns integer[] as $$
  select coalesce(array_agg(candidate.sticker_number), '{}'::integer[])
  from unnest(pool_numbers) as candidate(sticker_number)
  where (
    select count(*)
    from unnest(coalesce(package_numbers, '{}'::integer[])) as drawn(sticker_number)
    where drawn.sticker_number = candidate.sticker_number
  ) < 2;
$$ language sql immutable set search_path = public;

revoke all on function public.pack_available_pool(integer[], integer[]) from public, anon, authenticated;

create or replace function public.check_and_grant_rewards(user_id_param uuid)
returns jsonb as $$
declare
  reveals jsonb := '[]'::jsonb;
  granted_in_loop boolean := true;
  total_count integer;
  was_new boolean;
  reward_item jsonb;
  target_number integer;
  package_numbers integer[];
  available_pool integer[];
begin
  while granted_in_loop loop
    granted_in_loop := false;

    -- Count total owned stickers
    select count(*) into total_count
    from public.user_stickers us
    where us.user_id = user_id_param and us.copies > 0;

    -- 1. Total 100 -> Poster Reward
    if total_count >= 100 and not exists (select 1 from public.reward_grants where user_id = user_id_param and reward_key = 'poster') then
      insert into public.reward_grants (user_id, reward_key) values (user_id_param, 'poster');
      granted_in_loop := true;

    -- 2. Baldaverso (1, 53, 54) -> Sticker 91
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Baldaverso')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 1 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 53 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 54 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'Baldaverso');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 91, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
      returning (copies = 1) into was_new;

      reveals := reveals || jsonb_build_object('slug', 'frases-1', 'number', 91, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Baldaverso');
      package_numbers := array[91];
       
      -- Add 4 random stickers for the pack
      for i in 1..4 loop
        available_pool := public.pack_available_pool(array(select generate_series(21, 100)), package_numbers);
        target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
        package_numbers := array_append(package_numbers, target_number);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        reveals := reveals || jsonb_build_object('slug', 'extra', 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Baldaverso');
      end loop;

      granted_in_loop := true;

    -- 3. Frutaverso (5, 59, 60) -> Sticker 92
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Frutaverso')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 5 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 59 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 60 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'Frutaverso');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 92, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
      returning (copies = 1) into was_new;

      reveals := reveals || jsonb_build_object('slug', 'frases-2', 'number', 92, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Frutaverso');
      package_numbers := array[92];
       
      -- Add 4 random stickers for the pack
      for i in 1..4 loop
        available_pool := public.pack_available_pool(array(select generate_series(21, 100)), package_numbers);
        target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
        package_numbers := array_append(package_numbers, target_number);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        reveals := reveals || jsonb_build_object('slug', 'extra', 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Frutaverso');
      end loop;

      granted_in_loop := true;

    -- 4. Bright Falls (22, 51, 52) -> Sticker 93
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Bright Falls')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 22 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 51 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 52 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'Bright Falls');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 93, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
      returning (copies = 1) into was_new;

      reveals := reveals || jsonb_build_object('slug', 'frases-3', 'number', 93, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Bright Falls');
      package_numbers := array[93];
       
      -- Add 4 random stickers for the pack
      for i in 1..4 loop
        available_pool := public.pack_available_pool(array(select generate_series(21, 100)), package_numbers);
        target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
        package_numbers := array_append(package_numbers, target_number);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        reveals := reveals || jsonb_build_object('slug', 'extra', 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Bright Falls');
      end loop;

      granted_in_loop := true;

    -- 5. HQ (84, 85, 87) -> Sticker 94
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'HQ')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 84 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 85 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 87 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'HQ');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 94, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
      returning (copies = 1) into was_new;

      reveals := reveals || jsonb_build_object('slug', 'frases-4', 'number', 94, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_HQ');
      package_numbers := array[94];
       
      -- Add 4 random stickers for the pack
      for i in 1..4 loop
        available_pool := public.pack_available_pool(array(select generate_series(21, 100)), package_numbers);
        target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
        package_numbers := array_append(package_numbers, target_number);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        reveals := reveals || jsonb_build_object('slug', 'extra', 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_HQ');
      end loop;

      granted_in_loop := true;

    -- 6. Opostos Co. (19, 73, 74) -> Sticker 95
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Opostos Co.')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 19 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 73 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 74 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'Opostos Co.');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 95, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
      returning (copies = 1) into was_new;

      reveals := reveals || jsonb_build_object('slug', 'frases-5', 'number', 95, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Opostos Co.');
      package_numbers := array[95];
       
      -- Add 4 random stickers for the pack
      for i in 1..4 loop
        available_pool := public.pack_available_pool(array(select generate_series(21, 100)), package_numbers);
        target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
        package_numbers := array_append(package_numbers, target_number);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        reveals := reveals || jsonb_build_object('slug', 'extra', 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Opostos Co.');
      end loop;

      granted_in_loop := true;
    end if;

  end loop;

  return reveals;
end;
$$ language plpgsql security definer;

create or replace function public.redeem_code(code_param text)
returns jsonb as $$
declare
  user_id_param uuid;
  code_clean text;
  code_row record;
  pool_numbers integer[];
  available_pool integer[];
  package_numbers integer[] := '{}'::integer[];
  reveals jsonb := '[]'::jsonb;
  draw_idx integer;
  target_number integer;
  target_slug text;
  was_new boolean;
  styles_unlocked jsonb := '[]'::jsonb;
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

  -- Verify code validity
  select * into code_row from public.redeem_codes where code = code_clean and active = true;
  if not found then
    raise exception 'CÃ³digo invÃ¡lido.';
  end if;

  -- Verify release schedule based on app launch settings
  select value into release_date_str from public.app_settings where key = 'release_date';
  if release_date_str is null then
    release_date_val := '2026-07-02 00:00:00+00'::timestamptz;
  else
    release_date_val := (release_date_str || ' 00:00:00+00')::timestamptz;
  end if;

  days_elapsed := floor(extract(epoch from (now() - release_date_val)) / 86400)::integer + 1;
  if days_elapsed < code_row.release_day then
    raise exception 'Este cÃ³digo promocional ainda nÃ£o estÃ¡ ativo! SerÃ¡ liberado no dia % do lanÃ§amento.', code_row.release_day;
  end if;

  -- Ensure user hasn't redeemed this code before
  if exists (
    select 1 from public.reward_grants
    where user_id = user_id_param and reward_key = 'code_' || code_clean
  ) then
    raise exception 'VocÃª jÃ¡ usou esse cÃ³digo.';
  end if;

  -- Get code sticker pool
  select array_agg(sticker_number) into pool_numbers
  from public.redeem_pools
  where code = code_clean;

  if pool_numbers is null or array_length(pool_numbers, 1) = 0 then
    raise exception 'Pool do cÃ³digo vazia.';
  end if;

  -- Mark code as redeemed for this user
  insert into public.reward_grants (user_id, reward_key) values (user_id_param, 'code_' || code_clean);

  -- Perform 5 random sticker draws
  for draw_idx in 1 .. 5 loop
    available_pool := public.pack_available_pool(pool_numbers, package_numbers);
    target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
    package_numbers := array_append(package_numbers, target_number);

    -- Get sticker details
    select 
      case target_number
        when 1 then 'amor-fati' when 2 then 'cupidos-nao-se-apaixonam' when 3 then 'eu-minha-crush-e-minha-irma'
        when 4 then 'liz-flores-e-uma-farsa' when 5 then 'segundo-cliche' when 6 then 'desejos-ocultos-das-violetas'
        when 7 then 'o-casamento' when 8 then 'como-nÃ£o-se-apaixonar' when 9 then 'ela-e-mais-do-que-voce-imagina'
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

    -- Add to user stickers inventory
    insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    values (user_id_param, target_number, 1, false, now())
    on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
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

  -- Unlock cosmetic layout style if attached to promo code
  if code_row.element is not null then
    update public.user_styles
    set unlocked = true
    where user_id = user_id_param and style_id = code_row.element;
  end if;

  -- Check Progression achievements
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
