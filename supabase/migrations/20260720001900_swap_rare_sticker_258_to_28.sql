-- Migration: troca figurinha rara 258 ? 28
-- Contexto: a figurinha 258 era repetida com a 28 e foi renomeada.
-- A 258 herdou indevidamente a logica de rara. Agora:
--   258 -> apenas versao comum (removida das listas de raras)
--   28  -> tem chance de rara (range 21-193, grupo de sorteio por codigo de resgate)

-- ============================================================
-- 1. open_purchased_pack: remover 258, manter 194, 292, 298
-- ============================================================
CREATE OR REPLACE FUNCTION public.open_purchased_pack(pack_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  pack_row public.purchase_packs%rowtype;
  sticker_row record;
  reveals jsonb := '[]'::jsonb;
  was_new boolean;
  should_be_rare boolean;
  has_rare_already boolean;
  rolled_rare boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO pack_row FROM public.purchase_packs WHERE id = pack_id_param;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pack not found'; END IF;
  IF pack_row.user_id != auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF pack_row.status != 'pending' THEN RAISE EXCEPTION 'Pack already opened'; END IF;

  UPDATE public.purchase_packs SET status = 'opening' WHERE id = pack_id_param;

  FOR sticker_row IN
    SELECT pps.id, pps.sticker_number, pps.position, s.slug, s.name, s.author
    FROM public.purchase_pack_stickers pps
    JOIN public.stickers s ON s.number = pps.sticker_number
    WHERE pps.pack_id = pack_id_param
    ORDER BY pps.position
    FOR UPDATE OF pps
  LOOP
    SELECT NOT EXISTS (
      SELECT 1 FROM public.user_stickers us
      WHERE us.user_id = auth.uid()
        AND us.sticker_number = sticker_row.sticker_number AND us.copies > 0
    ) INTO was_new;

    -- Raras da Loja: 194, 292, 298 - 40% de chance (258 removida)
    should_be_rare := false;
    IF sticker_row.sticker_number IN (194, 292, 298) THEN
      rolled_rare := (random() < 0.40);
      IF rolled_rare THEN
        SELECT coalesce(is_rare, false) INTO has_rare_already
        FROM public.user_stickers
        WHERE user_id = auth.uid() AND sticker_number = sticker_row.sticker_number;
        IF NOT coalesce(has_rare_already, false) THEN should_be_rare := true; END IF;
      END IF;
    END IF;

    IF should_be_rare THEN
      INSERT INTO public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      VALUES (auth.uid(), sticker_row.sticker_number, 1, true, now())
      ON CONFLICT (user_id, sticker_number) DO UPDATE SET copies = public.user_stickers.copies + 1, is_rare = true;
    ELSE
      INSERT INTO public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      VALUES (auth.uid(), sticker_row.sticker_number, 1, false, now())
      ON CONFLICT (user_id, sticker_number) DO UPDATE SET copies = public.user_stickers.copies + 1;
    END IF;

    UPDATE public.purchase_pack_stickers
    SET applied_to_inventory_at = coalesce(applied_to_inventory_at, now()),
        was_new_at_generation = coalesce(was_new_at_generation, was_new),
        was_repeat_at_generation = coalesce(was_repeat_at_generation, NOT was_new),
        is_rare = should_be_rare
    WHERE id = sticker_row.id;

    reveals := reveals || jsonb_build_object(
      'slug', sticker_row.slug, 'number', sticker_row.sticker_number,
      'name', sticker_row.name, 'author', sticker_row.author,
      'wasNew', was_new, 'isRare', should_be_rare,
      'repeat', NOT was_new, 'reward', null
    );
  END LOOP;

  UPDATE public.purchase_packs SET status = 'opened', opened_at = now() WHERE id = pack_id_param;

  IF EXISTS (SELECT 1 FROM public.purchase_packs WHERE order_id = pack_row.order_id AND status = 'pending') THEN
    UPDATE public.purchase_orders SET status = 'partially_opened' WHERE id = pack_row.order_id;
  ELSE
    UPDATE public.purchase_orders SET status = 'completed', completed_at = coalesce(completed_at, now()) WHERE id = pack_row.order_id;
  END IF;

  INSERT INTO public.purchase_events(order_id, user_id, event_type, message, metadata)
  VALUES (pack_row.order_id, auth.uid(), 'pack_opened', 'Pacote aberto e figurinhas aplicadas ao inventario.', jsonb_build_object('pack_id', pack_id_param));

  RETURN reveals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 2. redeem_code: adicionar 28 ao grupo de raras de sorteio
--    Novo grupo: (28, 45, 47, 79, 112, 164, 167) - 30% de chance
--    (28 esta no range 21-193 dos codigos normais)
-- ============================================================
CREATE OR REPLACE FUNCTION public.redeem_code(code_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code_clean text := upper(trim(code_param));
  code_row public.redeem_codes%rowtype;
  pool_numbers integer[];
  package_numbers integer[] := '{}';
  target_number integer;
  target_slug text;
  was_new boolean;
  should_be_rare boolean;
  has_rare_already boolean;
  rolled_rare boolean;
  user_id_param uuid := auth.uid();
  reveals jsonb := '[]'::jsonb;
  progression_reveals jsonb;
  draw_idx integer;
  available_pool integer[];
  release_date_str text;
  release_date_val timestamptz;
  days_elapsed integer;
BEGIN
  IF user_id_param IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO code_row FROM public.redeem_codes WHERE code = code_clean AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Codigo invalido ou inativo.'; END IF;

  SELECT value INTO release_date_str FROM public.app_settings WHERE key = 'release_date' LIMIT 1;
  IF release_date_str IS NULL THEN
    release_date_val := '2026-07-02 00:00:00+00'::timestamptz;
  ELSE
    release_date_val := (release_date_str || ' 00:00:00+00')::timestamptz;
  END IF;

  days_elapsed := floor(extract(epoch FROM (now() - release_date_val)) / 86400)::integer + 1;
  IF days_elapsed < code_row.release_day THEN
    RAISE EXCEPTION 'Este codigo promocional ainda nao esta ativo! Sera liberado no dia % do lancamento.', code_row.release_day;
  END IF;

  IF EXISTS (SELECT 1 FROM public.reward_grants WHERE user_id = user_id_param AND reward_key = 'code_' || code_clean) THEN
    RAISE EXCEPTION 'Voce ja usou esse codigo.';
  END IF;

  SELECT array_agg(sticker_number) INTO pool_numbers FROM public.redeem_pools WHERE code = code_clean;
  IF pool_numbers IS NULL OR array_length(pool_numbers, 1) = 0 THEN RAISE EXCEPTION 'Pool do codigo vazia.'; END IF;

  INSERT INTO public.reward_grants (user_id, reward_key) VALUES (user_id_param, 'code_' || code_clean);

  FOR draw_idx IN 1 .. 5 LOOP
    available_pool := public.pack_available_pool(pool_numbers, package_numbers);
    target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
    package_numbers := array_append(package_numbers, target_number);

    SELECT s.slug INTO target_slug FROM public.stickers s WHERE s.number = target_number;
    IF target_slug IS NULL THEN target_slug := 'frase-' || target_number; END IF;

    SELECT NOT EXISTS (
      SELECT 1 FROM public.user_stickers us
      WHERE us.user_id = user_id_param AND us.sticker_number = target_number AND us.copies > 0
    ) INTO was_new;

    -- Raras de Sorteio (codigos normais 21-193): 28, 45, 47, 79, 112, 164, 167 - 30%
    should_be_rare := false;
    IF target_number IN (28, 45, 47, 79, 112, 164, 167) THEN
      rolled_rare := (random() < 0.30);
      IF rolled_rare THEN
        SELECT coalesce(is_rare, false) INTO has_rare_already
        FROM public.user_stickers WHERE user_id = user_id_param AND sticker_number = target_number;
        IF NOT coalesce(has_rare_already, false) THEN should_be_rare := true; END IF;
      END IF;
    END IF;

    IF should_be_rare THEN
      INSERT INTO public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      VALUES (user_id_param, target_number, 1, true, now())
      ON CONFLICT (user_id, sticker_number) DO UPDATE SET copies = public.user_stickers.copies + 1, is_rare = true;
    ELSE
      INSERT INTO public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      VALUES (user_id_param, target_number, 1, false, now())
      ON CONFLICT (user_id, sticker_number) DO UPDATE SET copies = public.user_stickers.copies + 1;
    END IF;

    reveals := reveals || jsonb_build_object(
      'slug', target_slug, 'number', target_number,
      'wasNew', was_new, 'isRare', should_be_rare,
      'repeat', NOT was_new, 'reward', null
    );
  END LOOP;

  IF code_row.element IS NOT NULL THEN
    UPDATE public.user_styles SET unlocked = true WHERE user_id = user_id_param AND style_id = code_row.element;
  END IF;

  RETURN reveals;
END;
$$;

-- ============================================================
-- 3. claim_album_completion_reward: substituir 258 por 28
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_album_completion_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_distinct_count INTEGER;
  v_already_claimed BOOLEAN;
  v_rare_numbers INTEGER[] := ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,28,45,47,79,112,164,167,194,292,298];
  v_num INTEGER;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Nao autorizado.'; END IF;

  SELECT count(distinct sticker_number) INTO v_distinct_count FROM public.user_stickers WHERE user_id = v_uid AND copies > 0;
  IF coalesce(v_distinct_count, 0) < 360 THEN
    RAISE EXCEPTION 'E necessario possuir 100%% das 360 figurinhas do album para resgatar a recompensa de Raras.';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.album_completion_rewards WHERE user_id = v_uid) INTO v_already_claimed;
  IF v_already_claimed THEN RAISE EXCEPTION 'A recompensa de 100%% do album ja foi resgatada anteriormente.'; END IF;

  FOREACH v_num IN ARRAY v_rare_numbers LOOP
    IF EXISTS(SELECT 1 FROM public.user_stickers WHERE user_id = v_uid AND sticker_number = v_num) THEN
      UPDATE public.user_stickers SET is_rare = true WHERE user_id = v_uid AND sticker_number = v_num;
    ELSE
      INSERT INTO public.user_stickers(user_id, sticker_number, copies, is_rare) VALUES(v_uid, v_num, 1, true);
    END IF;
  END LOOP;

  INSERT INTO public.album_completion_rewards(user_id) VALUES(v_uid);

  RETURN jsonb_build_object(
    'claimed', true,
    'message', 'Recompensa de 100% do album resgatada com sucesso! Todas as Raras foram coladas em seu album.',
    'rare_numbers', to_jsonb(v_rare_numbers)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_album_completion_reward() TO authenticated;

-- ============================================================
-- 4. Corrigir registros existentes: sticker 258 nao pode ser rara
-- ============================================================
UPDATE public.user_stickers
SET is_rare = false
WHERE sticker_number = 258 AND is_rare = true;
