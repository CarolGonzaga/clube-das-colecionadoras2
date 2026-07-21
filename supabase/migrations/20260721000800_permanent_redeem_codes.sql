-- Códigos permanentes: a disponibilidade é controlada exclusivamente por active.

CREATE OR REPLACE FUNCTION public.redeem_exact_code_single_copy(code_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_code text := upper(btrim(code_param));
  v_code_row public.redeem_codes%rowtype;
  v_number integer;
  v_slug text;
  v_was_new boolean;
  v_redemptions integer;
  v_reveals jsonb := '[]'::jsonb;
  v_progression jsonb := '[]'::jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autorizado.';
  END IF;

  SELECT * INTO v_code_row
  FROM public.redeem_codes
  WHERE code = v_code AND active = true AND grant_all_pool = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código inválido ou desativado.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reward_grants
    WHERE user_id = v_uid AND reward_key = 'code_' || v_code
  ) THEN
    RAISE EXCEPTION 'Você já usou este código.';
  END IF;

  SELECT count(*) INTO v_redemptions
  FROM public.reward_grants
  WHERE reward_key = 'code_' || v_code;

  IF v_code_row.max_redemptions IS NOT NULL
     AND v_redemptions >= v_code_row.max_redemptions THEN
    RAISE EXCEPTION 'Este código atingiu o limite de resgates.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.redeem_pools WHERE code = v_code) THEN
    RAISE EXCEPTION 'O pacote deste código está vazio.';
  END IF;

  INSERT INTO public.reward_grants (user_id, reward_key, granted_at)
  VALUES (v_uid, 'code_' || v_code, now());

  FOR v_number IN
    SELECT sticker_number FROM public.redeem_pools
    WHERE code = v_code ORDER BY sticker_number
  LOOP
    SELECT slug INTO v_slug FROM public.stickers WHERE number = v_number;
    IF v_slug IS NULL THEN
      RAISE EXCEPTION 'Figurinha % não encontrada.', v_number;
    END IF;

    SELECT NOT EXISTS (
      SELECT 1 FROM public.user_stickers
      WHERE user_id = v_uid AND sticker_number = v_number AND copies > 0
    ) INTO v_was_new;

    INSERT INTO public.user_stickers
      (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    VALUES (v_uid, v_number, 1, false, now())
    ON CONFLICT (user_id, sticker_number) DO UPDATE
      SET copies = public.user_stickers.copies + 1;

    v_reveals := v_reveals || jsonb_build_object(
      'slug', v_slug, 'number', v_number, 'wasNew', v_was_new,
      'isRare', false, 'repeat', NOT v_was_new, 'reward', null
    );
  END LOOP;

  v_progression := coalesce(public.check_and_grant_rewards(v_uid), '[]'::jsonb);
  IF jsonb_typeof(v_progression) = 'array' THEN
    v_reveals := v_reveals || v_progression;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 'reveals', v_reveals, 'element', v_code_row.element
  );
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_exact_code_single_copy(text)
  FROM public, anon, authenticated;

-- O RPC público não consulta datas: active é a única chave de disponibilidade.
CREATE OR REPLACE FUNCTION public.redeem_code(code_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_code text := upper(btrim(code_param));
  v_code_row public.redeem_codes%rowtype;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autorizado.';
  END IF;

  SELECT * INTO v_code_row
  FROM public.redeem_codes
  WHERE code = v_code AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código inválido ou desativado.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reward_grants
    WHERE user_id = v_uid AND reward_key = 'code_' || v_code
  ) THEN
    RAISE EXCEPTION 'Você já usou este código.';
  END IF;

  IF v_code_row.grant_all_pool THEN
    RETURN public.redeem_exact_code(v_code);
  END IF;

  RETURN public.redeem_code_legacy(v_code);
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_code(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.redeem_code(text) TO authenticated;

ALTER TABLE public.redeem_codes
  DROP CONSTRAINT IF EXISTS redeem_codes_valid_window;
ALTER TABLE public.redeem_codes
  DROP COLUMN IF EXISTS available_from,
  DROP COLUMN IF EXISTS available_until;

-- Os 21 códigos comuns ficam ativos imediatamente, sem limite global e com
-- cinco sorteios feitos pela implementação legada.
UPDATE public.redeem_codes
SET active = true,
    release_day = 1,
    max_redemptions = null,
    grant_all_pool = false,
    copies_per_sticker = 1
WHERE code = ANY (ARRAY[
  'X8Y2Z5W1','K9P2X5Y1','M8N5Q1R7','D6E9F2G8','J1K4L7M3','P3Q6R9S5',
  'B2V8C5X1','F9H4J7K2','W3E6R9T1','Y5U8I1O4','Z2X5C8V1','N7M3L9K2',
  'G8F4D2S6','H1J4K7L3','Q9W5E1R8','T2Y5U8I1','A6S3D9F2','P8O4I2U7',
  'V2B5N8M1','C9X5Z1A7','K3L7J9H2'
]::text[]);

-- Inicia um novo ciclo para os 21 códigos comuns. Depois do resgate, cada
-- usuária volta a ficar impedida de usar o mesmo código uma segunda vez.
DELETE FROM public.reward_grants
WHERE reward_key = ANY (ARRAY[
  'code_X8Y2Z5W1','code_K9P2X5Y1','code_M8N5Q1R7','code_D6E9F2G8',
  'code_J1K4L7M3','code_P3Q6R9S5','code_B2V8C5X1','code_F9H4J7K2',
  'code_W3E6R9T1','code_Y5U8I1O4','code_Z2X5C8V1','code_N7M3L9K2',
  'code_G8F4D2S6','code_H1J4K7L3','code_Q9W5E1R8','code_T2Y5U8I1',
  'code_A6S3D9F2','code_P8O4I2U7','code_V2B5N8M1','code_C9X5Z1A7',
  'code_K3L7J9H2'
]::text[]);

-- Definição canônica dos códigos das autoras e de suas figurinhas.
DO $$
DECLARE
  v_names jsonb := $names${
    "ALENQ764":"Alexia","ANA9UK74":"Ana França","ANDMFQQE":"Andremis","ARQA3MTC":"Arquelana",
    "BIAMKH8B":"Bia Freitas","BIAGU2L2":"Bia R.D. Ramos","BREYNH49":"Brenda Borges",
    "CAR52FLN":"Carol Barra","CARP2STY":"Carol Cara","CAR65HDA":"Carol Cara, Liliane Reis",
    "CARP7L9M":"Carol Rutz","CLAU9U7H":"Clara Alves","DBAQ3JVV":"D. Barreto",
    "DANKZ2RJ":"Danda Odeleci","DEBT9DZ7":"Debora Carvalho","DEN55FDK":"Denise Flaibam",
    "EMEAMSU4":"Emely Luiza Curcio","ENGDDQTV":"Englantine","EVYRPRL2":"Evyn Mota",
    "FERU3G6V":"Fernanda Moser","GBBXR36A":"G.B. Baldassari","GIN3UYU5":"Gina Milbradt",
    "GISXBT25":"Gisele Cerqueira, Hannah Kaiser","GIUQLVC3":"Giu Nascimento",
    "GIUX6MN5":"Giu Nascimento e coautoras","GOLEC99B":"Golden Faery","GRAVWH3L":"Graziela Santos",
    "HELCAEX2":"Helena Nolasco","HELWYDAN":"Helena Nolasco, Milly Ricardo","IKP4ZPZ7":"I.K. Prado",
    "INGR4D6W":"Ingrid Paranhos","ISA52Z2E":"Isabella Pereira","JESYTLAY":"Jess Lim",
    "JIAMPQK6":"Jia Monure","JUMTJCJQ":"Ju Mesquita","JUL9D7KC":"Jules K. Florian",
    "JUL8UP78":"Júlia Raimann","KIMRSSNF":"Kimmcharlie","LARUPUWS":"Lari Alcantara",
    "LARXQKEJ":"Larissa Ferrioli","LIL5W6T2":"Liliane Reis","LIN56Q96":"Line Cunha",
    "LISBWJ2G":"Lis Selwyn","LUIJTL87":"Luisa Landre","MANABARN":"Mandy Vieira",
    "MAREWDLY":"Márcia Camargo","MAR84CVJ":"Mariana Rosa","MARTCKDA":"Marina Dutra",
    "MARWEYVR":"Marina Feijóo","MIL7HEPK":"Milly Ricardo","NATETP22":"Natalia Avila",
    "NICRUAM5":"Nicole Oliveira","RAQ8QRS4":"Raquel Alves","SARVP5ND":"Sarah Oliveira",
    "SODYXTRY":"Sodré","SWYR2856":"Swyanne Rodriguez","TATQ59ZF":"Tattah Nascimento",
    "TES5GFJE":"Tessa Reis","THA8XDFG":"Thaís Boito","THA4FMDU":"Thais Rodrigues",
    "TORTKXLA":"Tori Lopes","VSVF9JEY":"V.S. Vilela","VANHH8Z6":"Vanessa Freitas",
    "VICGM363":"Victoria Mendes","VICH9HSL":"Victoria Moon","YAS6K63T":"Yasmim Mahmud Kader",
    "ZEYY9M9C":"Zey Shelsea","ZEYKT8KS":"Zey Shelsea, Yas Oliveira"
  }$names$::jsonb;
  v_pools jsonb := $pools${
    "ALENQ764":[223],"ANA9UK74":[266,309,312],"ANDMFQQE":[342],"ARQA3MTC":[275],
    "BIAMKH8B":[216],"BIAGU2L2":[258,296],"BREYNH49":[255],
    "CAR52FLN":[206,221,323,343,355],"CARP2STY":[260],"CAR65HDA":[210,291],"CARP7L9M":[226],
    "CLAU9U7H":[207,250,259,334,349],"DBAQ3JVV":[272,288,322,339,352],"DANKZ2RJ":[199,246],
    "DEBT9DZ7":[203,209,271],"DEN55FDK":[231,244,248],"EMEAMSU4":[195,239,263,335,346],
    "ENGDDQTV":[215,253,273],"EVYRPRL2":[261],"FERU3G6V":[252],
    "GBBXR36A":[274,284,318,320,336,338],"GIN3UYU5":[276],"GISXBT25":[243],
    "GIUQLVC3":[267,321],"GIUX6MN5":[218],"GOLEC99B":[228,279,316],"GRAVWH3L":[298,351],
    "HELCAEX2":[285,299,308],"HELWYDAN":[241],"IKP4ZPZ7":[217,289],"INGR4D6W":[197,282],
    "ISA52Z2E":[214],"JESYTLAY":[202,278,330],"JIAMPQK6":[213],"JUMTJCJQ":[240],
    "JUL9D7KC":[194,283],"JUL8UP78":[310],"KIMRSSNF":[201],"LARUPUWS":[254,303],
    "LARXQKEJ":[220],"LIL5W6T2":[196,245,286],"LIN56Q96":[327,356,360],
    "LISBWJ2G":[222,293,326,359],"LUIJTL87":[219,229,301,328,344],"MANABARN":[204],
    "MAREWDLY":[232,294],"MAR84CVJ":[236,287,319],"MARTCKDA":[306,331,345],
    "MARWEYVR":[257,307],"MIL7HEPK":[280],"NATETP22":[297,341],"NICRUAM5":[292,324],
    "RAQ8QRS4":[233,304,317,332,337,354],"SARVP5ND":[227,249],"SODYXTRY":[242],
    "SWYR2856":[224,268,313,325,348],"TATQ59ZF":[247,277,302,357],
    "TES5GFJE":[200,269,295,300,314],"THA8XDFG":[311,340],"THA4FMDU":[235,305,333,347,358],
    "TORTKXLA":[208,230,265],"VSVF9JEY":[237,264,329,350,353],
    "VANHH8Z6":[262,270,290],"VICGM363":[238,281,315],"VICH9HSL":[251,256],
    "YAS6K63T":[211,234],"ZEYY9M9C":[198,205,225],"ZEYKT8KS":[212]
  }$pools$::jsonb;
  v_code text;
  v_stickers jsonb;
BEGIN
  FOR v_code, v_stickers IN SELECT key, value FROM jsonb_each(v_pools) LOOP
    INSERT INTO public.redeem_codes
      (code, label, element, active, release_day, max_redemptions, grant_all_pool, copies_per_sticker)
    VALUES
      (v_code, 'Pacote de ' || (v_names ->> v_code), null, true, 1, 2, true, 1)
    ON CONFLICT (code) DO UPDATE SET
      label = excluded.label,
      active = true,
      release_day = 1,
      max_redemptions = 2,
      grant_all_pool = true,
      copies_per_sticker = 1;

    DELETE FROM public.redeem_pools WHERE code = v_code;
    INSERT INTO public.redeem_pools (code, sticker_number)
    SELECT v_code, value::integer
    FROM jsonb_array_elements_text(v_stickers);

    -- Reabre duas vagas completas para esta nova rodada do código da autora.
    DELETE FROM public.reward_grants
    WHERE reward_key = 'code_' || v_code;
  END LOOP;
END $$;

-- Garante que os 21 códigos existam e tenham pools suficientes.
DO $$
DECLARE
  v_problem text;
BEGIN
  SELECT string_agg(c.code, ', ' ORDER BY c.code) INTO v_problem
  FROM unnest(ARRAY[
    'X8Y2Z5W1','K9P2X5Y1','M8N5Q1R7','D6E9F2G8','J1K4L7M3','P3Q6R9S5',
    'B2V8C5X1','F9H4J7K2','W3E6R9T1','Y5U8I1O4','Z2X5C8V1','N7M3L9K2',
    'G8F4D2S6','H1J4K7L3','Q9W5E1R8','T2Y5U8I1','A6S3D9F2','P8O4I2U7',
    'V2B5N8M1','C9X5Z1A7','K3L7J9H2'
  ]::text[]) AS c(code)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.redeem_codes rc
    WHERE rc.code = c.code AND rc.active = true
  ) OR (SELECT count(*) FROM public.redeem_pools rp WHERE rp.code = c.code) < 5;

  IF v_problem IS NOT NULL THEN
    RAISE EXCEPTION 'Códigos ausentes ou com pool insuficiente: %', v_problem;
  END IF;
END $$;
