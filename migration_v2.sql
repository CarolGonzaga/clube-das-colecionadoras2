-- INCREMENTAL MIGRATION FOR NEW SPECIFICATIONS
-- Execute this in your Supabase SQL Editor to update your database schema.

-- 1. Create App Settings table
create table if not exists public.app_settings (
  key text primary key,
  value text
);

-- 2. Initialize default release date
insert into public.app_settings (key, value) values ('release_date', '2026-07-02') on conflict (key) do nothing;

-- 3. Add release_day column to redeem_codes
alter table public.redeem_codes add column if not exists release_day integer not null default 1;

-- 4. Update check_and_grant_rewards function
create or replace function public.check_and_grant_rewards(user_id_param uuid)
returns jsonb as $$
declare
  reveals jsonb := '[]'::jsonb;
  granted_in_loop boolean := true;
  total_count integer;
  was_new boolean;
  reward_item jsonb;
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
      granted_in_loop := true;

    -- 5. HQ (84, 85, 88) -> Sticker 94
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'HQ')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 84 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 85 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 88 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'HQ');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 94, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
      returning (copies = 1) into was_new;

      reveals := reveals || jsonb_build_object('slug', 'frases-4', 'number', 94, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_HQ');
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
      granted_in_loop := true;
    end if;

  end loop;

  return reveals;
end;
$$ language plpgsql security definer;

-- 5. Update redeem_code function
create or replace function public.redeem_code(code_param text)
returns jsonb as $$
declare
  user_id_param uuid;
  code_clean text;
  code_row record;
  pool_numbers integer[];
  reveals jsonb := '[]'::jsonb;
  draw_idx integer;
  force_repeat boolean;
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
    raise exception 'Código inválido.';
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
    raise exception 'Este código promocional ainda não está ativo! Será liberado no dia % do lançamento.', code_row.release_day;
  end if;

  -- Ensure user hasn't redeemed this code before
  if exists (
    select 1 from public.reward_grants
    where user_id = user_id_param and reward_key = 'code_' || code_clean
  ) then
    raise exception 'Você já usou esse código.';
  end if;

  -- Get code sticker pool
  select array_agg(sticker_number) into pool_numbers
  from public.redeem_pools
  where code = code_clean;

  if pool_numbers is null or array_length(pool_numbers, 1) = 0 then
    raise exception 'Pool do código vazia.';
  end if;

  -- Mark code as redeemed for this user
  insert into public.reward_grants (user_id, reward_key) values (user_id_param, 'code_' || code_clean);

  -- Perform 5 random sticker draws
  for draw_idx in 1 .. 5 loop
    force_repeat := (random() < 0.40);

    if force_repeat then
      -- Draw randomly from full pool
      target_number := pool_numbers[floor(random() * array_length(pool_numbers, 1) + 1)];
    else
      -- Prioritize unowned stickers from the pool
      select sticker_number into target_number
      from unnest(pool_numbers) as pool(sticker_number)
      where not exists (
        select 1 from public.user_stickers us 
        where us.user_id = user_id_param and us.sticker_number = pool.sticker_number and us.copies > 0
      )
      order by random() limit 1;

      -- If all owned, fallback to any from pool
      if target_number is null then
        target_number := pool_numbers[floor(random() * array_length(pool_numbers, 1) + 1)];
      end if;
    end if;

    -- Get sticker details
    select 
      case target_number
        when 1 then 'amor-fati' when 2 then 'cupidos-nao-se-apaixonam' when 3 then 'eu-minha-crush-e-minha-irma'
        when 4 then 'liz-flores-e-uma-farsa' when 5 then 'segundo-cliche' when 6 then 'desejos-ocultos-das-violetas'
        when 7 then 'o-casamento' when 8 then 'como-não-se-apaixonar' when 9 then 'nossa-primeira-chance'
        when 10 then 'não-te-odeio' when 11 then 'para-onde-vão-as-borboletas' when 12 then 'apenas-um-garoto'
        when 13 then 'cartas-para-julieta' when 14 then 'uma-colega-de-quarto' when 15 then 'a-promessa'
        when 16 then 'destinados' when 17 then 'o-canto-das-sereias' when 18 then 'um-acordo-inesperado'
        when 19 then 'coração-de-vidro' when 20 then 'efeito-borboleta'
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
$$ language plpgsql security definer;

-- 6. Update complete_mission function
create or replace function public.complete_mission(mission_id_param text)
returns jsonb as $$
declare
  user_id_param uuid;
  target_sticker integer;
  target_slug text;
  was_new boolean;
  reveals jsonb := '[]'::jsonb;
  progression_reveals jsonb;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  -- Prevent duplicate missions completions
  if exists (
    select 1 from public.mission_completions
    where user_id = user_id_param and mission_id = mission_id_param
  ) then
    raise exception 'Você já concluiu esta missão!';
  end if;

  -- Map click missions to specific stickers
  if mission_id_param = 'whatsapp' then
    target_sticker := 96;
    target_slug := 'ls-1';
  elsif mission_id_param = 'x' then
    target_sticker := 97;
    target_slug := 'ls-2';
  elsif mission_id_param = 'instagram' then
    target_sticker := 98;
    target_slug := 'ls-3';
  elsif mission_id_param = 'tiktok' then
    target_sticker := 99;
    target_slug := 'ls-4';
  elsif mission_id_param = 'copy-link' then
    target_sticker := 100;
    target_slug := 'ls-5';
  else
    raise exception 'Missão inválida';
  end if;

  -- Insert completion
  insert into public.mission_completions (user_id, mission_id)
  values (user_id_param, mission_id_param);

  -- Insert sticker
  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (user_id_param, target_sticker, 1, false, now())
  on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
  returning (copies = 1) into was_new;

  reveals := reveals || jsonb_build_object(
    'slug', target_slug,
    'number', target_sticker,
    'wasNew', was_new,
    'isRare', false,
    'repeat', not was_new,
    'reward', 'mission_' || mission_id_param
  );

  -- Check progression achievements (like total album completions)
  progression_reveals := public.check_and_grant_rewards(user_id_param);
  reveals := reveals || progression_reveals;

  return jsonb_build_object('success', true, 'reveals', reveals);
end;
$$ language plpgsql security definer;

-- 6. Fix "is_rare is ambiguous" bug in answer_quiz function
-- (renames the local variable 'is_rare' to 'new_is_rare' to avoid clash with table column)
create or replace function public.answer_quiz(
  sticker_number_param integer,
  q_index_param integer,
  chosen_index_param integer
)
returns jsonb as $$
declare
  user_id_param uuid;
  current_day text;
  attempt_count integer;
  correct_idx_val integer;
  is_correct boolean;
  new_is_rare boolean;
  was_new boolean;
  final_is_rare boolean;
  reveals jsonb := '[]'::jsonb;
  reveal_item jsonb;
  new_errors integer;
  target_slug text;
  progression_reveals jsonb;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  -- Derive session current_day directly from public.quiz_attempts (ensures 100% hash shuffle consistency)
  select ultimo_dia_acesso, tentativas_hoje_count
  into current_day, attempt_count
  from public.quiz_attempts
  where user_id = user_id_param;

  if current_day is null then
    current_day := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD');
    attempt_count := 0;
  end if;

  if attempt_count >= 4 then
    raise exception 'Você já esgotou suas 4 tentativas de hoje! Volte amanhã ⏳';
  end if;

  -- Verify if question is in today's pending session
  if not exists (
    select 1 from public.quiz_attempts
    where user_id = user_id_param and sticker_number_param = any(perguntas_pendentes)
  ) then
    raise exception 'Esta pergunta não está disponível para ser respondida hoje.';
  end if;

  -- Check if already answered in this session
  if exists (
    select 1 from public.quiz_answers
    where user_id = user_id_param and sticker_number = sticker_number_param and q_index = q_index_param
  ) then
    raise exception 'Você já respondeu a esta pergunta hoje.';
  end if;

  -- Retrieve correct index from secure quiz_questions table
  select correct_index into correct_idx_val
  from public.quiz_questions
  where sticker_number = sticker_number_param and q_index = q_index_param;

  if correct_idx_val is null then
    raise exception 'Pergunta não encontrada.';
  end if;

  -- Apply same deterministic shuffle as get_quiz_questions_for_today
  -- to find what shuffled position the correct answer now occupies.
  declare
    h integer;
    perm0 integer; perm1 integer; perm2 integer; perm3 integer;
    tmp_int integer;
    shuffled_correct_index integer;
  begin
    h := abs(hashtext(user_id_param::text || sticker_number_param::text || current_day));
    perm0 := 0; perm1 := 1; perm2 := 2; perm3 := 3;

    case (h % 4)
      when 0 then tmp_int := perm0; perm0 := perm3; perm3 := tmp_int;
      when 1 then tmp_int := perm1; perm1 := perm3; perm3 := tmp_int;
      when 2 then tmp_int := perm2; perm2 := perm3; perm3 := tmp_int;
      else null;
    end case;
    h := h / 4;
    case (h % 3)
      when 0 then tmp_int := perm0; perm0 := perm2; perm2 := tmp_int;
      when 1 then tmp_int := perm1; perm1 := perm2; perm2 := tmp_int;
      else null;
    end case;
    h := h / 3;
    if (h % 2) = 0 then
      tmp_int := perm0; perm0 := perm1; perm1 := tmp_int;
    end if;

    -- Find the shuffled position of the original correct answer
    if perm0 = correct_idx_val then shuffled_correct_index := 0;
    elsif perm1 = correct_idx_val then shuffled_correct_index := 1;
    elsif perm2 = correct_idx_val then shuffled_correct_index := 2;
    else shuffled_correct_index := 3;
    end if;

    -- Compare chosen index against the shuffled position of the correct answer
    is_correct := (chosen_index_param <> -1 and chosen_index_param = shuffled_correct_index);
  end;

  -- Update attempts count
  update public.quiz_attempts
  set tentativas_hoje_count = tentativas_hoje_count + 1
  where user_id = user_id_param;

  -- Record user answer
  insert into public.quiz_answers (user_id, sticker_number, q_index, chosen_index, correct)
  values (user_id_param, sticker_number_param, q_index_param, chosen_index_param, is_correct);

  select 
    case sticker_number_param
      when 1 then 'amor-fati' when 2 then 'cupidos-nao-se-apaixonam' when 3 then 'eu-minha-crush-e-minha-irma'
      when 4 then 'liz-flores-e-uma-farsa' when 5 then 'segundo-cliche' when 6 then 'desejos-ocultos-das-violetas'
      when 7 then 'o-casamento' when 8 then 'como-não-se-apaixonar' when 9 then 'nossa-primeira-chance'
      when 10 then 'não-te-odeio' when 11 then 'para-onde-vão-as-borboletas' when 12 then 'apenas-um-garoto'
      when 13 then 'cartas-para-julieta' when 14 then 'uma-colega-de-quarto' when 15 then 'a-promessa'
      when 16 then 'destinados' when 17 then 'o-canto-das-sereias' when 18 then 'um-acordo-inesperado'
      when 19 then 'coração-de-vidro' when 20 then 'efeito-borboleta'
      else 'slug'
    end into target_slug;

  if is_correct then
    -- Roll for 5% chance of Rare
    new_is_rare := (random() < 0.05);

    -- Grant sticker in inventory (new_is_rare avoids ambiguity with column name)
    insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    values (user_id_param, sticker_number_param, 1, new_is_rare, now())
    on conflict (user_id, sticker_number) do update set 
      copies = public.user_stickers.copies + 1,
      is_rare = public.user_stickers.is_rare or new_is_rare
    returning public.user_stickers.is_rare, (copies = 1) into final_is_rare, was_new;

    reveal_item := jsonb_build_object(
      'slug', target_slug,
      'number', sticker_number_param,
      'wasNew', was_new,
      'isRare', new_is_rare,
      'repeat', false,
      'reward', null
    );
    reveals := reveals || reveal_item;

    -- Trigger Milestone check
    progression_reveals := public.check_and_grant_rewards(user_id_param);
    reveals := reveals || progression_reveals;

    return jsonb_build_object(
      'correct', true,
      'reveals', reveals
    );
  else
    -- Wrong answer: count total errors for this sticker
    select count(*) into new_errors
    from public.quiz_answers
    where user_id = user_id_param and sticker_number = sticker_number_param and correct = false;

    return jsonb_build_object(
      'correct', false,
      'errors', new_errors
    );
  end if;
end;
$$ language plpgsql security definer;

-- 7. Shuffle quiz question order and answer options
-- Questions are now drawn randomly (not 1,2,3...) and answer options are
-- shuffled deterministically per user+sticker+day so correct answer isn't always option A.
create or replace function public.get_quiz_questions_for_today()
returns jsonb as $$
declare
  user_id_param uuid;
  current_day text;
  attempt_row public.quiz_attempts%rowtype;
  new_dia_atual integer;
  erradas_ids integer[];
  novas_ids integer[];
  final_pool integer[];
  q_item jsonb;
  questions_list jsonb := '[]'::jsonb;
  temp_sticker_number integer;
  temp_slug text;
  temp_name text;
  temp_author text;
  temp_q_index integer;
  temp_text text;
  temp_options text[];
  temp_correct_index integer;
  temp_errors integer;
  temp_answered boolean;
  temp_correct boolean;
  temp_chosen_index integer;
  temp_hide_indices integer[];
  temp_correct_index_return integer;
  i integer;
  correct_count integer;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  if not exists (select 1 from public.profiles where id = user_id_param) then
    insert into public.profiles (id, nick, avatar_emoji, mural_opt_in)
    values (user_id_param, 'Colecionadora', '🌸', false);
  end if;

  current_day := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD');

  select * into attempt_row from public.quiz_attempts where user_id = user_id_param;

  if not found then
    -- Generate initial pool of 4 stickers (shuffled randomly)
    select array_agg(sticker_number) into final_pool from (
      select number as sticker_number
      from (values 
        (1), (2), (3), (4), (5), (6), (7), (8), (9), (10),
        (11), (12), (13), (14), (15), (16), (17), (18), (19), (20)
      ) as all_q(number)
      where not exists (
        select 1 from public.user_stickers us where us.user_id = user_id_param and us.sticker_number = all_q.number and us.copies > 0
      )
      order by random() limit 4
    ) q;

    if final_pool is null then
      final_pool := '{}'::integer[];
    end if;

    insert into public.quiz_attempts (user_id, ultimo_dia_acesso, tentativas_hoje_count, dia_atual, perguntas_pendentes)
    values (user_id_param, current_day, 0, 0, final_pool)
    returning * into attempt_row;
    
  elsif attempt_row.ultimo_dia_acesso <> current_day then
    new_dia_atual := attempt_row.dia_atual + 1;
    
    select array_agg(distinct sticker_number) into erradas_ids from (
      select qa.sticker_number
      from public.quiz_answers qa
      where qa.user_id = user_id_param 
        and qa.correct = false
        and not exists (
          select 1 from public.user_stickers us where us.user_id = user_id_param and us.sticker_number = qa.sticker_number and us.copies > 0
        )
      order by qa.sticker_number asc
    ) q;

    if erradas_ids is null then
      erradas_ids := '{}'::integer[];
    end if;

    -- New unanswered stickers (shuffled randomly)
    select array_agg(sticker_number) into novas_ids from (
      select number as sticker_number
      from (values 
        (1), (2), (3), (4), (5), (6), (7), (8), (9), (10),
        (11), (12), (13), (14), (15), (16), (17), (18), (19), (20)
      ) as all_q(number)
      where not exists (
        select 1 from public.user_stickers us where us.user_id = user_id_param and us.sticker_number = all_q.number and us.copies > 0
      )
      and not (all_q.number = any(erradas_ids))
      order by random()
    ) q;

    if novas_ids is null then
      novas_ids := '{}'::integer[];
    end if;

    final_pool := (erradas_ids || novas_ids)[1:4];

    update public.quiz_attempts
    set ultimo_dia_acesso = current_day,
        tentativas_hoje_count = 0,
        dia_atual = new_dia_atual,
        perguntas_pendentes = final_pool
    where user_id = user_id_param
    returning * into attempt_row;
  end if;

  if array_length(attempt_row.perguntas_pendentes, 1) > 0 then
    for i in 1 .. array_upper(attempt_row.perguntas_pendentes, 1) loop
      temp_sticker_number := attempt_row.perguntas_pendentes[i];
      
      temp_q_index := (temp_sticker_number + attempt_row.dia_atual) % 2;

      select text, options, correct_index into temp_text, temp_options, temp_correct_index
      from public.quiz_questions
      where sticker_number = temp_sticker_number and q_index = temp_q_index;

      if temp_text is null then
        continue;
      end if;

      -- Shuffle answer options using a deterministic permutation per (user, sticker, day)
      declare
        h integer;
        perm0 integer; perm1 integer; perm2 integer; perm3 integer;
        tmp_int integer;
        shuffled_options text[];
      begin
        h := abs(hashtext(user_id_param::text || temp_sticker_number::text || current_day));
        perm0 := 0; perm1 := 1; perm2 := 2; perm3 := 3;

        case (h % 4)
          when 0 then tmp_int := perm0; perm0 := perm3; perm3 := tmp_int;
          when 1 then tmp_int := perm1; perm1 := perm3; perm3 := tmp_int;
          when 2 then tmp_int := perm2; perm2 := perm3; perm3 := tmp_int;
          else null;
        end case;
        h := h / 4;
        case (h % 3)
          when 0 then tmp_int := perm0; perm0 := perm2; perm2 := tmp_int;
          when 1 then tmp_int := perm1; perm1 := perm2; perm2 := tmp_int;
          else null;
        end case;
        h := h / 3;
        if (h % 2) = 0 then
          tmp_int := perm0; perm0 := perm1; perm1 := tmp_int;
        end if;

        shuffled_options := array[
          temp_options[perm0 + 1],
          temp_options[perm1 + 1],
          temp_options[perm2 + 1],
          temp_options[perm3 + 1]
        ];

        if perm0 = temp_correct_index then temp_correct_index := 0;
        elsif perm1 = temp_correct_index then temp_correct_index := 1;
        elsif perm2 = temp_correct_index then temp_correct_index := 2;
        else temp_correct_index := 3;
        end if;

        temp_options := shuffled_options;
      end;

      select 
        case temp_sticker_number
          when 1 then 'Amor Fati' when 2 then 'Cupidos não se apaixonam' when 3 then 'Eu, minha crush e minha irmã'
          when 4 then 'Liz Flores é uma farsa' when 5 then 'Segundo Clichê (Frutaverso Livro 1)' when 6 then 'Desejos Ocultos das Violetas'
          when 7 then 'O Casamento' when 8 then 'Como (não) se apaixonar' when 9 then 'Nossa Primeira Chance'
          when 10 then 'Não te odeio' when 11 then 'Para onde vão as borboletas' when 12 then 'Apenas Um Garoto'
          when 13 then 'Cartas Para Julieta' when 14 then 'Uma Colega de Quarto' when 15 then 'A Promessa'
          when 16 then 'Destinados' when 17 then 'O Canto das Sereias' when 18 then 'Um Acordo Inesperado'
          when 19 then 'Coração de Vidro' when 20 then 'Efeito Borboleta'
          else 'Sticker Quiz'
        end into temp_name;

      select 
        case temp_sticker_number
          when 1 then 'G.B. Baldassari' when 2 then 'Clara Alves' when 3 then 'Bia Crespo'
          when 4 then 'Victoria Mendes' when 5 then 'Line Cunha' when 6 then 'Mariana Rosa'
          when 7 then 'Ju Mesquita' when 8 then 'D. Barreto' when 9 then 'A. C. Meyer'
          when 10 then 'L. C. Almeida' when 11 then 'L. S. Oliveira' when 12 then 'T. B. Costa'
          when 13 then 'F. M. Santos' when 14 then 'C. A. Souza' when 15 then 'R. M. Cruz'
          when 16 then 'V. G. Martins' when 17 then 'P. R. Lima' when 18 then 'O. N. Alves'
          when 19 then 'R. F. Gomes' when 20 then 'A. L. Martins'
          else 'Autora'
        end into temp_author;

      select 
        case temp_sticker_number
          when 1 then 'amor-fati' when 2 then 'cupidos-nao-se-apaixonam' when 3 then 'eu-minha-crush-e-minha-irma'
          when 4 then 'liz-flores-e-uma-farsa' when 5 then 'segundo-cliche' when 6 then 'desejos-ocultos-das-violetas'
          when 7 then 'o-casamento' when 8 then 'como-não-se-apaixonar' when 9 then 'nossa-primeira-chance'
          when 10 then 'não-te-odeio' when 11 then 'para-onde-vão-as-borboletas' when 12 then 'apenas-um-garoto'
          when 13 then 'cartas-para-julieta' when 14 then 'uma-colega-de-quarto' when 15 then 'a-promessa'
          when 16 then 'destinados' when 17 then 'o-canto-das-sereias' when 18 then 'um-acordo-inesperado'
          when 19 then 'coração-de-vidro' when 20 then 'efeito-borboleta'
          else 'slug'
        end into temp_slug;

      select count(*) into temp_errors
      from public.quiz_answers
      where user_id = user_id_param and sticker_number = temp_sticker_number and correct = false;

      select exists(
        select 1 from public.quiz_answers 
        where user_id = user_id_param and sticker_number = temp_sticker_number and q_index = temp_q_index
      ) into temp_answered;

      if temp_answered then
        select correct, chosen_index into temp_correct, temp_chosen_index
        from public.quiz_answers
        where user_id = user_id_param and sticker_number = temp_sticker_number and q_index = temp_q_index;
      else
        temp_correct := false;
        temp_chosen_index := null;
      end if;

      if temp_answered or temp_errors >= 3 then
        temp_correct_index_return := temp_correct_index;
      else
        temp_correct_index_return := null;
      end if;

      temp_hide_indices := null;
      if temp_errors = 2 and not temp_answered then
        select array_agg(idx) into temp_hide_indices from (
          select idx from (
            select val as idx, ((val + temp_sticker_number) % 3) - 1 as sort_order
            from unnest(array[0, 1, 2, 3]) as val
            where val <> temp_correct_index
          ) x
          order by sort_order asc limit 2
        ) y;
      end if;

      q_item := jsonb_build_object(
        'sticker_number', temp_sticker_number,
        'slug', temp_slug,
        'title', temp_name,
        'author', temp_author,
        'q_index', temp_q_index,
        'text', temp_text,
        'options', to_jsonb(temp_options),
        'errors', temp_errors,
        'answered', temp_answered,
        'correct', temp_correct,
        'chosenIndex', temp_chosen_index,
        'correct_index', temp_correct_index_return,
        'options_to_hide', to_jsonb(temp_hide_indices)
      );
      questions_list := questions_list || q_item;
    end loop;
  end if;

  select count(*) into correct_count
  from public.user_stickers us
  where us.user_id = user_id_param 
    and us.copies > 0 
    and us.sticker_number in (
      1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20
    );

  return jsonb_build_object(
    'diaAtual', attempt_row.dia_atual,
    'tentativasHojeCount', attempt_row.tentativas_hoje_count,
    'perguntasRespondidasCorretasCount', correct_count,
    'questions', questions_list
  );
end;
$$ language plpgsql security definer;
