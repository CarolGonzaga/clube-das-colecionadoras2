-- Read-only post-deploy verification for the quiz runtime.

SELECT
  count(*) AS total_question_versions,
  count(DISTINCT sticker_number) AS stickers_with_questions,
  count(*) FILTER (WHERE cardinality(options) = 4) AS versions_with_four_options
FROM public.quiz_questions
WHERE sticker_number BETWEEN 1 AND 20;

SELECT
  sticker_number,
  count(*) AS versions
FROM public.quiz_questions
WHERE sticker_number BETWEEN 1 AND 20
GROUP BY sticker_number
HAVING count(*) <> 2
ORDER BY sticker_number;

SELECT
  to_regprocedure('public.get_quiz_questions_for_today()') IS NOT NULL AS has_daily_loader,
  to_regprocedure('public.start_quiz_question_timer(integer,integer)') IS NOT NULL AS has_timer_start,
  to_regprocedure('public.expire_quiz_question_timers()') IS NOT NULL AS has_timer_expiry,
  to_regprocedure('public.answer_quiz(integer,integer,integer)') IS NOT NULL AS has_answer_rpc;

SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quiz_answers'
      AND column_name = 'attempt_day'
  ) AS has_attempt_day,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quiz_answers'
      AND column_name = 'reward_is_rare'
  ) AS has_reward_rarity,
  to_regclass('public.user_points') IS NOT NULL AS has_v2_wallet;

SELECT
  count(*) AS stale_timers
FROM public.quiz_question_timers t
WHERE NOT EXISTS (
  SELECT 1
  FROM public.quiz_attempts qa
  WHERE qa.user_id = t.user_id
    AND qa.ultimo_dia_acesso = ((now() AT TIME ZONE 'America/Sao_Paulo')::date)::text
    AND t.sticker_number = ANY(coalesce(qa.perguntas_pendentes, '{}'::integer[]))
);
