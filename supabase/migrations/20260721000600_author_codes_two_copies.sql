-- Author packages keep their existing two-account redemption limit, but each
-- successful redemption now grants two copies of every listed sticker.

ALTER TABLE public.redeem_codes
  ADD COLUMN IF NOT EXISTS copies_per_sticker integer NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.redeem_codes'::regclass
      AND conname = 'redeem_codes_copies_per_sticker_positive'
  ) THEN
    ALTER TABLE public.redeem_codes
      ADD CONSTRAINT redeem_codes_copies_per_sticker_positive
      CHECK (copies_per_sticker > 0);
  END IF;
END $$;

UPDATE public.redeem_codes
SET copies_per_sticker = 2,
    max_redemptions = 2
WHERE grant_all_pool = true
  AND label LIKE 'Pacote de %';

-- Quiz and shop-exclusive stickers normally remain capped at one copy. The
-- transaction-local flag below permits the second copy only while the secured
-- author-code RPC is running.
CREATE OR REPLACE FUNCTION public.enforce_no_duplicate_rare_or_exclusive()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.author_code_two_copies', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.sticker_number BETWEEN 1 AND 20
     OR NEW.sticker_number BETWEEN 320 AND 360 THEN
    IF NEW.copies > 1 THEN
      NEW.copies := 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regprocedure('public.redeem_exact_code_single_copy(text)') IS NULL THEN
    IF to_regprocedure('public.redeem_exact_code(text)') IS NULL THEN
      RAISE EXCEPTION 'redeem_exact_code(text) não encontrada; migração cancelada.';
    END IF;
    ALTER FUNCTION public.redeem_exact_code(text)
      RENAME TO redeem_exact_code_single_copy;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.redeem_exact_code(code_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_code text := upper(btrim(code_param));
  v_result jsonb;
  v_reveals jsonb;
  v_copies integer;
  v_number integer;
  v_slug text;
  v_extra_index integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autorizado.';
  END IF;

  -- This flag is scoped to this transaction and is invisible to normal client
  -- inserts. It lets author packages contain two exclusive copies as requested.
  PERFORM set_config('app.author_code_two_copies', 'on', true);

  -- The preserved function owns validation, redemption limits, the first copy
  -- and progression grants. If any step below fails, the whole call rolls back.
  v_result := public.redeem_exact_code_single_copy(v_code);
  v_reveals := coalesce(v_result->'reveals', '[]'::jsonb);

  SELECT copies_per_sticker INTO v_copies
  FROM public.redeem_codes
  WHERE code = v_code;

  FOR v_number IN
    SELECT sticker_number
    FROM public.redeem_pools
    WHERE code = v_code
    ORDER BY sticker_number
  LOOP
    SELECT slug INTO v_slug
    FROM public.stickers
    WHERE number = v_number;

    IF v_slug IS NULL THEN
      RAISE EXCEPTION 'Figurinha % não encontrada.', v_number;
    END IF;

    FOR v_extra_index IN 2..greatest(coalesce(v_copies, 1), 1) LOOP
      INSERT INTO public.user_stickers
        (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      VALUES (v_uid, v_number, 1, false, now())
      ON CONFLICT (user_id, sticker_number) DO UPDATE
        SET copies = public.user_stickers.copies + 1;

      v_reveals := v_reveals || jsonb_build_object(
        'slug', v_slug,
        'number', v_number,
        'wasNew', false,
        'isRare', false,
        'repeat', true,
        'reward', null
      );
    END LOOP;
  END LOOP;

  RETURN jsonb_set(v_result, '{reveals}', v_reveals, true);
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_exact_code_single_copy(text)
  FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.redeem_exact_code(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.redeem_exact_code(text) TO authenticated;
