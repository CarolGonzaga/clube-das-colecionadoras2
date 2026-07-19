-- Add claimed and claimed_at columns to completed_tags table
alter table public.completed_tags add column if not exists claimed boolean default false;
alter table public.completed_tags add column if not exists claimed_at timestamp with time zone;

-- Redefine check_and_grant_rewards to NOT grant stickers immediately,
-- but only record the completion and return tag completion info for client notification.
create or replace function public.check_and_grant_rewards(user_id_param uuid)
returns jsonb as $$
declare
  reveals jsonb := '[]'::jsonb;
  granted_in_loop boolean := true;
  total_count integer;
begin
  while granted_in_loop loop
    granted_in_loop := false;

    -- Count total owned stickers
    select count(*) into total_count
    from public.user_stickers us
    where us.user_id = user_id_param and us.copies > 0;

    -- 1. Total 100 -> Poster Reward (Granted automatically/immediately)
    if total_count >= 100 and not exists (select 1 from public.reward_grants where user_id = user_id_param and reward_key = 'poster') then
      insert into public.reward_grants (user_id, reward_key) values (user_id_param, 'poster');
      reveals := reveals || jsonb_build_object(
        'slug', 'album-completo',
        'number', 360,
        'wasNew', true,
        'isRare', true,
        'repeat', false,
        'reward', 'poster'
      );
      granted_in_loop := true;

    -- 2. Baldaverso (1, 53, 54)
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Baldaverso')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 1 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 53 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 54 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name, claimed) values (user_id_param, 'Baldaverso', false);
      reveals := reveals || jsonb_build_object(
        'slug', 'baldaverso',
        'number', 1,
        'wasNew', false,
        'isRare', false,
        'repeat', true,
        'reward', 'tag_Baldaverso',
        'rewardMessage', 'Parabéns! Você completou o kit Baldaverso e tem um prêmio acumulado para resgatar!'
      );
      granted_in_loop := true;

    -- 3. Frutaverso (5, 59, 60)
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Frutaverso')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 5 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 59 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 60 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name, claimed) values (user_id_param, 'Frutaverso', false);
      reveals := reveals || jsonb_build_object(
        'slug', 'frutaverso',
        'number', 5,
        'wasNew', false,
        'isRare', false,
        'repeat', true,
        'reward', 'tag_Frutaverso',
        'rewardMessage', 'Parabéns! Você completou a saga Frutaverso e tem um prêmio acumulado para resgatar!'
      );
      granted_in_loop := true;

    -- 4. Bright Falls (22, 51, 52)
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Bright Falls')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 22 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 51 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 52 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name, claimed) values (user_id_param, 'Bright Falls', false);
      reveals := reveals || jsonb_build_object(
        'slug', 'brightfalls',
        'number', 22,
        'wasNew', false,
        'isRare', false,
        'repeat', true,
        'reward', 'tag_Bright Falls',
        'rewardMessage', 'Parabéns! Você completou a saga Bright Falls e tem um prêmio acumulado para resgatar!'
      );
      granted_in_loop := true;

    -- 5. HQ (41, 42, 43)
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'HQ')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 41 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 42 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 43 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name, claimed) values (user_id_param, 'HQ', false);
      reveals := reveals || jsonb_build_object(
        'slug', 'hq',
        'number', 41,
        'wasNew', false,
        'isRare', false,
        'repeat', true,
        'reward', 'tag_HQ',
        'rewardMessage', 'Parabéns! Você completou a saga HQ e tem um prêmio acumulado para resgatar!'
      );
      granted_in_loop := true;

    -- 6. Opostos Co. (19, 75, 76)
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Opostos Co.')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 19 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 75 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 76 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name, claimed) values (user_id_param, 'Opostos Co.', false);
      reveals := reveals || jsonb_build_object(
        'slug', 'opostosco',
        'number', 19,
        'wasNew', false,
        'isRare', false,
        'repeat', true,
        'reward', 'tag_Opostos Co.',
        'rewardMessage', 'Parabéns! Você completou a saga Opostos Co. e tem um prêmio acumulado para resgatar!'
      );
      granted_in_loop := true;
    end if;
  end loop;

  return reveals;
end;
$$ language plpgsql;

-- Define claim_collection_reward function to let users claim their completed family rewards manually.
create or replace function public.claim_collection_reward(tag_name_param text)
returns jsonb as $$
declare
  caller_id uuid;
  tag_rec record;
  target_number integer;
  main_sticker_num integer;
  main_sticker_slug text;
  was_new boolean;
  package_numbers integer[];
  available_pool integer[];
  reveals jsonb := '[]'::jsonb;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Unauthorized';
  end if;

  select * into tag_rec
  from public.completed_tags
  where user_id = caller_id and tag_name = tag_name_param;

  if not found then
    raise exception 'Você ainda não completou essa coleção.';
  end if;

  if tag_rec.claimed = true then
    raise exception 'Prêmio já resgatado para essa coleção.';
  end if;

  -- Map main reward sticker based on collection tag
  case tag_name_param
    when 'Baldaverso' then
      main_sticker_num := 91;
      main_sticker_slug := 'frases-1';
    when 'Frutaverso' then
      main_sticker_num := 92;
      main_sticker_slug := 'frases-2';
    when 'Bright Falls' then
      main_sticker_num := 93;
      main_sticker_slug := 'frases-3';
    when 'HQ' then
      main_sticker_num := 94;
      main_sticker_slug := 'frases-4';
    when 'Opostos Co.' then
      main_sticker_num := 95;
      main_sticker_slug := 'frases-5';
    else
      raise exception 'Coleção inválida.';
  end case;

  -- Update claimed status
  update public.completed_tags
  set claimed = true, claimed_at = now()
  where user_id = caller_id and tag_name = tag_name_param;

  -- 1. Grant the main reward sticker
  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (caller_id, main_sticker_num, 1, false, now())
  on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
  returning (copies = 1) into was_new;

  reveals := reveals || jsonb_build_object(
    'slug', main_sticker_slug,
    'number', main_sticker_num,
    'wasNew', was_new,
    'isRare', false,
    'repeat', not was_new
  );
  package_numbers := array[main_sticker_num];

  -- 2. Add 4 random stickers from the sorteio pool (21-193)
  for i in 1..4 loop
    available_pool := public.pack_available_pool(array(select generate_series(21, 193)), package_numbers);
    target_number := public.draw_non_quiz_sticker(caller_id, available_pool);
    package_numbers := array_append(package_numbers, target_number);

    insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    values (caller_id, target_number, 1, false, now())
    on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
    returning (copies = 1) into was_new;

    reveals := reveals || jsonb_build_object(
      'slug', 'extra-' || i,
      'number', target_number,
      'wasNew', was_new,
      'isRare', false,
      'repeat', not was_new
    );
  end loop;

  return reveals;
end;
$$ language plpgsql security definer;
