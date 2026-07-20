-- Redefine check_and_grant_rewards to include the new reward for completing stickers 1 to 193
create or replace function public.check_and_grant_rewards(user_id_param uuid)
returns jsonb as $$
declare
  reveals jsonb := '[]'::jsonb;
  granted_in_loop boolean := true;
  total_count integer;
  count_1_193 integer;
begin
  while granted_in_loop loop
    granted_in_loop := false;

    -- Count total owned stickers
    select count(*) into total_count
    from public.user_stickers us
    where us.user_id = user_id_param and us.copies > 0;

    -- Count distinct stickers between 1 and 193
    select count(distinct sticker_number) into count_1_193
    from public.user_stickers us
    where us.user_id = user_id_param and us.sticker_number between 1 and 193 and us.copies > 0;

    -- 0. Coleção 1 a 193 -> Sticker Extra 361
    if count_1_193 >= 193 and not exists (select 1 from public.reward_grants where user_id = user_id_param and reward_key = 'collection_1_193') then
      insert into public.reward_grants (user_id, reward_key) values (user_id_param, 'collection_1_193');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 361, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1;

      reveals := reveals || jsonb_build_object(
        'slug', 'extra',
        'number', 361,
        'wasNew', true,
        'isRare', false,
        'repeat', false,
        'reward', 'collection_1_193',
        'rewardMessage', 'Parabéns! Você completou as figurinhas de 1 a 193 e desbloqueou uma figurinha extra secreta de agradecimento!'
      );
      granted_in_loop := true;

    -- 1. Total 100 -> Poster Reward (Granted automatically/immediately)
    elsif total_count >= 100 and not exists (select 1 from public.reward_grants where user_id = user_id_param and reward_key = 'poster') then
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
