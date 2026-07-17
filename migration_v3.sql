-- ----------------------------------------------------------------
-- MIGRATION V3: DYNAMIC REWARDS, 60% DUPLICATES FOR OURO, 5-PACK FOR TAGS
-- ----------------------------------------------------------------

-- Helper function to draw a random sticker from pool 21-100 with dynamic probabilities
create or replace function public.get_random_pool_sticker(user_id_param uuid)
returns integer as $$
declare
  total_owned integer;
  force_repeat boolean;
  target_number integer;
begin
  select count(distinct sticker_number) into total_owned
  from public.user_stickers
  where user_id = user_id_param and copies > 0;

  if total_owned >= 66 then
    force_repeat := (random() < 0.60);
  else
    force_repeat := (random() < 0.40);
  end if;

  if force_repeat then
    target_number := floor(random() * 80) + 21;
  else
    select n into target_number
    from generate_series(21, 100) as n
    where not exists (
      select 1 from public.user_stickers us
      where us.user_id = user_id_param and us.sticker_number = n and us.copies > 0
    )
    order by random() limit 1;

    if target_number is null then
      target_number := floor(random() * 80) + 21;
    end if;
  end if;

  return target_number;
end;
$$ language plpgsql security definer;


-- Updated complete_mission to use the new random pool
create or replace function public.complete_mission(mission_id_param text)
returns jsonb as $$
declare
  user_id_param uuid;
  target_sticker integer;
  was_new boolean;
  reveals jsonb := '[]'::jsonb;
  progression_reveals jsonb;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  if exists (
    select 1 from public.mission_completions
    where user_id = user_id_param and mission_id = mission_id_param
  ) then
    raise exception 'Você já concluiu esta missão!';
  end if;

  if mission_id_param not in ('whatsapp', 'x', 'instagram', 'tiktok', 'copy-link') then
    raise exception 'Missão inválida';
  end if;

  insert into public.mission_completions (user_id, mission_id)
  values (user_id_param, mission_id_param);

  target_sticker := public.get_random_pool_sticker(user_id_param);

  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (user_id_param, target_sticker, 1, false, now())
  on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
  returning (copies = 1) into was_new;

  reveals := reveals || jsonb_build_object(
    'slug', 'random-' || target_sticker::text,
    'number', target_sticker,
    'wasNew', was_new,
    'isRare', false,
    'repeat', not was_new,
    'reward', 'mission_' || mission_id_param
  );

  progression_reveals := public.check_and_grant_rewards(user_id_param);
  reveals := reveals || progression_reveals;

  return jsonb_build_object('success', true, 'reveals', reveals);
end;
$$ language plpgsql security definer;


-- Updated redeem_code to draw 5 stickers from random pool instead of code-specific pools
create or replace function public.redeem_code(code_param text)
returns jsonb as $$
declare
  user_id_param uuid;
  code_clean text;
  code_row record;
  reveals jsonb := '[]'::jsonb;
  draw_idx integer;
  target_number integer;
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

  select * into code_row from public.redeem_codes where code = code_clean and active = true;
  if not found then
    raise exception 'Código inválido.';
  end if;

  select value into release_date_str from public.app_settings where key = 'release_date';
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

  insert into public.reward_grants (user_id, reward_key) values (user_id_param, 'code_' || code_clean);

  for draw_idx in 1 .. 5 loop
    target_number := public.get_random_pool_sticker(user_id_param);

    insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    values (user_id_param, target_number, 1, false, now())
    on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
    returning (copies = 1) into was_new;

    reveals := reveals || jsonb_build_object(
      'slug', 'random-' || target_number::text,
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
$$ language plpgsql security definer;


-- Updated check_and_grant_rewards to grant 5-sticker pack for Tag completion
create or replace function public.check_and_grant_rewards(user_id_param uuid)
returns jsonb as $$
declare
  reveals jsonb := '[]'::jsonb;
  granted_in_loop boolean := true;
  total_count integer;
  target_number integer;
  was_new boolean;
  reward_item jsonb;
  i integer;
begin
  while granted_in_loop loop
    granted_in_loop := false;

    select count(*) into total_count
    from public.user_stickers us
    where us.user_id = user_id_param and us.copies > 0;

    -- 1. Total 100 -> Poster Reward
    if total_count >= 100 and not exists (select 1 from public.reward_grants where user_id = user_id_param and reward_key = 'poster') then
      insert into public.reward_grants (user_id, reward_key) values (user_id_param, 'poster');
      
      reward_item := jsonb_build_object(
        'slug', '__poster',
        'number', 0,
        'wasNew', false,
        'isRare', false,
        'repeat', false,
        'reward', 'poster'
      );
      reveals := reveals || reward_item;
      granted_in_loop := true;

    -- 2. Baldaverso (1, 53, 54)
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Baldaverso')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 1 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 53 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 54 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'Baldaverso');
      
      for i in 1 .. 5 loop
        target_number := public.get_random_pool_sticker(user_id_param);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        
        reveals := reveals || jsonb_build_object('slug', 'random-' || target_number::text, 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', case when i = 1 then 'tag_Baldaverso' else null end);
      end loop;
      granted_in_loop := true;

    -- 3. Frutaverso (5, 59, 60)
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Frutaverso')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 5 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 59 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 60 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'Frutaverso');
      
      for i in 1 .. 5 loop
        target_number := public.get_random_pool_sticker(user_id_param);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        
        reveals := reveals || jsonb_build_object('slug', 'random-' || target_number::text, 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', case when i = 1 then 'tag_Frutaverso' else null end);
      end loop;
      granted_in_loop := true;

    -- 4. Bright Falls (22, 51, 52)
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Bright Falls')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 22 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 51 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 52 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'Bright Falls');
      
      for i in 1 .. 5 loop
        target_number := public.get_random_pool_sticker(user_id_param);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        
        reveals := reveals || jsonb_build_object('slug', 'random-' || target_number::text, 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', case when i = 1 then 'tag_Bright Falls' else null end);
      end loop;
      granted_in_loop := true;

    -- 5. HQ (84, 85, 88)
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'HQ')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 84 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 85 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 88 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'HQ');
      
      for i in 1 .. 5 loop
        target_number := public.get_random_pool_sticker(user_id_param);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        
        reveals := reveals || jsonb_build_object('slug', 'random-' || target_number::text, 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', case when i = 1 then 'tag_HQ' else null end);
      end loop;
      granted_in_loop := true;

    -- 6. Opostos Co. (19, 73, 74)
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Opostos Co.')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 19 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 73 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 74 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'Opostos Co.');
      
      for i in 1 .. 5 loop
        target_number := public.get_random_pool_sticker(user_id_param);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        
        reveals := reveals || jsonb_build_object('slug', 'random-' || target_number::text, 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', case when i = 1 then 'tag_Opostos Co.' else null end);
      end loop;
      granted_in_loop := true;

    -- 7. Universo de Fogo (10, 48, 49)
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Universo de Fogo')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 10 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 48 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 49 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'Universo de Fogo');
      
      for i in 1 .. 5 loop
        target_number := public.get_random_pool_sticker(user_id_param);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        
        reveals := reveals || jsonb_build_object('slug', 'random-' || target_number::text, 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', case when i = 1 then 'tag_Universo de Fogo' else null end);
      end loop;
      granted_in_loop := true;

    end if;
  end loop;

  return reveals;
end;
$$ language plpgsql security definer;
