-- Add the WhatsApp promotions group click mission. Its reward pool is 21..193
-- without changing the helper shared by older missions and family rewards.

CREATE OR REPLACE FUNCTION public.complete_mission(mission_id_param text)
RETURNS jsonb AS $$
DECLARE
  user_id_param uuid;
  target_sticker integer;
  was_new boolean;
  reveals jsonb := '[]'::jsonb;
  progression_reveals jsonb;
  pool_numbers integer[];
BEGIN
  user_id_param := auth.uid();
  IF user_id_param IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.mission_completions
    WHERE user_id = user_id_param AND mission_id = mission_id_param
  ) THEN
    RAISE EXCEPTION 'Você já concluiu esta missão!';
  END IF;

  IF mission_id_param NOT IN (
    'whatsapp', 'x', 'instagram', 'tiktok', 'copy-link', 'promotions-group'
  ) THEN
    RAISE EXCEPTION 'Missão inválida';
  END IF;

  INSERT INTO public.mission_completions (user_id, mission_id)
  VALUES (user_id_param, mission_id_param);

  IF mission_id_param = 'promotions-group' THEN
    SELECT array_agg(sticker_number ORDER BY sticker_number)
    INTO pool_numbers
    FROM generate_series(21, 193) AS pool(sticker_number);

    target_sticker := public.draw_non_quiz_sticker(user_id_param, pool_numbers);
  ELSE
    target_sticker := public.get_random_pool_sticker(user_id_param);
  END IF;

  INSERT INTO public.user_stickers
    (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  VALUES
    (user_id_param, target_sticker, 1, false, now())
  ON CONFLICT (user_id, sticker_number) DO UPDATE
  SET copies = public.user_stickers.copies + 1
  RETURNING (copies = 1) INTO was_new;

  reveals := reveals || jsonb_build_object(
    'slug', 'mission-reward',
    'number', target_sticker,
    'wasNew', was_new,
    'isRare', false,
    'repeat', NOT was_new,
    'reward', 'mission_' || mission_id_param
  );

  progression_reveals := public.check_and_grant_rewards(user_id_param);
  reveals := reveals || progression_reveals;

  RETURN jsonb_build_object('success', true, 'reveals', reveals);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.complete_mission(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.complete_mission(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
