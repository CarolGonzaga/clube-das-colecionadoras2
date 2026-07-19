-- Make quiz retries day-aware without changing any existing rewards or progress.
-- Requested after stale incorrect answers were rendered as already answered.
--
-- Safety guarantees:
--   * preserves every existing quiz answer and adds its Sao Paulo attempt day;
--   * does not update/delete user_stickers or quiz_reward_rarities;
--   * snapshots all quiz state before altering the answer key;
--   * validates the snapshots before commit and rolls back on any mismatch.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

do $$
begin
  if to_regclass('private.quiz_answers_backup_20260716') is not null then
    raise exception 'Quiz backup 20260716 already exists; migration was already started or applied.';
  end if;
end;
$$;

create table private.quiz_answers_backup_20260716
as select * from public.quiz_answers;

create table private.quiz_attempts_backup_20260716
as select * from public.quiz_attempts;

create table private.quiz_question_timers_backup_20260716
as select * from public.quiz_question_timers;

create table private.quiz_reward_rarities_backup_20260716
as select * from public.quiz_reward_rarities;

create table private.quiz_user_stickers_backup_20260716
as
select *
from public.user_stickers
where sticker_number between 1 and 20;

revoke all on
  private.quiz_answers_backup_20260716,
  private.quiz_attempts_backup_20260716,
  private.quiz_question_timers_backup_20260716,
  private.quiz_reward_rarities_backup_20260716,
  private.quiz_user_stickers_backup_20260716
from public, anon, authenticated;

do $$
begin
  if exists (
    select 1
    from public.quiz_answers
    where answered_at is null
  ) then
    raise exception 'quiz_answers contains answered_at null; migration cancelled before schema changes.';
  end if;
end;
$$;

alter table public.quiz_answers
  add column attempt_day date;

update public.quiz_answers
set attempt_day = (answered_at at time zone 'America/Sao_Paulo')::date;

alter table public.quiz_answers
  alter column attempt_day set default ((now() at time zone 'America/Sao_Paulo')::date),
  alter column attempt_day set not null;

alter table public.quiz_answers
  drop constraint quiz_answers_pkey;

alter table public.quiz_answers
  add constraint quiz_answers_pkey
  primary key (user_id, sticker_number, q_index, attempt_day);

create index if not exists quiz_answers_user_sticker_correct_idx
  on public.quiz_answers (user_id, sticker_number, correct);


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

  -- Ensure profile exists (fallback auto-creation if trigger didn't run yet)
  if not exists (select 1 from public.profiles where id = user_id_param) then
    insert into public.profiles (id, nick, avatar_emoji, mural_opt_in)
    values (user_id_param, 'Colecionadora', 'ðŸ“·', false);
  end if;

  -- Get current local day date (America/Sao_Paulo timezone)
  current_day := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD');

  -- Get user attempts state
  select * into attempt_row from public.quiz_attempts where user_id = user_id_param;

  if not found then
    -- Generate initial pool of 4 stickers (shuffled randomly)
    -- Unowned quiz stickers
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
    values (user_id_param, current_day, 0, 1, final_pool)
    returning * into attempt_row;
    
  elsif attempt_row.ultimo_dia_acesso <> current_day then
    new_dia_atual := attempt_row.dia_atual + 1;
    
    -- Priority 1: incorrect answered stickers (erradas) that are not yet correct
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

    -- Priority 2: new unanswered stickers (shuffled randomly)
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

    -- Combine pools
    final_pool := (erradas_ids || novas_ids)[1:4];

    update public.quiz_attempts
    set ultimo_dia_acesso = current_day,
        tentativas_hoje_count = 0,
        dia_atual = new_dia_atual,
        perguntas_pendentes = final_pool
    where user_id = user_id_param
    returning * into attempt_row;
  end if;

  -- Build questions details
  if array_length(attempt_row.perguntas_pendentes, 1) > 0 then
    for i in 1 .. array_upper(attempt_row.perguntas_pendentes, 1) loop
      temp_sticker_number := attempt_row.perguntas_pendentes[i];
      
      -- Calculate current q_index based on dia_atual
      temp_q_index := (temp_sticker_number + attempt_row.dia_atual) % 2;

      -- Fetch question data
      select text, options, correct_index into temp_text, temp_options, temp_correct_index
      from public.quiz_questions
      where sticker_number = temp_sticker_number and q_index = temp_q_index;

      -- If question not seeded yet, fallback safely
      if temp_text is null then
        continue;
      end if;

      -- Shuffle answer options using a deterministic permutation per (user, sticker, day)
      -- This ensures the correct answer isn't always option A
      declare
        h integer;
        perm0 integer; perm1 integer; perm2 integer; perm3 integer;
        tmp_int integer;
        shuffled_options text[];
      begin
        -- Derive a hash-based seed for this user+sticker+day
        h := abs(hashtext(user_id_param::text || temp_sticker_number::text || current_day));

        -- Build an initial permutation [0,1,2,3]
        perm0 := 0; perm1 := 1; perm2 := 2; perm3 := 3;

        -- Simple deterministic shuffle using the hash bits
        -- Swap index 3 with (h % 4)
        case (h % 4)
          when 0 then tmp_int := perm0; perm0 := perm3; perm3 := tmp_int;
          when 1 then tmp_int := perm1; perm1 := perm3; perm3 := tmp_int;
          when 2 then tmp_int := perm2; perm2 := perm3; perm3 := tmp_int;
          else null;
        end case;
        h := h / 4;
        -- Swap index 2 with (h % 3)
        case (h % 3)
          when 0 then tmp_int := perm0; perm0 := perm2; perm2 := tmp_int;
          when 1 then tmp_int := perm1; perm1 := perm2; perm2 := tmp_int;
          else null;
        end case;
        h := h / 3;
        -- Swap index 1 with (h % 2)
        if (h % 2) = 0 then
          tmp_int := perm0; perm0 := perm1; perm1 := tmp_int;
        end if;

        -- Build shuffled options in new order
        shuffled_options := array[
          temp_options[perm0 + 1],
          temp_options[perm1 + 1],
          temp_options[perm2 + 1],
          temp_options[perm3 + 1]
        ];

        -- Find new position of the correct answer
        if perm0 = temp_correct_index then temp_correct_index := 0;
        elsif perm1 = temp_correct_index then temp_correct_index := 1;
        elsif perm2 = temp_correct_index then temp_correct_index := 2;
        else temp_correct_index := 3;
        end if;

        temp_options := shuffled_options;
      end;

      -- Get sticker info
      -- Mapping titles/slugs/authors dynamically matching seeds.ts
      select 
        case temp_sticker_number
          when 1 then 'Amor Fati' when 2 then 'Cupidos nÃ£o se apaixonam' when 3 then 'Eu, minha crush e minha irmÃ£'
          when 4 then 'Liz Flores Ã© uma farsa' when 5 then 'Segundo ClichÃª (Frutaverso Livro 1)' when 6 then 'Desejos Ocultos das Violetas'
          when 7 then 'O Casamento' when 8 then 'Como (nÃ£o) se apaixonar' when 9 then 'Ela Ã© mais do que vocÃª imagina'
          when 10 then '(NÃ£o) conta pra ela' when 11 then 'Opostas em Guerra' when 12 then 'Em todas as gotas de chuva'
          when 13 then 'Colegas de Quarto' when 14 then 'ImensurÃ¡vel: Uma nova chance para amar' when 15 then 'Georgia Rose: Segredos de FlorenÃ§a'
          when 16 then 'A Garota do Topo' when 17 then 'NÃ£o Ã© sÃ³ de amor que eu sei falar' when 18 then 'Os Segredos Que Contei Ao Oceano'
          when 19 then 'Opostos Complementares (Opostos Co. Livro 1)' when 20 then 'CanÃ§Ã£o dos Ossos'
          else 'Sticker Quiz'
        end into temp_name;

      select 
        case temp_sticker_number
          when 1 then 'G.B. Baldassari' when 2 then 'Clara Alves' when 3 then 'Bia Crespo'
          when 4 then 'Victoria Mendes' when 5 then 'Line Cunha' when 6 then 'Mariana Rosa'
          when 7 then 'Ju Mesquita' when 8 then 'D. Barreto' when 9 then 'V.S. Vilela'
          when 10 then 'Karoline Mandu' when 11 then 'Sarah Oliveira' when 12 then 'Englantine'
          when 13 then 'Marina Basso' when 14 then 'Zey Shelsea' when 15 then 'Victoria Moon'
          when 16 then 'Helena Nolasco' when 17 then 'Yasmim Mahmud Kader' when 18 then 'Camilla Giordanno'
          when 19 then 'Fernanda V.' when 20 then 'Giu Domingues'
          else 'Autora'
        end into temp_author;

      select 
        case temp_sticker_number
          when 1 then 'amor-fati' when 2 then 'cupidos-nao-se-apaixonam' when 3 then 'eu-minha-crush-e-minha-irma'
          when 4 then 'liz-flores-e-uma-farsa' when 5 then 'segundo-cliche' when 6 then 'desejos-ocultos-das-violetas'
          when 7 then 'o-casamento' when 8 then 'como-nÃ£o-se-apaixonar' when 9 then 'ela-e-mais-do-que-voce-imagina'
          when 10 then 'nao-conta-pra-ela' when 11 then 'opostas-em-guerra' when 12 then 'em-todas-as-gotas-de-chuva'
          when 13 then 'colegas-de-quarto' when 14 then 'imensuravel-uma-nova-chance-para-amar' when 15 then 'georgia-rose'
          when 16 then 'a-garota-do-topo' when 17 then 'nao-e-so-de-amor-que-eu-sei-falar' when 18 then 'os-segredos-que-contei-ao-oceano'
          when 19 then 'opostos-complementares' when 20 then 'cancao-dos-ossos'
          else 'slug'
        end into temp_slug;

      -- Check total errors count for this question (distinct incorrect answers)
      select count(*) into temp_errors
      from public.quiz_answers
      where user_id = user_id_param and sticker_number = temp_sticker_number and correct = false;

      -- Check if already answered in this session (today)
      select exists(
        select 1 from public.quiz_answers 
        where user_id = user_id_param
          and sticker_number = temp_sticker_number
          and q_index = temp_q_index
          and attempt_day = current_day::date
      ) into temp_answered;

      if temp_answered then
        select correct, chosen_index into temp_correct, temp_chosen_index
        from public.quiz_answers
        where user_id = user_id_param
          and sticker_number = temp_sticker_number
          and q_index = temp_q_index
          and attempt_day = current_day::date;
      else
        temp_correct := false;
        temp_chosen_index := null;
      end if;

      -- Obfuscate correct_index if not answered and errors < 3 (assisted limit)
      if temp_answered or temp_errors >= 3 then
        temp_correct_index_return := temp_correct_index;
      else
        temp_correct_index_return := null;
      end if;

      -- Calculate deterministic wrong indices to hide if errors == 2 and unanswered
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

  -- Count total correct quiz stickers owned by user
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
$$ language plpgsql security definer;;

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
    raise exception 'VocÃª jÃ¡ esgotou suas 4 tentativas de hoje! Volte amanhÃ£ â³';
  end if;

  -- Verify if question is in today's pending session
  if not exists (
    select 1 from public.quiz_attempts
    where user_id = user_id_param and sticker_number_param = any(perguntas_pendentes)
  ) then
    raise exception 'Esta pergunta nÃ£o estÃ¡ disponÃ­vel para ser respondida hoje.';
  end if;

  -- Check if already answered in this session
  if exists (
    select 1 from public.quiz_answers
    where user_id = user_id_param
      and sticker_number = sticker_number_param
      and q_index = q_index_param
      and attempt_day = current_day::date
  ) then
    raise exception 'VocÃª jÃ¡ respondeu a esta pergunta hoje.';
  end if;

  -- Retrieve correct index from secure quiz_questions table
  select correct_index into correct_idx_val
  from public.quiz_questions
  where sticker_number = sticker_number_param and q_index = q_index_param;

  if correct_idx_val is null then
    raise exception 'Pergunta nÃ£o encontrada.';
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
      when 7 then 'o-casamento' when 8 then 'como-nÃ£o-se-apaixonar' when 9 then 'ela-e-mais-do-que-voce-imagina'
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
      'repeat', false, -- Quizzes don't duplicate on correct answer solving
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
    -- Incorrect answer
    select count(*) into new_errors
    from public.quiz_answers
    where user_id = user_id_param and sticker_number = sticker_number_param and correct = false;

    return jsonb_build_object(
      'correct', false,
      'errors', new_errors
    );
  end if;
end;
$$ language plpgsql security definer;;

create or replace function public.record_quiz_timeout(
  uid uuid,
  sn integer,
  qi integer
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  error_count integer;
  current_day date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if exists (
    select 1 from public.quiz_answers
    where user_id = uid
      and sticker_number = sn
      and q_index = qi
      and attempt_day = current_day
  ) then
    delete from public.quiz_question_timers
    where user_id = uid and sticker_number = sn and q_index = qi;
    return jsonb_build_object('correct', false, 'already_answered', true);
  end if;

  insert into public.quiz_answers (
    user_id,
    sticker_number,
    q_index,
    chosen_index,
    correct,
    attempt_day
  )
  values (
    uid,
    sn,
    qi,
    -1,
    false,
    current_day
  );

  update public.quiz_attempts
  set tentativas_hoje_count = tentativas_hoje_count + 1
  where user_id = uid;

  select count(*) into error_count
  from public.quiz_answers
  where user_id = uid and sticker_number = sn and correct = false;

  delete from public.quiz_question_timers
  where user_id = uid and sticker_number = sn and q_index = qi;

  return jsonb_build_object('correct', false, 'errors', error_count, 'timed_out', true);
end;
$$;;


-- Prove that the migration changed only the quiz answer schema/function logic.
do $$
begin
  if exists (
    (
      select user_id, sticker_number, q_index, chosen_index, correct, answered_at
      from private.quiz_answers_backup_20260716
      except
      select user_id, sticker_number, q_index, chosen_index, correct, answered_at
      from public.quiz_answers
    )
    union all
    (
      select user_id, sticker_number, q_index, chosen_index, correct, answered_at
      from public.quiz_answers
      except
      select user_id, sticker_number, q_index, chosen_index, correct, answered_at
      from private.quiz_answers_backup_20260716
    )
  ) then
    raise exception 'Quiz answer history changed unexpectedly; rolling back.';
  end if;

  if exists (
    select 1
    from public.quiz_answers
    where attempt_day <> (answered_at at time zone 'America/Sao_Paulo')::date
  ) then
    raise exception 'An existing quiz answer received the wrong attempt_day; rolling back.';
  end if;

  if exists (
    (
      select to_jsonb(source_row)
      from private.quiz_attempts_backup_20260716 source_row
      except
      select to_jsonb(current_row)
      from public.quiz_attempts current_row
    )
    union all
    (
      select to_jsonb(current_row)
      from public.quiz_attempts current_row
      except
      select to_jsonb(source_row)
      from private.quiz_attempts_backup_20260716 source_row
    )
  ) then
    raise exception 'quiz_attempts changed unexpectedly; rolling back.';
  end if;

  if exists (
    (
      select to_jsonb(source_row)
      from private.quiz_question_timers_backup_20260716 source_row
      except
      select to_jsonb(current_row)
      from public.quiz_question_timers current_row
    )
    union all
    (
      select to_jsonb(current_row)
      from public.quiz_question_timers current_row
      except
      select to_jsonb(source_row)
      from private.quiz_question_timers_backup_20260716 source_row
    )
  ) then
    raise exception 'quiz_question_timers changed unexpectedly; rolling back.';
  end if;

  if exists (
    (
      select to_jsonb(source_row)
      from private.quiz_reward_rarities_backup_20260716 source_row
      except
      select to_jsonb(current_row)
      from public.quiz_reward_rarities current_row
    )
    union all
    (
      select to_jsonb(current_row)
      from public.quiz_reward_rarities current_row
      except
      select to_jsonb(source_row)
      from private.quiz_reward_rarities_backup_20260716 source_row
    )
  ) then
    raise exception 'quiz_reward_rarities changed unexpectedly; rolling back.';
  end if;

  if exists (
    (
      select to_jsonb(source_row)
      from private.quiz_user_stickers_backup_20260716 source_row
      except
      select to_jsonb(current_row)
      from public.user_stickers current_row
      where current_row.sticker_number between 1 and 20
    )
    union all
    (
      select to_jsonb(current_row)
      from public.user_stickers current_row
      where current_row.sticker_number between 1 and 20
      except
      select to_jsonb(source_row)
      from private.quiz_user_stickers_backup_20260716 source_row
    )
  ) then
    raise exception 'Quiz sticker inventory changed unexpectedly; rolling back.';
  end if;
end;
$$;

commit;
