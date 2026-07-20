-- ============================================================
-- MIGRATION: UNLOCK ALL QUIZ QUESTIONS FOR USER f8721040-035f-414a-8153-b5e12fec64d7
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_quiz_questions_for_today()
RETURNS jsonb AS $$
DECLARE
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
  i integer;
BEGIN
  user_id_param := auth.uid();
  IF user_id_param IS NULL THEN
    RAISE EXCEPTION 'Não autorizado.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id_param) THEN
    INSERT INTO public.profiles (id, nick, avatar_emoji, mural_opt_in)
    VALUES (user_id_param, 'Colecionadora', '📷', false);
  END IF;

  current_day := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD');

  SELECT * INTO attempt_row FROM public.quiz_attempts WHERE user_id = user_id_param;

  -- CASO ESPECIAL: Usuária f8721040-035f-414a-8153-b5e12fec64d7 recebe TODAS as perguntas do quiz não obtidas de uma vez
  IF user_id_param = 'f8721040-035f-414a-8153-b5e12fec64d7'::uuid THEN
    SELECT array_agg(number ORDER BY number) INTO final_pool
    FROM (VALUES 
      (1), (2), (3), (4), (5), (6), (7), (8), (9), (10),
      (11), (12), (13), (14), (15), (16), (17), (18), (19), (20)
    ) AS all_q(number)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_stickers us 
      WHERE us.user_id = user_id_param 
        AND us.sticker_number = all_q.number 
        AND us.copies > 0
    );

    IF final_pool IS NULL THEN
      final_pool := '{}'::integer[];
    END IF;

    IF NOT FOUND OR attempt_row.user_id IS NULL THEN
      INSERT INTO public.quiz_attempts (user_id, ultimo_dia_acesso, tentativas_hoje_count, dia_atual, perguntas_pendentes)
      VALUES (user_id_param, current_day, 0, 1, final_pool)
      RETURNING * INTO attempt_row;
    ELSE
      UPDATE public.quiz_attempts
      SET ultimo_dia_acesso = current_day,
          tentativas_hoje_count = 0,
          perguntas_pendentes = final_pool
      WHERE user_id = user_id_param
      RETURNING * INTO attempt_row;
    END IF;

  ELSIF NOT FOUND THEN
    SELECT array_agg(sticker_number) INTO final_pool FROM (
      SELECT number AS sticker_number
      FROM (VALUES 
        (1), (2), (3), (4), (5), (6), (7), (8), (9), (10),
        (11), (12), (13), (14), (15), (16), (17), (18), (19), (20)
      ) AS all_q(number)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.user_stickers us WHERE us.user_id = user_id_param AND us.sticker_number = all_q.number AND us.copies > 0
      )
      ORDER BY random() LIMIT 4
    ) q;

    IF final_pool IS NULL THEN
      final_pool := '{}'::integer[];
    END IF;

    INSERT INTO public.quiz_attempts (user_id, ultimo_dia_acesso, tentativas_hoje_count, dia_atual, perguntas_pendentes)
    VALUES (user_id_param, current_day, 0, 1, final_pool)
    RETURNING * INTO attempt_row;
    
  ELSIF attempt_row.ultimo_dia_acesso <> current_day THEN
    new_dia_atual := attempt_row.dia_atual + 1;
    
    SELECT array_agg(distinct sticker_number) INTO erradas_ids FROM (
      SELECT qa.sticker_number
      FROM public.quiz_answers qa
      WHERE qa.user_id = user_id_param 
        AND qa.correct = false
        AND NOT EXISTS (
          SELECT 1 FROM public.user_stickers us WHERE us.user_id = user_id_param AND us.sticker_number = qa.sticker_number AND us.copies > 0
        )
      ORDER BY qa.sticker_number ASC
    ) q;

    IF erradas_ids IS NULL THEN
      erradas_ids := '{}'::integer[];
    END IF;

    SELECT array_agg(sticker_number) INTO novas_ids FROM (
      SELECT number AS sticker_number
      FROM (VALUES 
        (1), (2), (3), (4), (5), (6), (7), (8), (9), (10),
        (11), (12), (13), (14), (15), (16), (17), (18), (19), (20)
      ) AS all_q(number)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.user_stickers us WHERE us.user_id = user_id_param AND us.sticker_number = all_q.number AND us.copies > 0
      )
      AND NOT (all_q.number = any(erradas_ids))
      ORDER BY random()
    ) q;

    IF novas_ids IS NULL THEN
      novas_ids := '{}'::integer[];
    END IF;

    final_pool := (erradas_ids || novas_ids)[1:4];

    UPDATE public.quiz_attempts
    SET ultimo_dia_acesso = current_day,
        tentativas_hoje_count = 0,
        dia_atual = new_dia_atual,
        perguntas_pendentes = final_pool
    WHERE user_id = user_id_param
    RETURNING * INTO attempt_row;
  END IF;

  IF array_length(attempt_row.perguntas_pendentes, 1) > 0 THEN
    FOR i IN 1 .. array_upper(attempt_row.perguntas_pendentes, 1) LOOP
      temp_sticker_number := attempt_row.perguntas_pendentes[i];
      temp_q_index := (temp_sticker_number + attempt_row.dia_atual) % 2;

      SELECT text, options, correct_index INTO temp_text, temp_options, temp_correct_index
      FROM public.quiz_questions
      WHERE sticker_number = temp_sticker_number AND q_index = temp_q_index;

      IF temp_text IS NULL THEN
        SELECT text, options, correct_index INTO temp_text, temp_options, temp_correct_index
        FROM public.quiz_questions
        WHERE sticker_number = temp_sticker_number
        LIMIT 1;
      END IF;

      SELECT slug, name, author INTO temp_slug, temp_name, temp_author
      FROM public.stickers
      WHERE number = temp_sticker_number;

      SELECT count(*) INTO temp_errors
      FROM public.quiz_answers
      WHERE user_id = user_id_param AND sticker_number = temp_sticker_number AND correct = false;

      SELECT EXISTS(
        SELECT 1 FROM public.quiz_answers
        WHERE user_id = user_id_param AND sticker_number = temp_sticker_number AND attempt_day = current_day::date
      ), coalesce((
        SELECT correct FROM public.quiz_answers
        WHERE user_id = user_id_param AND sticker_number = temp_sticker_number AND attempt_day = current_day::date
        ORDER BY created_at DESC LIMIT 1
      ), false), (
        SELECT chosen_index FROM public.quiz_answers
        WHERE user_id = user_id_param AND sticker_number = temp_sticker_number AND attempt_day = current_day::date
        ORDER BY created_at DESC LIMIT 1
      )
      INTO temp_answered, temp_correct, temp_chosen_index;

      temp_hide_indices := '{}'::integer[];
      IF temp_errors >= 2 THEN
        SELECT array_agg(opt_idx) INTO temp_hide_indices
        FROM (
          SELECT opt_idx
          FROM generate_series(0, 3) AS opt_idx
          WHERE opt_idx <> temp_correct_index
          ORDER BY random()
          LIMIT 2
        ) sub;
      END IF;

      -- Aplicar embaralhamento determinístico das alternativas
      DECLARE
        h integer;
        perm0 integer; perm1 integer; perm2 integer; perm3 integer;
        tmp_int integer;
        orig_options text[];
        shuffled_options text[];
        shuffled_correct_index integer;
        shuffled_hide_indices integer[] := '{}'::integer[];
        shuffled_chosen_index integer := null;
        idx integer;
      BEGIN
        h := abs(hashtext(user_id_param::text || temp_sticker_number::text || current_day));
        perm0 := 0; perm1 := 1; perm2 := 2; perm3 := 3;

        CASE (h % 4)
          WHEN 0 THEN tmp_int := perm0; perm0 := perm3; perm3 := tmp_int;
          WHEN 1 THEN tmp_int := perm1; perm1 := perm3; perm3 := tmp_int;
          WHEN 2 THEN tmp_int := perm2; perm2 := perm3; perm3 := tmp_int;
          ELSE null;
        END CASE;
        h := h / 4;
        CASE (h % 3)
          WHEN 0 THEN tmp_int := perm0; perm0 := perm2; perm2 := tmp_int;
          WHEN 1 THEN tmp_int := perm1; perm1 := perm2; perm2 := tmp_int;
          ELSE null;
        END CASE;
        h := h / 3;
        IF (h % 2) = 0 THEN
          tmp_int := perm0; perm0 := perm1; perm1 := tmp_int;
        END IF;

        orig_options := temp_options;
        shuffled_options := ARRAY[
          orig_options[perm0 + 1],
          orig_options[perm1 + 1],
          orig_options[perm2 + 1],
          orig_options[perm3 + 1]
        ];

        IF perm0 = temp_correct_index THEN shuffled_correct_index := 0;
        ELSIF perm1 = temp_correct_index THEN shuffled_correct_index := 1;
        ELSIF perm2 = temp_correct_index THEN shuffled_correct_index := 2;
        ELSE shuffled_correct_index := 3;
        END IF;

        IF temp_hide_indices IS NOT NULL THEN
          FOREACH idx IN ARRAY temp_hide_indices LOOP
            IF idx = perm0 THEN shuffled_hide_indices := array_append(shuffled_hide_indices, 0);
            ELSIF idx = perm1 THEN shuffled_hide_indices := array_append(shuffled_hide_indices, 1);
            ELSIF idx = perm2 THEN shuffled_hide_indices := array_append(shuffled_hide_indices, 2);
            ELSIF idx = perm3 THEN shuffled_hide_indices := array_append(shuffled_hide_indices, 3);
            END IF;
          END LOOP;
        END IF;

        IF temp_chosen_index IS NOT NULL AND temp_chosen_index >= 0 THEN
          IF temp_chosen_index = perm0 THEN shuffled_chosen_index := 0;
          ELSIF temp_chosen_index = perm1 THEN shuffled_chosen_index := 1;
          ELSIF temp_chosen_index = perm2 THEN shuffled_chosen_index := 2;
          ELSIF temp_chosen_index = perm3 THEN shuffled_chosen_index := 3;
          END IF;
        END IF;

        q_item := jsonb_build_object(
          'stickerNumber', temp_sticker_number,
          'slug', temp_slug,
          'name', temp_name,
          'author', temp_author,
          'qIndex', temp_q_index,
          'text', temp_text,
          'options', to_jsonb(shuffled_options),
          'correctIndex', shuffled_correct_index,
          'errorsCount', temp_errors,
          'answeredToday', coalesce(temp_answered, false),
          'answeredCorrectToday', coalesce(temp_correct, false),
          'chosenIndexToday', shuffled_chosen_index,
          'hiddenOptionIndices', to_jsonb(shuffled_hide_indices)
        );
        questions_list := questions_list || q_item;
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'diaAtual', attempt_row.dia_atual,
    'tentativasHojeCount', attempt_row.tentativas_hoje_count,
    'perguntasRespondidasCorretasCount', (
      SELECT count(distinct sticker_number) FROM public.quiz_answers WHERE user_id = user_id_param AND correct = true
    ),
    'questions', questions_list
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_quiz_questions_for_today() TO authenticated;

-- Executar atualização imediata das perguntas pendentes para a usuária f8721040-035f-414a-8153-b5e12fec64d7
DO $$
DECLARE
  v_pool integer[];
BEGIN
  SELECT array_agg(number ORDER BY number) INTO v_pool
  FROM (VALUES 
    (1), (2), (3), (4), (5), (6), (7), (8), (9), (10),
    (11), (12), (13), (14), (15), (16), (17), (18), (19), (20)
  ) AS all_q(number)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_stickers us 
    WHERE us.user_id = 'f8721040-035f-414a-8153-b5e12fec64d7'::uuid 
      AND us.sticker_number = all_q.number 
      AND us.copies > 0
  );

  IF v_pool IS NULL THEN
    v_pool := '{}'::integer[];
  END IF;

  INSERT INTO public.quiz_attempts (user_id, ultimo_dia_acesso, tentativas_hoje_count, dia_atual, perguntas_pendentes)
  VALUES ('f8721040-035f-414a-8153-b5e12fec64d7'::uuid, to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'), 0, 1, v_pool)
  ON CONFLICT (user_id) DO UPDATE
  SET perguntas_pendentes = v_pool,
      ultimo_dia_acesso = to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD');
END $$;
