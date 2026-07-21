-- Make timer maintenance tolerant of stale rows left by earlier quiz versions
-- and day/session transitions. A stale timer must never break the quiz loader.

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
  v_unlimited boolean := uid = 'f8721040-035f-414a-8153-b5e12fec64d7'::uuid;
BEGIN
  IF uid IS NULL OR uid IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Não autorizado.';
  END IF;

  -- Timers from a previous day or a previous randomized pool are disposable.
  -- They are not attempts in the user's current four-question round.
  IF NOT EXISTS (
    SELECT 1
    FROM public.quiz_attempts qa
    WHERE qa.user_id = uid
      AND qa.ultimo_dia_acesso = v_today::text
      AND sn = ANY(coalesce(qa.perguntas_pendentes, '{}'::integer[]))
  ) THEN
    DELETE FROM public.quiz_question_timers
    WHERE user_id = uid AND sticker_number = sn AND q_index = qi;
    RETURN jsonb_build_object(
      'correct', false, 'discarded', true, 'stale_timer', true, 'reveals', '[]'::jsonb
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.quiz_answers
    WHERE user_id = uid AND sticker_number = sn AND attempt_day = v_today
  ) THEN
    DELETE FROM public.quiz_question_timers
    WHERE user_id = uid AND sticker_number = sn AND q_index = qi;
    RETURN jsonb_build_object(
      'correct', false, 'already_answered', true, 'reveals', '[]'::jsonb
    );
  END IF;

  SELECT count(*)::integer INTO v_count
  FROM public.quiz_answers
  WHERE user_id = uid AND attempt_day = v_today;

  IF v_count >= 4 AND NOT v_unlimited THEN
    DELETE FROM public.quiz_question_timers
    WHERE user_id = uid AND sticker_number = sn AND q_index = qi;
    RETURN jsonb_build_object(
      'correct', false, 'discarded', true, 'daily_limit', true, 'reveals', '[]'::jsonb
    );
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

CREATE OR REPLACE FUNCTION public.expire_quiz_question_timers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_timer record;
BEGIN
  -- Remove every stale timer for the caller, including still-running timers
  -- that belong to yesterday or to a superseded randomized pool.
  DELETE FROM public.quiz_question_timers t
  WHERE t.user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1
      FROM public.quiz_attempts qa
      WHERE qa.user_id = t.user_id
        AND qa.ultimo_dia_acesso = ((now() AT TIME ZONE 'America/Sao_Paulo')::date)::text
        AND t.sticker_number = ANY(coalesce(qa.perguntas_pendentes, '{}'::integer[]))
    );

  FOR v_timer IN
    SELECT * FROM public.quiz_question_timers
    WHERE user_id = auth.uid() AND expires_at <= now()
  LOOP
    BEGIN
      PERFORM public.record_quiz_timeout(
        v_timer.user_id, v_timer.sticker_number, v_timer.q_index
      );
    EXCEPTION WHEN OTHERS THEN
      -- One corrupt legacy timer cannot abort cleanup of the whole session.
      DELETE FROM public.quiz_question_timers
      WHERE user_id = v_timer.user_id
        AND sticker_number = v_timer.sticker_number
        AND q_index = v_timer.q_index;
    END;
  END LOOP;
END;
$$;

DO $$
DECLARE
  v_signature regprocedure := to_regprocedure('public.answer_quiz(integer,integer,integer)');
  v_definition text;
  v_patched text;
  v_replacement text := E'IF v_deadline IS NULL THEN\n    INSERT INTO public.quiz_question_timers (user_id, sticker_number, q_index, expires_at)\n    VALUES (v_uid, sticker_number_param, q_index_param, now() + interval ''3 minutes'')\n    ON CONFLICT (user_id, sticker_number, q_index) DO UPDATE\n    SET expires_at = public.quiz_question_timers.expires_at\n    RETURNING expires_at INTO v_deadline;\n  ELSIF v_deadline <= now() THEN';
BEGIN
  IF v_signature IS NULL THEN
    RAISE EXCEPTION 'public.answer_quiz(integer,integer,integer) was not found.';
  END IF;

  SELECT pg_get_functiondef(v_signature) INTO v_definition;

  IF position('Inicie o cronômetro antes de responder.' IN v_definition) = 0 THEN
    -- Already corrected by a clean execution of the consolidated migration.
    RETURN;
  END IF;

  v_patched := regexp_replace(
    v_definition,
    'IF[[:space:]]+v_deadline[[:space:]]+IS[[:space:]]+NULL[[:space:]]+THEN[[:space:]]+RAISE[[:space:]]+EXCEPTION[[:space:]]+''Inicie o cronômetro antes de responder\.'';[[:space:]]+ELSIF[[:space:]]+v_deadline[[:space:]]+<=[[:space:]]+now\(\)[[:space:]]+THEN',
    v_replacement,
    'i'
  );

  IF v_patched = v_definition
     OR position('Inicie o cronômetro antes de responder.' IN v_patched) > 0 THEN
    RAISE EXCEPTION 'Could not safely restore the V1 timer fallback in answer_quiz.';
  END IF;

  EXECUTE v_patched;
END;
$$;

REVOKE ALL ON FUNCTION public.record_quiz_timeout(uuid, integer, integer) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_quiz_question_timers() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.expire_quiz_question_timers() TO authenticated;

-- Clean legacy rows immediately at deploy time. The runtime function above
-- continues enforcing the same rule for future day/session transitions.
DELETE FROM public.quiz_question_timers t
WHERE NOT EXISTS (
  SELECT 1
  FROM public.quiz_attempts qa
  WHERE qa.user_id = t.user_id
    AND qa.ultimo_dia_acesso = ((now() AT TIME ZONE 'America/Sao_Paulo')::date)::text
    AND t.sticker_number = ANY(coalesce(qa.perguntas_pendentes, '{}'::integer[]))
);

NOTIFY pgrst, 'reload schema';
