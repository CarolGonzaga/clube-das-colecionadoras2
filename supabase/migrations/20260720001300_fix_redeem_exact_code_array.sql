-- Fix redeem_exact_code to append jsonb_build_object directly instead of wrapping in jsonb_build_array
CREATE OR REPLACE FUNCTION public.redeem_exact_code(code_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_param uuid := auth.uid();
  code_clean text := upper(btrim(code_param));
  code_row public.redeem_codes%rowtype;
  pool_numbers integer[];
  target_number integer;
  target_slug text;
  was_new boolean;
  redemption_count integer;
  reveals jsonb := '[]'::jsonb;
  progression_reveals jsonb := '[]'::jsonb;
  release_date_str text;
  release_date_val timestamptz;
  days_elapsed integer;
BEGIN
  IF user_id_param IS NULL THEN
    RAISE EXCEPTION 'Não autorizado.';
  END IF;

  SELECT * INTO code_row
  FROM public.redeem_codes
  WHERE code = code_clean
    AND active = true
    AND grant_all_pool = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código inválido.';
  END IF;

  SELECT value INTO release_date_str
  FROM public.app_settings
  WHERE key = 'release_date';

  IF release_date_str IS NULL THEN
    release_date_val := '2026-07-02 00:00:00+00'::timestamptz;
  ELSE
    release_date_val := (release_date_str || ' 00:00:00+00')::timestamptz;
  END IF;

  days_elapsed := floor(extract(epoch from (now() - release_date_val)) / 86400)::integer + 1;
  IF days_elapsed < code_row.release_day THEN
    RAISE EXCEPTION 'Este código promocional ainda não está ativo.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.reward_grants
    WHERE user_id = user_id_param
      AND reward_key = 'code_' || code_clean
  ) THEN
    RAISE EXCEPTION 'Você já usou esse código.';
  END IF;

  SELECT count(*) INTO redemption_count
  FROM public.reward_grants
  WHERE reward_key = 'code_' || code_clean;

  IF code_row.max_redemptions IS NOT NULL
    AND redemption_count >= code_row.max_redemptions THEN
    RAISE EXCEPTION 'Este código atingiu o limite de resgates.';
  END IF;

  SELECT array_agg(sticker_number ORDER BY sticker_number)
  INTO pool_numbers
  FROM public.redeem_pools
  WHERE code = code_clean;

  IF pool_numbers IS NULL OR cardinality(pool_numbers) = 0 THEN
    RAISE EXCEPTION 'Pacote do código vazio.';
  END IF;

  INSERT INTO public.reward_grants (user_id, reward_key, granted_at)
  VALUES (user_id_param, 'code_' || code_clean, now());

  FOREACH target_number IN ARRAY pool_numbers LOOP
    SELECT coalesce(s.slug, 'frase-' || target_number)
    INTO target_slug
    FROM public.stickers s
    WHERE s.number = target_number;

    IF target_slug IS NULL THEN
      RAISE EXCEPTION 'Figurinha % não encontrada.', target_number;
    END IF;

    SELECT NOT EXISTS (
      SELECT 1
      FROM public.user_stickers us
      WHERE us.user_id = user_id_param
        AND us.sticker_number = target_number
        AND us.copies > 0
    ) INTO was_new;

    INSERT INTO public.user_stickers (
      user_id,
      sticker_number,
      copies,
      is_rare,
      first_unlocked_at
    )
    VALUES (user_id_param, target_number, 1, false, now())
    ON CONFLICT (user_id, sticker_number) DO UPDATE SET
      copies = public.user_stickers.copies + 1;

    reveals := reveals || jsonb_build_object(
      'slug', target_slug,
      'number', target_number,
      'wasNew', was_new,
      'isRare', false,
      'repeat', NOT was_new,
      'reward', null
    );
  END LOOP;

  progression_reveals := coalesce(public.check_and_grant_rewards(user_id_param), '[]'::jsonb);
  IF jsonb_typeof(progression_reveals) = 'array' THEN
    reveals := reveals || progression_reveals;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reveals', reveals,
    'element', code_row.element
  );
END;
$$;
