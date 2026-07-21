-- Reabre os 21 codigos promocionais de cinco figurinhas em uma nova campanha.
-- Cada codigo abre oito horas depois do anterior e permanece valido por 24h.

ALTER TABLE public.redeem_codes
  ADD COLUMN IF NOT EXISTS available_from timestamptz,
  ADD COLUMN IF NOT EXISTS available_until timestamptz;

-- Corrige tambem bancos em que a migracao anterior tenha sido aplicada antes
-- da revisao do valor de copias dos pacotes exclusivos de autoras.
UPDATE public.redeem_codes
SET copies_per_sticker = 2,
    max_redemptions = 2
WHERE grant_all_pool = true
  AND label LIKE 'Pacote de %';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.redeem_codes'::regclass
      AND conname = 'redeem_codes_valid_window'
  ) THEN
    ALTER TABLE public.redeem_codes
      ADD CONSTRAINT redeem_codes_valid_window
      CHECK (
        available_from IS NULL
        OR available_until IS NULL
        OR available_until > available_from
      );
  END IF;
END $$;

WITH campaign(code, position) AS (
  SELECT code, position::integer
  FROM unnest(ARRAY[
    'X8Y2Z5W1', 'K9P2X5Y1', 'M8N5Q1R7',
    'D6E9F2G8', 'J1K4L7M3', 'P3Q6R9S5',
    'B2V8C5X1', 'F9H4J7K2', 'W3E6R9T1',
    'Y5U8I1O4', 'Z2X5C8V1', 'N7M3L9K2',
    'G8F4D2S6', 'H1J4K7L3', 'Q9W5E1R8',
    'T2Y5U8I1', 'A6S3D9F2', 'P8O4I2U7',
    'V2B5N8M1', 'C9X5Z1A7', 'K3L7J9H2'
  ]::text[]) WITH ORDINALITY AS listed(code, position)
), schedule AS (
  SELECT
    code,
    position,
    '2026-07-21 07:00:00 America/Sao_Paulo'::timestamptz
      + ((position - 1) * interval '8 hours') AS starts_at,
    '2026-07-21 07:00:00 America/Sao_Paulo'::timestamptz
      + interval '24 hours'
      + ((position - 1) * interval '8 hours') AS ends_at
  FROM campaign
)
INSERT INTO public.redeem_codes (
  code,
  element,
  active,
  release_day,
  max_redemptions,
  grant_all_pool,
  copies_per_sticker,
  available_from,
  available_until
)
SELECT
  code,
  null,
  true,
  1,
  null,
  false,
  1,
  starts_at,
  ends_at
FROM schedule
ON CONFLICT (code) DO UPDATE SET
  active = true,
  release_day = 1,
  max_redemptions = null,
  grant_all_pool = false,
  copies_per_sticker = 1,
  available_from = excluded.available_from,
  available_until = excluded.available_until;

-- Nao deixa uma campanha parcialmente configurada entrar em producao.
DO $$
DECLARE
  invalid_codes text;
BEGIN
  SELECT string_agg(rc.code, ', ' ORDER BY rc.code)
  INTO invalid_codes
  FROM public.redeem_codes rc
  WHERE rc.code = ANY (ARRAY[
    'X8Y2Z5W1', 'K9P2X5Y1', 'M8N5Q1R7',
    'D6E9F2G8', 'J1K4L7M3', 'P3Q6R9S5',
    'B2V8C5X1', 'F9H4J7K2', 'W3E6R9T1',
    'Y5U8I1O4', 'Z2X5C8V1', 'N7M3L9K2',
    'G8F4D2S6', 'H1J4K7L3', 'Q9W5E1R8',
    'T2Y5U8I1', 'A6S3D9F2', 'P8O4I2U7',
    'V2B5N8M1', 'C9X5Z1A7', 'K3L7J9H2'
  ]::text[])
    AND (
      SELECT count(*)
      FROM public.redeem_pools rp
      WHERE rp.code = rc.code
    ) < 5;

  IF invalid_codes IS NOT NULL THEN
    RAISE EXCEPTION
      'Codigos sem pool suficiente para cinco figurinhas: %', invalid_codes;
  END IF;
END $$;

-- Abre um ciclo novo: quem usou esses codigos em campanhas anteriores pode
-- resgata-los uma vez novamente. O RPC volta a registrar o uso normalmente.
DELETE FROM public.reward_grants
WHERE reward_key = ANY (ARRAY[
  'code_X8Y2Z5W1', 'code_K9P2X5Y1', 'code_M8N5Q1R7',
  'code_D6E9F2G8', 'code_J1K4L7M3', 'code_P3Q6R9S5',
  'code_B2V8C5X1', 'code_F9H4J7K2', 'code_W3E6R9T1',
  'code_Y5U8I1O4', 'code_Z2X5C8V1', 'code_N7M3L9K2',
  'code_G8F4D2S6', 'code_H1J4K7L3', 'code_Q9W5E1R8',
  'code_T2Y5U8I1', 'code_A6S3D9F2', 'code_P8O4I2U7',
  'code_V2B5N8M1', 'code_C9X5Z1A7', 'code_K3L7J9H2'
]::text[]);

-- Mantem as implementacoes de sorteio e de pacotes exatos isoladas. O RPC
-- publico passa a validar a janela antes de encaminhar o resgate.
CREATE OR REPLACE FUNCTION public.redeem_code(code_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_clean text := upper(btrim(code_param));
  code_row public.redeem_codes%rowtype;
BEGIN
  SELECT *
  INTO code_row
  FROM public.redeem_codes
  WHERE code = code_clean;

  IF FOUND THEN
    IF NOT coalesce(code_row.active, false) THEN
      RAISE EXCEPTION 'Codigo invalido.';
    END IF;

    IF code_row.available_from IS NOT NULL
       AND now() < code_row.available_from THEN
      RAISE EXCEPTION 'Este codigo estara disponivel em %.',
        to_char(code_row.available_from AT TIME ZONE 'America/Sao_Paulo',
          'DD/MM/YYYY HH24:MI');
    END IF;

    IF code_row.available_until IS NOT NULL
       AND now() >= code_row.available_until THEN
      RAISE EXCEPTION 'Este codigo promocional expirou.';
    END IF;

    IF code_row.grant_all_pool THEN
      RETURN public.redeem_exact_code(code_clean);
    END IF;
  END IF;

  RETURN public.redeem_code_legacy(code_clean);
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_code(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.redeem_code(text) TO authenticated;
