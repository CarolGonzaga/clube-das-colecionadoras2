-- Restore the V1 quiz contract for every user:
--   * at most four attempts per Sao Paulo calendar day;
--   * failed/timed-out stickers return to the randomized pool on another day;
--   * one of the two question versions and all alternatives are shuffled, but
--     remain stable for the duration of that user's daily session;
--   * the database owns the three-minute deadline;
--   * reveal rarity reflects the value actually persisted by the quiz rarity
--     trigger, rather than a preliminary random value.

DROP FUNCTION IF EXISTS public.answer_quiz(integer);
DROP FUNCTION IF EXISTS public.answer_quiz_legacy(integer, integer, integer);

CREATE OR REPLACE FUNCTION public.get_quiz_questions_for_today()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_today_text text := v_today::text;
  v_attempt public.quiz_attempts%rowtype;
  v_pool integer[] := '{}'::integer[];
  v_questions jsonb := '[]'::jsonb;
  v_number integer;
  v_q_index integer;
  v_text text;
  v_options text[];
  v_correct_index integer;
  v_permutation integer[];
  v_shuffled_options text[];
  v_shuffled_correct integer;
  v_answer public.quiz_answers%rowtype;
  v_errors integer;
  v_attempts_today integer;
  v_correct_total integer;
  v_sticker public.stickers%rowtype;
  v_seed text;
  v_unlimited boolean := v_uid = 'f8721040-035f-414a-8153-b5e12fec64d7'::uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autorizado.';
  END IF;

  SELECT count(*)::integer
  INTO v_attempts_today
  FROM public.quiz_answers
  WHERE user_id = v_uid AND attempt_day = v_today;

  SELECT count(DISTINCT sticker_number)::integer
  INTO v_correct_total
  FROM public.quiz_answers
  WHERE user_id = v_uid
    AND sticker_number BETWEEN 1 AND 20
    AND correct = true;

  SELECT * INTO v_attempt
  FROM public.quiz_attempts
  WHERE user_id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    SELECT coalesce(array_agg(number), '{}'::integer[])
    INTO v_pool
    FROM (
      SELECT s.number
      FROM public.stickers s
      WHERE s.number BETWEEN 1 AND 20
        AND NOT EXISTS (
          SELECT 1 FROM public.quiz_answers qa
          WHERE qa.user_id = v_uid
            AND qa.sticker_number = s.number
            AND qa.correct = true
        )
      ORDER BY random()
      LIMIT CASE WHEN v_unlimited THEN 20 ELSE greatest(0, 4 - v_attempts_today) END
    ) pending;

    INSERT INTO public.quiz_attempts (
      user_id, ultimo_dia_acesso, tentativas_hoje_count, dia_atual, perguntas_pendentes
    ) VALUES (
      v_uid, v_today_text, v_attempts_today, 1, v_pool
    )
    RETURNING * INTO v_attempt;
  ELSIF v_attempt.ultimo_dia_acesso IS DISTINCT FROM v_today_text THEN
    SELECT coalesce(array_agg(number), '{}'::integer[])
    INTO v_pool
    FROM (
      SELECT s.number
      FROM public.stickers s
      WHERE s.number BETWEEN 1 AND 20
        AND NOT EXISTS (
          SELECT 1 FROM public.quiz_answers qa
          WHERE qa.user_id = v_uid
            AND qa.sticker_number = s.number
            AND qa.correct = true
        )
      ORDER BY random()
      LIMIT CASE WHEN v_unlimited THEN 20 ELSE 4 END
    ) pending;

    UPDATE public.quiz_attempts
    SET ultimo_dia_acesso = v_today_text,
        tentativas_hoje_count = 0,
        dia_atual = coalesce(dia_atual, 0) + 1,
        perguntas_pendentes = v_pool
    WHERE user_id = v_uid
    RETURNING * INTO v_attempt;
    v_attempts_today := 0;
  ELSE
    -- Repair counters left inconsistent by older quiz functions.
    UPDATE public.quiz_attempts
    SET tentativas_hoje_count = v_attempts_today
    WHERE user_id = v_uid
    RETURNING * INTO v_attempt;
    v_pool := coalesce(v_attempt.perguntas_pendentes, '{}'::integer[]);
  END IF;

  -- This account is used for full quiz validation and may access every
  -- unfinished sticker in one session. No other account receives this branch.
  IF v_unlimited AND v_correct_total < 20 THEN
    SELECT coalesce(array_agg(number), '{}'::integer[])
    INTO v_pool
    FROM (
      SELECT s.number
      FROM public.stickers s
      WHERE s.number BETWEEN 1 AND 20
        AND NOT EXISTS (
          SELECT 1 FROM public.quiz_answers qa
          WHERE qa.user_id = v_uid
            AND qa.sticker_number = s.number
            AND qa.correct = true
        )
      ORDER BY random()
    ) pending;

    UPDATE public.quiz_attempts
    SET perguntas_pendentes = v_pool
    WHERE user_id = v_uid
    RETURNING * INTO v_attempt;
  END IF;

  IF v_correct_total >= 20 THEN
    v_pool := '{}'::integer[];
    UPDATE public.quiz_attempts
    SET perguntas_pendentes = v_pool
    WHERE user_id = v_uid
    RETURNING * INTO v_attempt;
  END IF;

  FOREACH v_number IN ARRAY coalesce(v_pool, '{}'::integer[]) LOOP
    -- The hash makes the choice random-looking but stable across reloads.
    v_q_index := ((hashtextextended(v_uid::text || ':' || v_number || ':' || v_today_text, 0) % 2 + 2) % 2)::integer;

    SELECT qq.text, qq.options, qq.correct_index
    INTO v_text, v_options, v_correct_index
    FROM public.quiz_questions qq
    WHERE qq.sticker_number = v_number AND qq.q_index = v_q_index;

    IF v_text IS NULL THEN
      SELECT qq.q_index, qq.text, qq.options, qq.correct_index
      INTO v_q_index, v_text, v_options, v_correct_index
      FROM public.quiz_questions qq
      WHERE qq.sticker_number = v_number
      ORDER BY random()
      LIMIT 1;
    END IF;

    IF v_text IS NULL OR cardinality(v_options) <> 4 THEN
      CONTINUE;
    END IF;

    v_seed := v_uid::text || ':' || v_number || ':' || v_q_index || ':' || v_today_text;
    SELECT array_agg(idx ORDER BY md5(v_seed || ':' || idx::text))
    INTO v_permutation
    FROM generate_series(0, 3) idx;

    SELECT array_agg(v_options[v_permutation[pos] + 1] ORDER BY pos)
    INTO v_shuffled_options
    FROM generate_series(1, 4) pos;

    SELECT pos - 1 INTO v_shuffled_correct
    FROM generate_series(1, 4) pos
    WHERE v_permutation[pos] = v_correct_index;

    SELECT * INTO v_answer
    FROM public.quiz_answers qa
    WHERE qa.user_id = v_uid
      AND qa.sticker_number = v_number
      AND qa.attempt_day = v_today
    ORDER BY qa.answered_at DESC
    LIMIT 1;

    SELECT count(*)::integer INTO v_errors
    FROM public.quiz_answers qa
    WHERE qa.user_id = v_uid
      AND qa.sticker_number = v_number
      AND qa.correct = false;

    SELECT * INTO v_sticker FROM public.stickers WHERE number = v_number;

    v_questions := v_questions || jsonb_build_array(jsonb_build_object(
      'sticker_number', v_number,
      'slug', coalesce(v_sticker.slug, 'quiz-' || v_number),
      'title', coalesce(v_sticker.name, 'Figurinha ' || v_number),
      'author', v_sticker.author,
      'q_index', v_q_index,
      'text', v_text,
      'options', to_jsonb(v_shuffled_options),
      'errors', v_errors,
      'answered', v_answer.user_id IS NOT NULL,
      'correct', coalesce(v_answer.correct, false),
      'chosenIndex', v_answer.chosen_index,
      'correct_index', CASE WHEN v_errors >= 3 THEN v_shuffled_correct ELSE NULL END,
      'options_to_hide', '[]'::jsonb
    ));
  END LOOP;

  RETURN jsonb_build_object(
    'diaAtual', coalesce(v_attempt.dia_atual, 1),
    'tentativasHojeCount', v_attempts_today,
    'perguntasRespondidasCorretasCount', v_correct_total,
    'quizUnlimited', v_unlimited,
    'questions', v_questions
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_quiz_timeout(
  uid uuid,
  sn integer,
  qi integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_count integer;
  v_errors integer;
BEGIN
  IF uid IS NULL OR uid IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Não autorizado.';
  END IF;

  SELECT count(*)::integer INTO v_count
  FROM public.quiz_answers
  WHERE user_id = uid AND attempt_day = v_today;

  IF EXISTS (
    SELECT 1 FROM public.quiz_answers
    WHERE user_id = uid AND sticker_number = sn AND attempt_day = v_today
  ) THEN
    DELETE FROM public.quiz_question_timers
    WHERE user_id = uid AND sticker_number = sn AND q_index = qi;
    RETURN jsonb_build_object('correct', false, 'already_answered', true, 'reveals', '[]'::jsonb);
  END IF;

  IF v_count >= 4 AND uid <> 'f8721040-035f-414a-8153-b5e12fec64d7'::uuid THEN
    RAISE EXCEPTION 'Limite diário do quiz atingido.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE user_id = uid
      AND ultimo_dia_acesso = v_today::text
      AND sn = ANY(perguntas_pendentes)
  ) THEN
    RAISE EXCEPTION 'Esta pergunta não está disponível hoje.';
  END IF;

  INSERT INTO public.quiz_answers (
    user_id, sticker_number, q_index, chosen_index, correct, attempt_day
  ) VALUES (uid, sn, qi, -1, false, v_today);

  UPDATE public.quiz_attempts
  SET tentativas_hoje_count = v_count + 1
  WHERE user_id = uid;

  SELECT count(*)::integer INTO v_errors
  FROM public.quiz_answers
  WHERE user_id = uid AND sticker_number = sn AND correct = false;

  DELETE FROM public.quiz_question_timers
  WHERE user_id = uid AND sticker_number = sn AND q_index = qi;

  RETURN jsonb_build_object(
    'correct', false, 'errors', v_errors, 'timed_out', true, 'reveals', '[]'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.start_quiz_question_timer(
  sticker_number_param integer,
  q_index_param integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_timer public.quiz_question_timers%rowtype;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autorizado.'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE user_id = v_uid
      AND ultimo_dia_acesso = v_today::text
      AND sticker_number_param = ANY(perguntas_pendentes)
  ) THEN
    RAISE EXCEPTION 'Esta pergunta não está disponível hoje.';
  END IF;

  SELECT * INTO v_timer
  FROM public.quiz_question_timers
  WHERE user_id = v_uid
    AND sticker_number = sticker_number_param
    AND q_index = q_index_param;

  IF NOT FOUND THEN
    INSERT INTO public.quiz_question_timers (user_id, sticker_number, q_index, expires_at)
    VALUES (v_uid, sticker_number_param, q_index_param, now() + interval '3 minutes')
    RETURNING * INTO v_timer;
  END IF;

  IF v_timer.expires_at <= now() THEN
    RETURN public.record_quiz_timeout(v_uid, sticker_number_param, q_index_param)
      || jsonb_build_object('expired', true, 'expires_at', v_timer.expires_at);
  END IF;

  RETURN jsonb_build_object(
    'started_at', v_timer.started_at,
    'expires_at', v_timer.expires_at,
    'expired', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_quiz_question_timers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_timer record;
BEGIN
  FOR v_timer IN
    SELECT * FROM public.quiz_question_timers
    WHERE user_id = auth.uid() AND expires_at <= now()
  LOOP
    PERFORM public.record_quiz_timeout(
      v_timer.user_id, v_timer.sticker_number, v_timer.q_index
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.answer_quiz(
  sticker_number_param integer,
  q_index_param integer,
  chosen_index_param integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
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
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autorizado.'; END IF;

  SELECT count(*)::integer INTO v_count
  FROM public.quiz_answers
  WHERE user_id = v_uid AND attempt_day = v_today;

  IF v_count >= 4 AND v_uid <> 'f8721040-035f-414a-8153-b5e12fec64d7'::uuid THEN
    RAISE EXCEPTION 'Limite diário do quiz atingido.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE user_id = v_uid
      AND ultimo_dia_acesso = v_today_text
      AND sticker_number_param = ANY(perguntas_pendentes)
  ) THEN
    RAISE EXCEPTION 'Esta pergunta não está disponível hoje.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.quiz_answers
    WHERE user_id = v_uid
      AND sticker_number = sticker_number_param
      AND attempt_day = v_today
  ) THEN
    RAISE EXCEPTION 'Esta pergunta já foi respondida hoje.';
  END IF;

  SELECT expires_at INTO v_deadline
  FROM public.quiz_question_timers
  WHERE user_id = v_uid
    AND sticker_number = sticker_number_param
    AND q_index = q_index_param;

  IF v_deadline IS NULL THEN
    INSERT INTO public.quiz_question_timers (user_id, sticker_number, q_index, expires_at)
    VALUES (v_uid, sticker_number_param, q_index_param, now() + interval '3 minutes')
    ON CONFLICT (user_id, sticker_number, q_index) DO UPDATE
    SET expires_at = public.quiz_question_timers.expires_at
    RETURNING expires_at INTO v_deadline;
  ELSIF v_deadline <= now() THEN
    RETURN public.record_quiz_timeout(v_uid, sticker_number_param, q_index_param);
  END IF;

  SELECT options, correct_index INTO v_options, v_original_correct
  FROM public.quiz_questions
  WHERE sticker_number = sticker_number_param AND q_index = q_index_param;

  IF v_original_correct IS NULL THEN RAISE EXCEPTION 'Pergunta não encontrada.'; END IF;

  v_seed := v_uid::text || ':' || sticker_number_param || ':' || q_index_param || ':' || v_today_text;
  SELECT array_agg(idx ORDER BY md5(v_seed || ':' || idx::text))
  INTO v_permutation
  FROM generate_series(0, 3) idx;

  SELECT pos - 1 INTO v_shuffled_correct
  FROM generate_series(1, 4) pos
  WHERE v_permutation[pos] = v_original_correct;

  v_is_correct := chosen_index_param = v_shuffled_correct;

  INSERT INTO public.quiz_answers (
    user_id, sticker_number, q_index, chosen_index, correct, attempt_day
  ) VALUES (
    v_uid, sticker_number_param, q_index_param, chosen_index_param, v_is_correct, v_today
  );

  UPDATE public.quiz_attempts
  SET tentativas_hoje_count = v_count + 1
  WHERE user_id = v_uid;

  DELETE FROM public.quiz_question_timers
  WHERE user_id = v_uid
    AND sticker_number = sticker_number_param
    AND q_index = q_index_param;

  SELECT count(*)::integer INTO v_errors
  FROM public.quiz_answers
  WHERE user_id = v_uid AND sticker_number = sticker_number_param AND correct = false;

  IF NOT v_is_correct THEN
    RETURN jsonb_build_object('correct', false, 'errors', v_errors, 'reveals', '[]'::jsonb);
  END IF;

  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_stickers
    WHERE user_id = v_uid AND sticker_number = sticker_number_param AND copies > 0
  ) INTO v_was_new;

  -- The BEFORE INSERT trigger enforce_quiz_reward_rarity owns the 40% bounded
  -- rarity rule. RETURNING captures its final decision for the reveal UI.
  INSERT INTO public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  VALUES (v_uid, sticker_number_param, 1, false, now())
  ON CONFLICT (user_id, sticker_number) DO UPDATE
  SET copies = public.user_stickers.copies + 1
  RETURNING is_rare INTO v_persisted_rare;

  UPDATE public.quiz_answers
  SET reward_is_rare = coalesce(v_persisted_rare, false)
  WHERE user_id = v_uid
    AND sticker_number = sticker_number_param
    AND q_index = q_index_param
    AND attempt_day = v_today;

  SELECT * INTO v_sticker FROM public.stickers WHERE number = sticker_number_param;

  INSERT INTO public.point_transactions (user_id, amount, reason, sticker_number)
  VALUES (v_uid, 10, 'Quiz Respondido Corretamente', sticker_number_param);

  PERFORM public.ensure_user_points(v_uid);

  UPDATE public.user_points
  SET balance = balance + 10,
      updated_at = now()
  WHERE user_id = v_uid;

  RETURN jsonb_build_object(
    'correct', true,
    'errors', v_errors,
    'reveals', jsonb_build_array(jsonb_build_object(
      'number', sticker_number_param,
      'slug', coalesce(v_sticker.slug, 'quiz-' || sticker_number_param),
      'name', coalesce(v_sticker.name, 'Figurinha ' || sticker_number_param),
      'author', v_sticker.author,
      'wasNew', v_was_new,
      'isRare', coalesce(v_persisted_rare, false),
      'repeat', NOT v_was_new,
      'reward', null
    ))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_quiz_timeout(uuid, integer, integer) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_quiz_questions_for_today() FROM public, anon;
REVOKE ALL ON FUNCTION public.start_quiz_question_timer(integer, integer) FROM public, anon;
REVOKE ALL ON FUNCTION public.expire_quiz_question_timers() FROM public, anon;
REVOKE ALL ON FUNCTION public.answer_quiz(integer, integer, integer) FROM public, anon;

GRANT EXECUTE ON FUNCTION public.get_quiz_questions_for_today() TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_quiz_question_timer(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_quiz_question_timers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.answer_quiz(integer, integer, integer) TO authenticated;

-- Requested clean reset. This removes only quiz-domain state and the twenty
-- quiz stickers so the user can earn every question reward again. Other album
-- stickers, styles, purchases, missions and wallet history remain untouched.
DELETE FROM public.quiz_question_timers
WHERE user_id = 'f52f4a8a-d7dc-4897-8a18-2bbfa3035f6a'::uuid;

DELETE FROM public.quiz_attempts
WHERE user_id = 'f52f4a8a-d7dc-4897-8a18-2bbfa3035f6a'::uuid;

DELETE FROM public.quiz_reward_rarities
WHERE user_id = 'f52f4a8a-d7dc-4897-8a18-2bbfa3035f6a'::uuid;

DELETE FROM public.quiz_answers
WHERE user_id = 'f52f4a8a-d7dc-4897-8a18-2bbfa3035f6a'::uuid;

DELETE FROM public.user_stickers
WHERE user_id = 'f52f4a8a-d7dc-4897-8a18-2bbfa3035f6a'::uuid
  AND sticker_number BETWEEN 1 AND 20;

NOTIFY pgrst, 'reload schema';
