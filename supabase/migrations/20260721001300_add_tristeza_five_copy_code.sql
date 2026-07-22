-- Código temporário controlado exclusivamente pela coluna active.
-- Cada usuária pode resgatá-lo uma única vez enquanto estiver ativo e recebe
-- cinco cópias comuns da figurinha 165 (Tristeza).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.stickers
    WHERE number = 165
      AND name = 'Tristeza'
  ) THEN
    RAISE EXCEPTION 'Figurinha 165 (Tristeza) não encontrada; código não criado.';
  END IF;
END
$$;

INSERT INTO public.redeem_codes (
  code,
  label,
  element,
  active,
  release_day,
  max_redemptions,
  grant_all_pool,
  copies_per_sticker
)
VALUES (
  'T5R8Z1KA',
  'Pacote especial — Tristeza (5 cópias)',
  null,
  true,
  1,
  null,
  true,
  5
)
ON CONFLICT (code) DO UPDATE SET
  label = excluded.label,
  element = null,
  active = true,
  release_day = 1,
  max_redemptions = null,
  grant_all_pool = true,
  copies_per_sticker = 5;

DELETE FROM public.redeem_pools
WHERE code = 'T5R8Z1KA';

INSERT INTO public.redeem_pools (code, sticker_number)
VALUES ('T5R8Z1KA', 165);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.redeem_codes rc
    JOIN public.redeem_pools rp ON rp.code = rc.code
    WHERE rc.code = 'T5R8Z1KA'
      AND rc.active = true
      AND rc.grant_all_pool = true
      AND rc.copies_per_sticker = 5
      AND rp.sticker_number = 165
  ) THEN
    RAISE EXCEPTION 'Falha ao configurar o código T5R8Z1KA.';
  END IF;
END
$$;
