-- 1. Daily elements: only the four daily cosmetics remain in this flow.
-- story-layout is controlled exclusively by owning stickers 1..193.

DO $$
BEGIN
  IF to_regprocedure('public.claim_daily_element_legacy()') IS NULL THEN
    ALTER FUNCTION public.claim_daily_element() RENAME TO claim_daily_element_legacy;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.claim_daily_element()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  result jsonb;
  daily_complete boolean;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT count(*) = 4 INTO daily_complete
  FROM public.user_styles
  WHERE user_id = caller_id
    AND style_id IN ('lilac', 'avatar-neon-frame', 'new-icon', 'theme-dark')
    AND unlocked = true;

  IF daily_complete THEN
    RETURN jsonb_build_object(
      'claimed', false,
      'unlocked', false,
      'all_claimed', true,
      'message', 'Não há mais nenhum resgate novo. Volte no próximo dia para mais novidades!'
    );
  END IF;

  result := public.claim_daily_element_legacy();

  SELECT count(*) = 4 INTO daily_complete
  FROM public.user_styles
  WHERE user_id = caller_id
    AND style_id IN ('lilac', 'avatar-neon-frame', 'new-icon', 'theme-dark')
    AND unlocked = true;

  RETURN result || jsonb_build_object('all_claimed', daily_complete);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_daily_element() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_daily_element() TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_story_layout_unlock(target_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_count integer;
BEGIN
  SELECT count(DISTINCT sticker_number) INTO base_count
  FROM public.user_stickers
  WHERE user_id = target_user
    AND sticker_number BETWEEN 1 AND 193
    AND copies > 0;

  INSERT INTO public.user_styles (user_id, style_id, unlocked, enabled)
  VALUES (target_user, 'story-layout', base_count = 193, false)
  ON CONFLICT (user_id, style_id) DO UPDATE
  SET unlocked = (base_count = 193),
      enabled = CASE WHEN base_count = 193 THEN public.user_styles.enabled ELSE false END;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_story_layout_from_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_story_layout_unlock(coalesce(NEW.user_id, OLD.user_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_story_layout_from_inventory_trg ON public.user_stickers;
CREATE TRIGGER sync_story_layout_from_inventory_trg
AFTER INSERT OR UPDATE OF copies OR DELETE ON public.user_stickers
FOR EACH ROW EXECUTE FUNCTION public.sync_story_layout_from_inventory();

DO $$
DECLARE
  profile_row record;
BEGIN
  FOR profile_row IN SELECT id FROM public.profiles LOOP
    PERFORM public.sync_story_layout_unlock(profile_row.id);
  END LOOP;
END $$;

-- 2. Collection rewards: preserve the current rigorous validation in the
-- legacy function, then append two more rewards under the same pack rules.
DO $$
BEGIN
  IF to_regprocedure('public.claim_collection_reward_single(text)') IS NULL THEN
    ALTER FUNCTION public.claim_collection_reward(text) RENAME TO claim_collection_reward_single;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.claim_collection_reward(tag_name_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  reveals jsonb;
  package_numbers integer[] := '{}'::integer[];
  available_pool integer[];
  target_number integer;
  target_slug text;
  was_new boolean;
  draw_idx integer;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  reveals := public.claim_collection_reward_single(tag_name_param);

  SELECT coalesce(array_agg((item->>'number')::integer), '{}'::integer[])
  INTO package_numbers
  FROM jsonb_array_elements(coalesce(reveals, '[]'::jsonb)) item
  WHERE item ? 'number' AND (item->>'number')::integer > 0;

  FOR draw_idx IN 2..3 LOOP
    available_pool := public.pack_available_pool(
      ARRAY(SELECT generate_series(21, 193)),
      package_numbers
    );
    target_number := public.draw_non_quiz_sticker(caller_id, available_pool);
    package_numbers := array_append(package_numbers, target_number);

    SELECT slug INTO target_slug FROM public.stickers WHERE number = target_number;
    SELECT NOT EXISTS (
      SELECT 1 FROM public.user_stickers
      WHERE user_id = caller_id AND sticker_number = target_number AND copies > 0
    ) INTO was_new;

    INSERT INTO public.user_stickers
      (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    VALUES (caller_id, target_number, 1, false, now())
    ON CONFLICT (user_id, sticker_number) DO UPDATE
    SET copies = public.user_stickers.copies + 1;

    reveals := reveals || jsonb_build_object(
      'slug', coalesce(target_slug, 'sticker-' || target_number::text),
      'number', target_number,
      'wasNew', was_new,
      'isRare', false,
      'repeat', NOT was_new,
      'reward', 'collection_' || tag_name_param
    );
  END LOOP;

  RETURN reveals;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_collection_reward(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_collection_reward(text) TO authenticated;

-- 3. Raise the still-legacy standalone promotional rare roll from 30% to 40%.
DO $$
DECLARE
  function_definition text;
BEGIN
  IF to_regprocedure('public.redeem_code_legacy(text)') IS NOT NULL THEN
    SELECT pg_get_functiondef(to_regprocedure('public.redeem_code_legacy(text)'))
    INTO function_definition;

    function_definition := replace(function_definition, 'random() < 0.30', 'random() < 0.40');
    function_definition := replace(function_definition, 'chance de 30%', 'chance de 40%');
    EXECUTE function_definition;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
