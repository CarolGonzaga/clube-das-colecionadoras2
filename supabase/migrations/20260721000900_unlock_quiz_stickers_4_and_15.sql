-- Libera somente as duas questões restantes solicitadas para a conta de teste.
-- As demais respostas e recompensas do quiz permanecem intactas.
DO $$
DECLARE
  v_user_id uuid := 'f8721040-035f-414a-8153-b5e12fec64d7'::uuid;
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_attempts_today integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'Usuária do quiz não encontrada.';
  END IF;

  IF (
    SELECT count(DISTINCT sticker_number) FROM public.quiz_questions
    WHERE sticker_number IN (4, 15)
  ) < 2 THEN
    RAISE EXCEPTION 'As perguntas das figurinhas 4 e 15 não estão cadastradas.';
  END IF;

  DELETE FROM public.quiz_question_timers
  WHERE user_id = v_user_id
    AND sticker_number IN (4, 15);

  DELETE FROM public.quiz_reward_rarities
  WHERE user_id = v_user_id
    AND sticker_number IN (4, 15);

  DELETE FROM public.quiz_answers
  WHERE user_id = v_user_id
    AND sticker_number IN (4, 15);

  -- Essas duas figurinhas voltarão a ser entregues pelas respectivas respostas.
  DELETE FROM public.user_stickers
  WHERE user_id = v_user_id
    AND sticker_number IN (4, 15);

  SELECT count(*)::integer INTO v_attempts_today
  FROM public.quiz_answers
  WHERE user_id = v_user_id
    AND attempt_day = v_today;

  INSERT INTO public.quiz_attempts (
    user_id,
    ultimo_dia_acesso,
    tentativas_hoje_count,
    dia_atual,
    perguntas_pendentes
  ) VALUES (
    v_user_id,
    v_today::text,
    v_attempts_today,
    1,
    ARRAY[4, 15]::integer[]
  )
  ON CONFLICT (user_id) DO UPDATE SET
    ultimo_dia_acesso = excluded.ultimo_dia_acesso,
    tentativas_hoje_count = excluded.tentativas_hoje_count,
    perguntas_pendentes = excluded.perguntas_pendentes;
END $$;
