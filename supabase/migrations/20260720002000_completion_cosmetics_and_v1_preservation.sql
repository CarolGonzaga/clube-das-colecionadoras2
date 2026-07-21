-- New V2 accounts unlock glitter and goldframe only after owning 1..193.
-- Migrated V1 accounts keep their imported style state exactly as it is.

CREATE OR REPLACE FUNCTION public.sync_completion_cosmetics(target_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_v1_user boolean := false;
  completed_base boolean;
BEGIN
  IF to_regclass('public.v1_staging_user_styles') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.v1_staging_user_styles WHERE user_id = $1)'
    INTO is_v1_user USING target_user;
  END IF;

  IF is_v1_user THEN RETURN; END IF;

  SELECT count(DISTINCT sticker_number) = 193 INTO completed_base
  FROM public.user_stickers
  WHERE user_id = target_user AND sticker_number BETWEEN 1 AND 193 AND copies > 0;

  INSERT INTO public.user_styles (user_id, style_id, unlocked, enabled)
  VALUES
    (target_user, 'glitter', completed_base, false),
    (target_user, 'goldframe', completed_base, false)
  ON CONFLICT (user_id, style_id) DO UPDATE
  SET unlocked = completed_base,
      enabled = CASE WHEN completed_base THEN public.user_styles.enabled ELSE false END;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_completion_cosmetics_inventory_changed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.sync_completion_cosmetics(coalesce(NEW.user_id, OLD.user_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS user_stickers_grant_goldframe ON public.user_stickers;
DROP TRIGGER IF EXISTS sync_completion_cosmetics_trg ON public.user_stickers;
CREATE TRIGGER sync_completion_cosmetics_trg
AFTER INSERT OR UPDATE OF copies OR DELETE ON public.user_stickers
FOR EACH ROW EXECUTE FUNCTION public.on_completion_cosmetics_inventory_changed();

DO $$
DECLARE profile_row record;
BEGIN
  FOR profile_row IN SELECT id FROM public.profiles LOOP
    PERFORM public.sync_completion_cosmetics(profile_row.id);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
