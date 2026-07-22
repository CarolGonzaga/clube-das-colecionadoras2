-- Quiz rewards stickers only. Existing point balances and transaction history are preserved.
begin;

create or replace function public.answer_quiz(
  sticker_number_param integer,
  q_index_param integer,
  chosen_index_param integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_today_text text := v_today::text;
  v_count integer;
  v_deadline timestamptz;
  v_options text[];
  v_original_correct integer;
  v_permutation integer[];
  v_shuffled_correct integer;
  v_is_correct boolean;
  v_errors integer;
  v_was_new boolean;
  v_persisted_rare boolean;
  v_sticker public.stickers%rowtype;
  v_seed text;
begin
  if v_uid is null then raise exception 'Não autorizado.'; end if;

  select count(*)::integer into v_count
  from public.quiz_answers
  where user_id = v_uid and attempt_day = v_today;

  if v_count >= 4 and v_uid <> 'f8721040-035f-414a-8153-b5e12fec64d7'::uuid then
    raise exception 'Limite diário do quiz atingido.';
  end if;

  if not exists (
    select 1 from public.quiz_attempts
    where user_id = v_uid
      and ultimo_dia_acesso = v_today_text
      and sticker_number_param = any(perguntas_pendentes)
  ) then
    raise exception 'Esta pergunta não está disponível hoje.';
  end if;

  if exists (
    select 1 from public.quiz_answers
    where user_id = v_uid
      and sticker_number = sticker_number_param
      and attempt_day = v_today
  ) then
    raise exception 'Esta pergunta já foi respondida hoje.';
  end if;

  select expires_at into v_deadline
  from public.quiz_question_timers
  where user_id = v_uid
    and sticker_number = sticker_number_param
    and q_index = q_index_param;

  if v_deadline is null then
    insert into public.quiz_question_timers (user_id, sticker_number, q_index, expires_at)
    values (v_uid, sticker_number_param, q_index_param, now() + interval '3 minutes')
    on conflict (user_id, sticker_number, q_index) do update
    set expires_at = public.quiz_question_timers.expires_at
    returning expires_at into v_deadline;
  elsif v_deadline <= now() then
    return public.record_quiz_timeout(v_uid, sticker_number_param, q_index_param);
  end if;

  select options, correct_index into v_options, v_original_correct
  from public.quiz_questions
  where sticker_number = sticker_number_param and q_index = q_index_param;

  if v_original_correct is null then raise exception 'Pergunta não encontrada.'; end if;

  v_seed := v_uid::text || ':' || sticker_number_param || ':' || q_index_param || ':' || v_today_text;
  select array_agg(idx order by md5(v_seed || ':' || idx::text))
  into v_permutation
  from generate_series(0, 3) idx;

  select pos - 1 into v_shuffled_correct
  from generate_series(1, 4) pos
  where v_permutation[pos] = v_original_correct;

  v_is_correct := chosen_index_param = v_shuffled_correct;

  insert into public.quiz_answers (
    user_id, sticker_number, q_index, chosen_index, correct, attempt_day
  ) values (
    v_uid, sticker_number_param, q_index_param, chosen_index_param, v_is_correct, v_today
  );

  update public.quiz_attempts
  set tentativas_hoje_count = v_count + 1
  where user_id = v_uid;

  delete from public.quiz_question_timers
  where user_id = v_uid
    and sticker_number = sticker_number_param
    and q_index = q_index_param;

  select count(*)::integer into v_errors
  from public.quiz_answers
  where user_id = v_uid and sticker_number = sticker_number_param and correct = false;

  if not v_is_correct then
    return jsonb_build_object('correct', false, 'errors', v_errors, 'reveals', '[]'::jsonb);
  end if;

  select not exists (
    select 1 from public.user_stickers
    where user_id = v_uid and sticker_number = sticker_number_param and copies > 0
  ) into v_was_new;

  -- The inventory trigger applies the bounded rare-sticker rule.
  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (v_uid, sticker_number_param, 1, false, now())
  on conflict (user_id, sticker_number) do update
  set copies = public.user_stickers.copies + 1
  returning is_rare into v_persisted_rare;

  update public.quiz_answers
  set reward_is_rare = coalesce(v_persisted_rare, false)
  where user_id = v_uid
    and sticker_number = sticker_number_param
    and q_index = q_index_param
    and attempt_day = v_today;

  select * into v_sticker
  from public.stickers
  where number = sticker_number_param;

  return jsonb_build_object(
    'correct', true,
    'errors', v_errors,
    'reveals', jsonb_build_array(jsonb_build_object(
      'number', sticker_number_param,
      'slug', coalesce(v_sticker.slug, 'quiz-' || sticker_number_param),
      'name', coalesce(v_sticker.name, 'Figurinha ' || sticker_number_param),
      'author', v_sticker.author,
      'wasNew', v_was_new,
      'isRare', coalesce(v_persisted_rare, false),
      'repeat', not v_was_new,
      'reward', null
    ))
  );
end;
$$;

revoke all on function public.answer_quiz(integer, integer, integer) from public, anon;
grant execute on function public.answer_quiz(integer, integer, integer) to authenticated;

-- Abort if a future edit accidentally restores a wallet mutation in this function.
do $$
declare
  v_definition text;
begin
  select pg_get_functiondef('public.answer_quiz(integer,integer,integer)'::regprocedure)
  into v_definition;

  if v_definition ~* 'point_transactions'
     or v_definition ~* 'ensure_user_points'
     or v_definition ~* 'update[[:space:]]+public\.user_points' then
    raise exception 'Point-awarding statements remain in answer_quiz; migration cancelled.';
  end if;
end;
$$;

commit;
