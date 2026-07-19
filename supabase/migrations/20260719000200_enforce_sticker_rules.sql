-- 1. Redeclares draw_non_quiz_sticker with range 21-193 and threshold 86
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
    and us.sticker_number between 21 and 193;

  -- 86 is ~50% of the 173 unique non-quiz sorteio stickers (21 to 193)
  repeat_chance := case when owned_count >= 86 then 0.47 else 0.40 end;
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
$$ language plpgsql;

-- 2. Redefines check_and_grant_rewards to draw from array(select generate_series(21, 193))
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
        available_pool := public.pack_available_pool(array(select generate_series(21, 193)), package_numbers);
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
        available_pool := public.pack_available_pool(array(select generate_series(21, 193)), package_numbers);
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
        available_pool := public.pack_available_pool(array(select generate_series(21, 193)), package_numbers);
        target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
        package_numbers := array_append(package_numbers, target_number);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        reveals := reveals || jsonb_build_object('slug', 'extra', 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Bright Falls');
      end loop;

      granted_in_loop := true;

    -- 5. HQ (41, 42, 43) -> Sticker 94
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'HQ')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 41 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 42 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 43 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'HQ');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 94, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
      returning (copies = 1) into was_new;

      reveals := reveals || jsonb_build_object('slug', 'frases-4', 'number', 94, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_HQ');
      package_numbers := array[94];
       
      -- Add 4 random stickers for the pack
      for i in 1..4 loop
        available_pool := public.pack_available_pool(array(select generate_series(21, 193)), package_numbers);
        target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
        package_numbers := array_append(package_numbers, target_number);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        reveals := reveals || jsonb_build_object('slug', 'extra', 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_HQ');
      end loop;

      granted_in_loop := true;

    -- 6. Opostos Co. (19, 75, 76) -> Sticker 95
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Opostos Co.')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 19 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 75 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 76 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'Opostos Co.');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 95, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
      returning (copies = 1) into was_new;

      reveals := reveals || jsonb_build_object('slug', 'frases-5', 'number', 95, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Opostos Co.');
      package_numbers := array[95];
       
      -- Add 4 random stickers for the pack
      for i in 1..4 loop
        available_pool := public.pack_available_pool(array(select generate_series(21, 193)), package_numbers);
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
$$ language plpgsql;

-- 3. Redefines lookup_user_by_nick with 21-193 range for free, and 194-319 range for shop
CREATE OR REPLACE FUNCTION public.lookup_user_by_nick(nick_param TEXT)
RETURNS JSONB AS $$
DECLARE
  target_profile RECORD;
  free_dupes     JSONB;
  shop_dupes     JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT p.id, p.nick, p.avatar_emoji, p.avatar_url
  INTO target_profile
  FROM public.profiles p
  WHERE lower(p.nick) = lower(trim(nick_param))
    AND p.id <> auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuária não encontrada. Verifique o nome de usuário.';
  END IF;

  -- Free duplicates: stickers 21-193 with copies > 1
  SELECT jsonb_agg(
    jsonb_build_object(
      'sticker_number', us.sticker_number,
      'copies', us.copies,
      'name', COALESCE(s.name, '#' || us.sticker_number::text)
    ) ORDER BY us.sticker_number
  )
  INTO free_dupes
  FROM public.user_stickers us
  LEFT JOIN public.stickers s ON s.number = us.sticker_number
  WHERE us.user_id = target_profile.id
    AND us.sticker_number BETWEEN 21 AND 193
    AND us.copies > 1;

  -- Shop duplicates: stickers 194-319 with copies > 1
  SELECT jsonb_agg(
    jsonb_build_object(
      'sticker_number', us.sticker_number,
      'copies', us.copies,
      'name', COALESCE(s.name, 'Figurinha #' || us.sticker_number::text)
    ) ORDER BY us.sticker_number
  )
  INTO shop_dupes
  FROM public.user_stickers us
  LEFT JOIN public.stickers s ON s.number = us.sticker_number
  WHERE us.user_id = target_profile.id
    AND us.sticker_number BETWEEN 194 AND 319
    AND us.copies > 1;

  RETURN jsonb_build_object(
    'user_id',      target_profile.id,
    'nick',         target_profile.nick,
    'avatar_emoji', target_profile.avatar_emoji,
    'avatar_url',   target_profile.avatar_url,
    'free_dupes',   COALESCE(free_dupes, '[]'::jsonb),
    'shop_dupes',   COALESCE(shop_dupes, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Redefines create_trade_request with new validation bounds and rare/exclusive exclusion
CREATE OR REPLACE FUNCTION public.create_trade_request(
  receiver_nick_param   TEXT,
  my_sticker_param      INTEGER,
  desired_sticker_param INTEGER,
  category_param        TEXT
)
RETURNS JSONB AS $$
DECLARE
  caller_id        UUID;
  receiver_id_val  UUID;
  caller_copies    INTEGER;
  receiver_copies  INTEGER;
  open_count       INTEGER;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF category_param NOT IN ('free', 'shop') THEN
    RAISE EXCEPTION 'Categoria inválida.';
  END IF;

  -- Prevent rare (1 to 20) and exclusive (320 to 360) stickers from trades
  IF my_sticker_param BETWEEN 1 AND 20 OR my_sticker_param BETWEEN 320 AND 360
     OR desired_sticker_param BETWEEN 1 AND 20 OR desired_sticker_param BETWEEN 320 AND 360 THEN
    RAISE EXCEPTION 'Figurinhas raras ou exclusivas não podem ser trocadas.';
  END IF;

  -- Validate sticker ranges match category (21-193 for free/sorteio, 194-319 for shop/loja)
  IF category_param = 'free' THEN
    IF my_sticker_param NOT BETWEEN 21 AND 193
       OR desired_sticker_param NOT BETWEEN 21 AND 193 THEN
      RAISE EXCEPTION 'Figurinhas de sorteio devem ser entre 21 e 193.';
    END IF;
  ELSE
    IF my_sticker_param NOT BETWEEN 194 AND 319
       OR desired_sticker_param NOT BETWEEN 194 AND 319 THEN
      RAISE EXCEPTION 'Figurinhas de loja devem ser entre 194 e 319.';
    END IF;
  END IF;

  IF my_sticker_param = desired_sticker_param THEN
    RAISE EXCEPTION 'Você não pode trocar uma figurinha pela mesma.';
  END IF;

  SELECT id INTO receiver_id_val
  FROM public.profiles
  WHERE lower(nick) = lower(trim(receiver_nick_param))
    AND id <> caller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuária não encontrada.';
  END IF;

  SELECT copies INTO caller_copies
  FROM public.user_stickers
  WHERE user_id = caller_id AND sticker_number = my_sticker_param;

  IF caller_copies IS NULL OR caller_copies < 2 THEN
    RAISE EXCEPTION 'Você não tem essa figurinha como repetida.';
  END IF;

  SELECT copies INTO receiver_copies
  FROM public.user_stickers
  WHERE user_id = receiver_id_val AND sticker_number = desired_sticker_param;

  IF receiver_copies IS NULL OR receiver_copies < 2 THEN
    RAISE EXCEPTION 'A outra usuária não tem essa figurinha como repetida.';
  END IF;

  SELECT COUNT(*) INTO open_count
  FROM public.trade_requests
  WHERE initiator_id = caller_id AND status = 'pending';

  IF open_count >= 5 THEN
    RAISE EXCEPTION 'Você já tem 5 trocas pendentes. Aguarde a resposta ou cancele uma.';
  END IF;

  INSERT INTO public.trade_requests (
    initiator_id, receiver_id,
    initiator_sticker, receiver_sticker,
    sticker_category
  ) VALUES (
    caller_id, receiver_id_val,
    my_sticker_param, desired_sticker_param,
    category_param
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Redefines exchange_for_points with new shop range
CREATE OR REPLACE FUNCTION public.exchange_for_points(sticker_number_param INTEGER)
RETURNS JSONB AS $$
DECLARE
  caller_id UUID;
  current_copies INTEGER;
  new_balance INTEGER;
  POINTS_PER_STICKER CONSTANT INTEGER := 45;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF sticker_number_param NOT BETWEEN 194 AND 319 THEN
    RAISE EXCEPTION 'Apenas figurinhas de loja (194-319) podem ser trocadas por pontos.';
  END IF;

  SELECT copies INTO current_copies
  FROM public.user_stickers
  WHERE user_id = caller_id AND sticker_number = sticker_number_param
  FOR UPDATE;

  IF current_copies IS NULL OR current_copies < 2 THEN
    RAISE EXCEPTION 'Você não tem esta figurinha como repetida.';
  END IF;

  UPDATE public.user_stickers
  SET copies = copies - 1
  WHERE user_id = caller_id AND sticker_number = sticker_number_param;

  PERFORM public.ensure_user_points(caller_id);

  UPDATE public.user_points
  SET balance = balance + POINTS_PER_STICKER, updated_at = now()
  WHERE user_id = caller_id
  RETURNING balance INTO new_balance;

  INSERT INTO public.point_transactions (user_id, amount, reason, sticker_number)
  VALUES (caller_id, POINTS_PER_STICKER, 'trade_sell', sticker_number_param);

  RETURN jsonb_build_object(
    'success', true,
    'points_earned', POINTS_PER_STICKER,
    'new_balance', new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to prevent duplicate rare and exclusive stickers
CREATE OR REPLACE FUNCTION public.enforce_no_duplicate_rare_or_exclusive()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_rare = true 
     OR NEW.sticker_number BETWEEN 1 AND 20 
     OR NEW.sticker_number BETWEEN 320 AND 360 THEN
    IF NEW.copies > 1 THEN
      NEW.copies := 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_no_duplicate_rare_or_exclusive_trg ON public.user_stickers;
CREATE TRIGGER enforce_no_duplicate_rare_or_exclusive_trg
BEFORE INSERT OR UPDATE ON public.user_stickers
FOR EACH ROW
EXECUTE FUNCTION public.enforce_no_duplicate_rare_or_exclusive();
