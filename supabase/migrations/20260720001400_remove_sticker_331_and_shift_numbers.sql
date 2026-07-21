-- ============================================================
-- MIGRATION: Remove sticker 331 (24h-para-correr-ilustracao-1) 
-- and shift sticker numbers 332..361 to 331..360
-- ============================================================

DO $$
BEGIN
  -- Deletar todas as referências da figurinha 331
  DELETE FROM public.user_stickers WHERE sticker_number = 331;
  DELETE FROM public.purchase_pack_stickers WHERE sticker_number = 331;
  DELETE FROM public.shop_pack_stickers WHERE sticker_number = 331;
  DELETE FROM public.quiz_questions WHERE sticker_number = 331;
  DELETE FROM public.quiz_answers WHERE sticker_number = 331;
  DELETE FROM public.quiz_question_timers WHERE sticker_number = 331;
  DELETE FROM public.quiz_reward_rarities WHERE sticker_number = 331;
  DELETE FROM public.redeem_pools WHERE sticker_number = 331;
  DELETE FROM public.trade_requests WHERE initiator_sticker = 331 OR receiver_sticker = 331;
  DELETE FROM public.stickers WHERE number = 331;

  -- 1. Inverter o sinal para evitar qualquer conflito de chave única / chave primária durante o reordenamento
  UPDATE public.user_stickers SET sticker_number = -sticker_number WHERE sticker_number > 331;
  UPDATE public.purchase_pack_stickers SET sticker_number = -sticker_number WHERE sticker_number > 331;
  UPDATE public.shop_pack_stickers SET sticker_number = -sticker_number WHERE sticker_number > 331;
  UPDATE public.quiz_questions SET sticker_number = -sticker_number WHERE sticker_number > 331;
  UPDATE public.quiz_answers SET sticker_number = -sticker_number WHERE sticker_number > 331;
  UPDATE public.quiz_question_timers SET sticker_number = -sticker_number WHERE sticker_number > 331;
  UPDATE public.quiz_reward_rarities SET sticker_number = -sticker_number WHERE sticker_number > 331;
  UPDATE public.redeem_pools SET sticker_number = -sticker_number WHERE sticker_number > 331;
  UPDATE public.trade_requests SET initiator_sticker = -initiator_sticker WHERE initiator_sticker > 331;
  UPDATE public.trade_requests SET receiver_sticker = -receiver_sticker WHERE receiver_sticker > 331;
  UPDATE public.stickers SET number = -number WHERE number > 331;

  -- 2. Converter de volta ajustando o número final (-1 da posição original)
  UPDATE public.user_stickers SET sticker_number = (-sticker_number) - 1 WHERE sticker_number < -331;
  UPDATE public.purchase_pack_stickers SET sticker_number = (-sticker_number) - 1 WHERE sticker_number < -331;
  UPDATE public.shop_pack_stickers SET sticker_number = (-sticker_number) - 1 WHERE sticker_number < -331;
  UPDATE public.quiz_questions SET sticker_number = (-sticker_number) - 1 WHERE sticker_number < -331;
  UPDATE public.quiz_answers SET sticker_number = (-sticker_number) - 1 WHERE sticker_number < -331;
  UPDATE public.quiz_question_timers SET sticker_number = (-sticker_number) - 1 WHERE sticker_number < -331;
  UPDATE public.quiz_reward_rarities SET sticker_number = (-sticker_number) - 1 WHERE sticker_number < -331;
  UPDATE public.redeem_pools SET sticker_number = (-sticker_number) - 1 WHERE sticker_number < -331;
  UPDATE public.trade_requests SET initiator_sticker = (-initiator_sticker) - 1 WHERE initiator_sticker < -331;
  UPDATE public.trade_requests SET receiver_sticker = (-receiver_sticker) - 1 WHERE receiver_sticker < -331;
  UPDATE public.stickers SET number = (-number) - 1 WHERE number < -331;

  -- 3. Atualizar tipo da figurinha 360 (antiga 361) para 'bonus'
  UPDATE public.stickers SET type = 'bonus' WHERE number = 360;
END $$;

-- Atualizar a função check_and_grant_rewards para desbloquear a figurinha #360 quando o usuário tiver as 359 figurinhas base
CREATE OR REPLACE FUNCTION public.check_and_grant_rewards(user_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  granted_in_loop boolean := true;
  total_count integer;
  count_1_359 integer;
  reveals jsonb := '[]'::jsonb;
BEGIN
  WHILE granted_in_loop LOOP
    granted_in_loop := false;

    -- Contar figurinhas distintas coladas entre 1 e 359
    SELECT count(distinct sticker_number) INTO count_1_359
    FROM public.user_stickers us
    WHERE us.user_id = user_id_param AND us.sticker_number BETWEEN 1 AND 359 AND us.copies > 0;

    -- Desbloqueio da figurinha #360 ao completar as 359 figurinhas base
    IF count_1_359 >= 359 AND NOT EXISTS (SELECT 1 FROM public.reward_grants WHERE user_id = user_id_param AND reward_key = 'collection_1_359') THEN
      INSERT INTO public.reward_grants (user_id, reward_key) VALUES (user_id_param, 'collection_1_359');
      
      INSERT INTO public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      VALUES (user_id_param, 360, 1, false, now())
      ON CONFLICT (user_id, sticker_number) DO UPDATE SET copies = public.user_stickers.copies + 1;

      reveals := reveals || jsonb_build_object(
        'slug', 'extra',
        'number', 360,
        'wasNew', true,
        'isRare', false,
        'repeat', false,
        'reward', 'collection_1_359',
        'rewardMessage', 'Parabéns! Você completou as 359 figurinhas e desbloqueou a figurinha de agradecimento!'
      );
      granted_in_loop := true;

    -- Total 100 -> Poster Reward
    ELSIF (SELECT count(*) FROM public.user_stickers WHERE user_id = user_id_param AND copies > 0) >= 100 
      AND NOT EXISTS (SELECT 1 FROM public.reward_grants WHERE user_id = user_id_param AND reward_key = 'poster') THEN
      INSERT INTO public.reward_grants (user_id, reward_key) VALUES (user_id_param, 'poster');
      reveals := reveals || jsonb_build_object(
        'slug', 'poster',
        'number', 0,
        'wasNew', true,
        'isRare', false,
        'repeat', false,
        'reward', 'poster',
        'rewardMessage', 'Parabéns! Você alcançou 100 figurinhas no álbum e desbloqueou o Gerador de Pôster!'
      );
      granted_in_loop := true;
    END IF;
  END LOOP;

  RETURN reveals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.check_and_grant_rewards(uuid) TO authenticated;

-- Forçar recarregamento do cache do PostgREST
NOTIFY pgrst, 'reload schema';
