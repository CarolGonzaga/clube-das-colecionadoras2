-- Consolidates collection claiming in one atomic RPC and reconciles V1 seals.

CREATE OR REPLACE FUNCTION public.collection_sticker_numbers(tag_name_param text)
RETURNS integer[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE tag_name_param
    WHEN 'Coleção fã Zey Shelsea' THEN ARRAY[14,130,212,149,198,205,225]
    WHEN 'Coleção fã Victoria Mendes' THEN ARRAY[4,70,181,166,315,238,281]
    WHEN 'Coleção fã V.S. Vilela' THEN ARRAY[115,264,237,9,68]
    WHEN 'Coleção fã Mariana Rosa' THEN ARRAY[6,287,172,179,319,236]
    WHEN 'Coleção fã Victoria Moon' THEN ARRAY[251,256,15,80,177]
    WHEN 'Coleção fã Tessa Reis' THEN ARRAY[30,160,176,200,269,295,300,314]
    WHEN 'Coleção fã Carol Barra' THEN ARRAY[27,182,206,221]
    WHEN 'Coleção fã D.Barreto' THEN ARRAY[8,272,288]
    WHEN 'Coleção fã Danda Odeleci' THEN ARRAY[123,199,246]
    WHEN 'Coleção fã Elayne Baeta' THEN ARRAY[25,125,146]
    WHEN 'Coleção fã Emely Luiza Curcio' THEN ARRAY[129,162,195,239,263]
    WHEN 'Coleção fã Englantine' THEN ARRAY[12,124,215,253,273]
    WHEN 'Coleção fã Helena Nolasco' THEN ARRAY[16,127,285,299,308]
    WHEN 'Coleção fã Ingrid Paranhos' THEN ARRAY[37,197,282]
    WHEN 'Coleção fã Ju Mesquita' THEN ARRAY[7,63,240]
    WHEN 'Coleção fã Lari Alcantara' THEN ARRAY[42,254,303]
    WHEN 'Coleção fã Carol e Liliane' THEN ARRAY[155,210,291]
    WHEN 'Coleção fã Lis Selwyn' THEN ARRAY[112,163,222,293]
    WHEN 'Coleção fã Luisa Landre' THEN ARRAY[164,219,229,301]
    WHEN 'Coleção fã Raquel Alves' THEN ARRAY[40,189,233,304,317]
    WHEN 'Coleção fã Sarah Oliveira' THEN ARRAY[11,227,249]
    WHEN 'Coleção fã Vanessa Freitas' THEN ARRAY[39,118,165,262,270,290]
    WHEN 'Coleção fã Yasmim Mahmud Kader' THEN ARRAY[17,153,211,234]
    WHEN 'Coleção Destinos Entrelaçados' THEN ARRAY[106,224,313]
    WHEN 'Coleção Bruxas' THEN ARRAY[141,231]
    WHEN 'Coleção Sereia' THEN ARRAY[259,207,250]
    WHEN 'Coleção Amores Possíveis' THEN ARRAY[305,235,79]
    WHEN 'Coleção Sáficas de Verão' THEN ARRAY[170,309,312]
    WHEN 'Coleção Sementes' THEN ARRAY[26,271]
    WHEN 'Coleção Bright Falls' THEN ARRAY[22,51,52]
    WHEN 'Coleção Opostos Co.' THEN ARRAY[19,73,74]
    WHEN 'Coleção Baldaverso' THEN ARRAY[1,53,54,111,122,156,274,284,318]
    WHEN 'Coleção Frutaverso' THEN ARRAY[5,59,60]
    WHEN 'Coleção HQ' THEN ARRAY[84,85,87]
    ELSE NULL
  END;
$$;

-- V1 had five legacy names and no claimed flag. Those rewards were delivered
-- automatically in V1, so preserve them as claimed. Baldaverso is the only
-- exception because its current kit gained six stickers and earns a new pack.
DO $$
BEGIN
  IF to_regclass('public.v1_staging_completed_tags') IS NOT NULL THEN
    EXECUTE $reconcile$
      INSERT INTO public.completed_tags
        (user_id, tag_name, completed_at, claimed, claimed_at)
      SELECT
        old.user_id,
        CASE old.tag_name
          WHEN 'Baldaverso' THEN 'Coleção Baldaverso'
          WHEN 'Frutaverso' THEN 'Coleção Frutaverso'
          WHEN 'Bright Falls' THEN 'Coleção Bright Falls'
          WHEN 'Opostos Co.' THEN 'Coleção Opostos Co.'
          WHEN 'HQ' THEN 'Coleção HQ'
          ELSE old.tag_name
        END,
        coalesce(old.completed_at, now()),
        old.tag_name <> 'Baldaverso',
        CASE WHEN old.tag_name <> 'Baldaverso'
          THEN coalesce(old.completed_at, now()) ELSE NULL END
      FROM public.v1_staging_completed_tags old
      ON CONFLICT (user_id, tag_name) DO UPDATE SET
        completed_at = LEAST(public.completed_tags.completed_at, EXCLUDED.completed_at),
        claimed = CASE
          WHEN EXCLUDED.tag_name = 'Coleção Baldaverso'
            THEN public.completed_tags.claimed
          ELSE true
        END,
        claimed_at = CASE
          WHEN EXCLUDED.tag_name = 'Coleção Baldaverso'
            THEN public.completed_tags.claimed_at
          ELSE coalesce(public.completed_tags.claimed_at, EXCLUDED.claimed_at)
        END
    $reconcile$;
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
  required_numbers integer[];
  missing_count integer;
  claimed_now boolean;
  package_numbers integer[] := '{}'::integer[];
  available_pool integer[];
  target_number integer;
  target_slug text;
  was_new boolean;
  draw_idx integer;
  reveals jsonb := '[]'::jsonb;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado.';
  END IF;

  required_numbers := public.collection_sticker_numbers(tag_name_param);
  IF required_numbers IS NULL THEN
    RAISE EXCEPTION 'Coleção inválida.';
  END IF;

  SELECT count(*) INTO missing_count
  FROM unnest(required_numbers) required(number)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_stickers owned
    WHERE owned.user_id = caller_id
      AND owned.sticker_number = required.number
      AND owned.copies > 0
  );

  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Você ainda não completou essa coleção.';
  END IF;

  -- Self-heals the small window between receiving the final sticker and the
  -- progress hook creating completed_tags.
  INSERT INTO public.completed_tags (user_id, tag_name, completed_at, claimed)
  VALUES (caller_id, tag_name_param, now(), false)
  ON CONFLICT (user_id, tag_name) DO NOTHING;

  UPDATE public.completed_tags
  SET claimed = true, claimed_at = now()
  WHERE user_id = caller_id
    AND tag_name = tag_name_param
    AND coalesce(claimed, false) = false
  RETURNING true INTO claimed_now;

  IF coalesce(claimed_now, false) = false THEN
    RAISE EXCEPTION 'Prêmio já resgatado para essa coleção.';
  END IF;

  FOR draw_idx IN 1..3 LOOP
    available_pool := public.pack_available_pool(
      ARRAY(SELECT generate_series(21, 193)),
      package_numbers
    );
    target_number := public.draw_non_quiz_sticker(caller_id, available_pool);
    IF target_number IS NULL OR target_number < 21 OR target_number > 193 THEN
      RAISE EXCEPTION 'Não foi possível montar o pacote da coleção.';
    END IF;
    package_numbers := array_append(package_numbers, target_number);

    SELECT slug INTO target_slug FROM public.stickers WHERE number = target_number;
    IF target_slug IS NULL THEN
      RAISE EXCEPTION 'Figurinha de recompensa inexistente: %.', target_number;
    END IF;

    INSERT INTO public.user_stickers
      (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    VALUES (caller_id, target_number, 1, false, now())
    ON CONFLICT (user_id, sticker_number) DO UPDATE
      SET copies = public.user_stickers.copies + 1
    RETURNING (copies = 1) INTO was_new;

    reveals := reveals || jsonb_build_object(
      'slug', target_slug,
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

REVOKE ALL ON FUNCTION public.collection_sticker_numbers(text) FROM public, anon;
REVOKE ALL ON FUNCTION public.claim_collection_reward(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.collection_sticker_numbers(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_collection_reward(text) TO authenticated;
