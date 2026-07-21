-- ============================================================
-- MIGRATION: Remove sticker 331 (24h-para-correr-ilustracao-1) 
-- and shift sticker numbers 332..361 to 331..360
-- ============================================================

-- Migrate all relational references atomically. Foreign keys are temporarily
-- removed and restored with their original definitions after validation.
DO $$
DECLARE
  column_row record;
  constraint_row record;
  old_number integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stickers
    WHERE number = 331 AND slug = '24h-para-correr-ilustracao-1'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.stickers WHERE number = 361 AND slug = 'extra'
  ) THEN
    RAISE EXCEPTION 'Unexpected sticker catalogue; migration cancelled without changes';
  END IF;

  CREATE TEMP TABLE sticker_fk_backup ON COMMIT DROP AS
  SELECT conrelid, conname, pg_get_constraintdef(oid) AS definition
  FROM pg_constraint
  WHERE contype = 'f' AND confrelid = 'public.stickers'::regclass;

  FOR constraint_row IN SELECT * FROM sticker_fk_backup LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', constraint_row.conrelid::regclass, constraint_row.conname);
  END LOOP;

  FOR column_row IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'sticker_number'
      AND t.table_type = 'BASE TABLE'
    ORDER BY CASE WHEN c.table_name = 'shop_products' THEN 1 ELSE 0 END, c.table_name
  LOOP
    EXECUTE format('DELETE FROM public.%I WHERE %I = 331', column_row.table_name, column_row.column_name);
    FOR old_number IN 332..361 LOOP
      EXECUTE format('UPDATE public.%I SET %I = $1 WHERE %I = $2',
        column_row.table_name, column_row.column_name, column_row.column_name)
      USING old_number - 1, old_number;
    END LOOP;
  END LOOP;

  IF to_regclass('public.trade_requests') IS NOT NULL THEN
    DELETE FROM public.trade_requests WHERE initiator_sticker = 331 OR receiver_sticker = 331;
    FOR old_number IN 332..361 LOOP
      UPDATE public.trade_requests SET initiator_sticker = old_number - 1 WHERE initiator_sticker = old_number;
      UPDATE public.trade_requests SET receiver_sticker = old_number - 1 WHERE receiver_sticker = old_number;
    END LOOP;
  END IF;

  DELETE FROM public.stickers WHERE number = 331;
  FOR old_number IN 332..361 LOOP
    UPDATE public.stickers SET number = old_number - 1 WHERE number = old_number;
  END LOOP;
  UPDATE public.stickers SET type = 'bonus' WHERE number = 360 AND slug = 'extra';

  -- Revoke the former early bonus. It will be revealed again only at 359/359.
  DELETE FROM public.user_stickers WHERE sticker_number = 360;
  DELETE FROM public.reward_grants WHERE reward_key IN ('collection_1_193', 'collection_1_359');

  IF to_regclass('public.shop_products') IS NOT NULL THEN
    DELETE FROM public.shop_products
    WHERE product_type = 'exclusive' AND (sticker_number IS NULL OR sticker_number = 360);
  END IF;

  FOR constraint_row IN SELECT * FROM sticker_fk_backup LOOP
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s',
      constraint_row.conrelid::regclass, constraint_row.conname, constraint_row.definition);
  END LOOP;
END $$;

DO $$
DECLARE
  v_table text;
  v_tables text[] := ARRAY[
    'user_stickers',
    'purchase_pack_stickers',
    'shop_pack_stickers',
    'quiz_questions',
    'quiz_answers',
    'quiz_question_timers',
    'quiz_reward_rarities',
    'redeem_pools',
    'stickers'
  ];
BEGIN
  -- Superseded by the FK-safe, dynamically discovered migration above.
  IF false THEN
  -- Deletar figurinha 331 de tabelas existentes
  FOREACH v_table IN ARRAY v_tables LOOP
    IF to_regclass('public.' || v_table) IS NOT NULL THEN
      IF v_table = 'stickers' THEN
        EXECUTE 'DELETE FROM public.stickers WHERE number = 331';
      ELSE
        EXECUTE 'DELETE FROM public.' || quote_ident(v_table) || ' WHERE sticker_number = 331';
      END IF;
    END IF;
  END LOOP;

  IF to_regclass('public.trade_requests') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.trade_requests WHERE initiator_sticker = 331 OR receiver_sticker = 331';
  END IF;

  -- 1. Inverter o sinal (> 331 -> negative) para evitar qualquer conflito de chave única durante o reordenamento
  FOREACH v_table IN ARRAY v_tables LOOP
    IF to_regclass('public.' || v_table) IS NOT NULL THEN
      IF v_table = 'stickers' THEN
        EXECUTE 'UPDATE public.stickers SET number = -number WHERE number > 331';
      ELSE
        EXECUTE 'UPDATE public.' || quote_ident(v_table) || ' SET sticker_number = -sticker_number WHERE sticker_number > 331';
      END IF;
    END IF;
  END LOOP;

  IF to_regclass('public.trade_requests') IS NOT NULL THEN
    EXECUTE 'UPDATE public.trade_requests SET initiator_sticker = -initiator_sticker WHERE initiator_sticker > 331';
    EXECUTE 'UPDATE public.trade_requests SET receiver_sticker = -receiver_sticker WHERE receiver_sticker > 331';
  END IF;

  -- 2. Converter de volta ajustando o número final (-1 da posição original)
  FOREACH v_table IN ARRAY v_tables LOOP
    IF to_regclass('public.' || v_table) IS NOT NULL THEN
      IF v_table = 'stickers' THEN
        EXECUTE 'UPDATE public.stickers SET number = (-number) - 1 WHERE number < -331';
      ELSE
        EXECUTE 'UPDATE public.' || quote_ident(v_table) || ' SET sticker_number = (-sticker_number) - 1 WHERE sticker_number < -331';
      END IF;
    END IF;
  END LOOP;

  IF to_regclass('public.trade_requests') IS NOT NULL THEN
    EXECUTE 'UPDATE public.trade_requests SET initiator_sticker = (-initiator_sticker) - 1 WHERE initiator_sticker < -331';
    EXECUTE 'UPDATE public.trade_requests SET receiver_sticker = (-receiver_sticker) - 1 WHERE receiver_sticker < -331';
  END IF;

  -- 3. Atualizar tipo da figurinha 360 (antiga 361) para 'bonus'
  IF to_regclass('public.stickers') IS NOT NULL THEN
    EXECUTE 'UPDATE public.stickers SET type = ''bonus'' WHERE number = 360';
  END IF;
  END IF;
END $$;

-- Atualizar a função check_and_grant_rewards para desbloquear a figurinha #360 quando o usuário tiver as 359 figurinhas base
CREATE OR REPLACE FUNCTION public.check_and_grant_rewards(user_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  granted_in_loop boolean := true;
  total_count integer;
  count_1_359 integer;
  reveals jsonb := '[]'::jsonb;
  collections jsonb := '[
    {"tag":"Coleção fã Zey Shelsea","stickers":[14,130,212,149,198,205,225]},
    {"tag":"Coleção fã Victoria Mendes","stickers":[4,70,181,166,315,238,281]},
    {"tag":"Coleção fã V.S. Vilela","stickers":[115,264,237,9,68]},
    {"tag":"Coleção fã Mariana Rosa","stickers":[6,287,172,179,319,236]},
    {"tag":"Coleção fã Victoria Moon","stickers":[251,256,15,80,177]},
    {"tag":"Coleção fã Tessa Reis","stickers":[30,160,176,200,269,295,300,314]},
    {"tag":"Coleção fã Carol Barra","stickers":[27,182,206,221]},
    {"tag":"Coleção fã D.Barreto","stickers":[8,272,288]},
    {"tag":"Coleção fã Danda Odeleci","stickers":[123,199,246]},
    {"tag":"Coleção fã Elayne Baeta","stickers":[25,125,146]},
    {"tag":"Coleção fã Emely Luiza Curcio","stickers":[129,162,195,239,263]},
    {"tag":"Coleção fã Englantine","stickers":[12,124,215,253,273]},
    {"tag":"Coleção fã Helena Nolasco","stickers":[16,127,285,299,308]},
    {"tag":"Coleção fã Ingrid Paranhos","stickers":[37,197,282]},
    {"tag":"Coleção fã Ju Mesquita","stickers":[7,63,240]},
    {"tag":"Coleção fã Lari Alcantara","stickers":[42,254,303]},
    {"tag":"Coleção fã Carol e Liliane","stickers":[155,210,291]},
    {"tag":"Coleção fã Lis Selwyn","stickers":[112,163,222,293]},
    {"tag":"Coleção fã Luisa Landre","stickers":[164,219,229,301]},
    {"tag":"Coleção fã Raquel Alves","stickers":[40,189,233,304,317]},
    {"tag":"Coleção fã Sarah Oliveira","stickers":[11,227,249]},
    {"tag":"Coleção fã Vanessa Freitas","stickers":[39,118,165,262,270,290]},
    {"tag":"Coleção fã Yasmim Mahmud Kader","stickers":[17,153,211,234]},
    {"tag":"Coleção Destinos Entrelaçados","stickers":[106,224,313]},
    {"tag":"Coleção Bruxas","stickers":[141,231]},
    {"tag":"Coleção Sereia","stickers":[259,207,250]},
    {"tag":"Coleção Amores Possíveis","stickers":[305,235,79]},
    {"tag":"Coleção Sáficas de Verão","stickers":[170,309,312]},
    {"tag":"Coleção Sementes","stickers":[26,271]},
    {"tag":"Coleção Bright Falls","stickers":[22,51,52]},
    {"tag":"Coleção Opostos Co.","stickers":[19,73,74]},
    {"tag":"Coleção Baldaverso","stickers":[1,53,54,111,122,156,274,284,318]},
    {"tag":"Coleção Frutaverso","stickers":[5,59,60]},
    {"tag":"Coleção HQ","stickers":[84,85,87]}
  ]'::jsonb;
  coll record;
  coll_tag text;
  missing_count integer;
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
    ELSE
      -- Preserve all 34 author/family collection rewards.
      FOR coll IN SELECT * FROM jsonb_array_elements(collections) LOOP
        coll_tag := coll.value->>'tag';
        SELECT count(*) INTO missing_count
        FROM jsonb_array_elements_text(coll.value->'stickers') AS s(st_num)
        WHERE NOT EXISTS (
          SELECT 1 FROM public.user_stickers
          WHERE user_id = user_id_param
            AND sticker_number = (s.st_num)::integer
            AND copies > 0
        );

        IF missing_count = 0 AND NOT EXISTS (
          SELECT 1 FROM public.completed_tags
          WHERE user_id = user_id_param AND tag_name = coll_tag
        ) THEN
          INSERT INTO public.completed_tags (user_id, tag_name, claimed)
          VALUES (user_id_param, coll_tag, false);
          reveals := reveals || jsonb_build_object(
            'slug', 'tag-' || coll_tag,
            'number', 0,
            'wasNew', false,
            'isRare', false,
            'repeat', true,
            'reward', 'tag_' || coll_tag,
            'rewardMessage', 'Parabéns! Você completou a coleção ' || coll_tag || ' e ganhou um Selo Super Fã! Vá na aba Coleções para resgatar seu prêmio.'
          );
          granted_in_loop := true;
          EXIT;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RETURN reveals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.check_and_grant_rewards(uuid) TO authenticated;

-- Forçar recarregamento do cache do PostgREST
NOTIFY pgrst, 'reload schema';
