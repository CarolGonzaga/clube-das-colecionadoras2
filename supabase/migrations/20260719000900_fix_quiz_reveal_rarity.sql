-- Fix answer_quiz_legacy to return the drop rarity (new_is_rare) for reveal_item instead of the user's overall inventory rarity (final_is_rare)

create or replace function public.answer_quiz_legacy(
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

  current_day := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD');

  -- Verify and increment daily attempts count
  select tentativas_hoje_count into attempt_count
  from public.quiz_attempts
  where user_id = user_id_param;

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
    where user_id = user_id_param
      and sticker_number = sticker_number_param
      and q_index = q_index_param
      and attempt_day = current_day::date
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

    if perm0 = correct_idx_val then shuffled_correct_index := 0;
    elsif perm1 = correct_idx_val then shuffled_correct_index := 1;
    elsif perm2 = correct_idx_val then shuffled_correct_index := 2;
    else shuffled_correct_index := 3;
    end if;

    is_correct := (chosen_index_param <> -1 and chosen_index_param = shuffled_correct_index);
  end;

  -- Update attempts count
  update public.quiz_attempts
  set tentativas_hoje_count = tentativas_hoje_count + 1
  where user_id = user_id_param;

  -- Record user answer
  insert into public.quiz_answers (
    user_id,
    sticker_number,
    q_index,
    chosen_index,
    correct,
    attempt_day
  )
  values (
    user_id_param,
    sticker_number_param,
    q_index_param,
    chosen_index_param,
    is_correct,
    current_day::date
  );

  select 
    case sticker_number_param
      when 1 then 'amor-fati' when 2 then 'cupidos-nao-se-apaixonam' when 3 then 'eu-minha-crush-e-minha-irma'
      when 4 then 'liz-flores-e-uma-farsa' when 5 then 'segundo-cliche' when 6 then 'desejos-ocultos-das-violetas'
      when 7 then 'o-casamento' when 8 then 'como-nao-se-apaixonar' when 9 then 'ela-e-mais-do-que-voce-imagina'
      when 10 then 'nao-conta-pra-ela' when 11 then 'opostas-em-guerra' when 12 then 'em-todas-as-gotas-de-chuva'
      when 13 then 'colegas-de-quarto' when 14 then 'imensuravel-uma-nova-chance-para-amar' when 15 then 'georgia-rose'
      when 16 then 'a-garota-do-topo' when 17 then 'nao-e-so-de-amor-que-eu-sei-falar' when 18 then 'os-segredos-que-contei-ao-oceano'
      when 19 then 'opostos-complementares' when 20 then 'cancao-dos-ossos'
      else 'slug'
    end into target_slug;

  if is_correct then
    -- Roll for 40% chance of Rare
    new_is_rare := (random() < 0.40);

    -- Grant sticker in inventory
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
