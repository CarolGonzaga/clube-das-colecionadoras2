-- Transfer rare eligibility from sticker 258 to sticker 28.
-- 258 remains a common shop sticker. 28 can roll rare only through the legacy
-- random redemption-code packs whose pool is 21..193.

-- Patch only the rare list inside the current purchased-pack implementation,
-- preserving payment validation, ledger events and reveal behavior.
DO $$
DECLARE
  definition text;
  patched text;
BEGIN
  SELECT pg_get_functiondef(to_regprocedure('public.open_purchased_pack(uuid)'))
  INTO definition;

  patched := replace(definition, '(258, 298, 194, 292)', '(298, 194, 292)');
  patched := replace(patched, '(194, 258, 292, 298)', '(194, 292, 298)');

  IF patched = definition AND definition ~ '258' THEN
    RAISE EXCEPTION 'Could not safely remove sticker 258 from open_purchased_pack rare list';
  END IF;

  EXECUTE patched;
END $$;

-- Patch the random code implementation, not public.redeem_code(text). The
-- public dispatcher must remain intact so exact author codes keep working.
DO $$
DECLARE
  definition text;
  patched text;
BEGIN
  SELECT pg_get_functiondef(to_regprocedure('public.redeem_code_legacy(text)'))
  INTO definition;

  patched := replace(definition,
    '(167, 47, 112, 45, 79, 164)',
    '(28, 167, 47, 112, 45, 79, 164)');
  patched := replace(patched,
    '(45, 47, 79, 112, 164, 167)',
    '(28, 45, 47, 79, 112, 164, 167)');
  -- Keep the globally established rare chance at 40%.
  patched := replace(patched, 'random() < 0.30', 'random() < 0.40');
  patched := replace(patched, 'chance de 30%', 'chance de 40%');

  IF patched = definition
    AND definition !~ '\(28, 167, 47, 112, 45, 79, 164\)'
    AND definition !~ '\(28, 45, 47, 79, 112, 164, 167\)'
  THEN
    RAISE EXCEPTION 'Could not safely add sticker 28 to redeem_code_legacy rare list';
  END IF;

  EXECUTE patched;
END $$;

-- The full-album rare reward and frontend use the same canonical set of 30.
CREATE OR REPLACE FUNCTION public.claim_album_completion_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_distinct_count integer;
  v_rare_numbers integer[] := ARRAY[
    1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,
    28,45,47,79,112,164,167,194,292,298
  ];
  v_num integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autorizado.';
  END IF;

  SELECT count(DISTINCT sticker_number) INTO v_distinct_count
  FROM public.user_stickers
  WHERE user_id = v_uid AND copies > 0;

  IF coalesce(v_distinct_count, 0) < 360 THEN
    RAISE EXCEPTION 'É necessário possuir 100%% das 360 figurinhas do álbum para resgatar a recompensa de raras.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.album_completion_rewards WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'A recompensa de 100%% do álbum já foi resgatada anteriormente.';
  END IF;

  FOREACH v_num IN ARRAY v_rare_numbers LOOP
    INSERT INTO public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    VALUES (v_uid, v_num, 1, true, now())
    ON CONFLICT (user_id, sticker_number) DO UPDATE
    SET is_rare = true;
  END LOOP;

  INSERT INTO public.album_completion_rewards (user_id) VALUES (v_uid);

  RETURN jsonb_build_object(
    'claimed', true,
    'message', 'Recompensa de 100% do álbum resgatada com sucesso! Todas as raras foram coladas em seu álbum.',
    'rare_numbers', to_jsonb(v_rare_numbers)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_album_completion_reward() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_album_completion_reward() TO authenticated;

-- Clean contaminated existing state and generated-but-not-opened shop packs.
UPDATE public.user_stickers
SET is_rare = false
WHERE sticker_number = 258 AND is_rare = true;

UPDATE public.purchase_pack_stickers
SET is_rare = false
WHERE sticker_number = 258 AND is_rare = true;

-- Quiz rarity history must not keep an impossible rare flag for sticker 258.
UPDATE public.quiz_reward_rarities
SET is_rare = false
WHERE sticker_number = 258 AND is_rare = true;

NOTIFY pgrst, 'reload schema';
