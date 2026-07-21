-- Restaura a figurinha 360 como bônus secreto pela conclusão das 359 bases.

UPDATE public.stickers
SET slug = 'extra',
    name = 'Agradecimentos',
    author = null,
    ilustrator = null,
    type = 'bonus',
    cover_url = 'card story/extra.png',
    amazon_url = null
WHERE number = 360;

-- A bônus não pertence a códigos, loja, sorteios ou pacotes comuns.
DELETE FROM public.redeem_pools WHERE sticker_number = 360;

DO $$
BEGIN
  IF to_regclass('public.shop_products') IS NOT NULL THEN
    DELETE FROM public.shop_products WHERE sticker_number = 360;
  END IF;
END $$;

-- Remove concessões indevidas feitas sem a conclusão das 359 figurinhas base.
DELETE FROM public.user_stickers us
WHERE us.sticker_number = 360
  AND NOT EXISTS (
    SELECT 1 FROM public.reward_grants rg
    WHERE rg.user_id = us.user_id AND rg.reward_key = 'collection_1_359'
  )
  AND (
    SELECT count(DISTINCT owned.sticker_number)
    FROM public.user_stickers owned
    WHERE owned.user_id = us.user_id
      AND owned.sticker_number BETWEEN 1 AND 359
      AND owned.copies > 0
  ) < 359;

-- Regulariza quem já completou as 359 posições enquanto a regra estava fora.
WITH eligible AS (
  SELECT us.user_id
  FROM public.user_stickers us
  WHERE us.sticker_number BETWEEN 1 AND 359 AND us.copies > 0
  GROUP BY us.user_id
  HAVING count(DISTINCT us.sticker_number) = 359
    AND NOT EXISTS (
      SELECT 1 FROM public.user_stickers bonus
      WHERE bonus.user_id = us.user_id
        AND bonus.sticker_number = 360
        AND bonus.copies > 0
    )
), newly_granted AS (
  INSERT INTO public.reward_grants (user_id, reward_key, granted_at)
  SELECT user_id, 'collection_1_359', now()
  FROM eligible
  ON CONFLICT (user_id, reward_key) DO NOTHING
  RETURNING user_id
), inserted_stickers AS (
  INSERT INTO public.user_stickers
    (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  SELECT user_id, 360, 1, false, now()
  FROM eligible
  ON CONFLICT (user_id, sticker_number) DO UPDATE SET
    copies = greatest(public.user_stickers.copies, 1),
    is_rare = false
  RETURNING user_id
)
UPDATE public.profiles p
SET reveals_queue = coalesce(p.reveals_queue, '[]'::jsonb) || jsonb_build_array(
  jsonb_build_object(
    'items', jsonb_build_array(jsonb_build_object(
      'slug', 'extra',
      'number', 360,
      'wasNew', true,
      'isRare', false,
      'repeat', false,
      'reward', 'collection_1_359'
    )),
    'title', 'Álbum base completo!',
    'rewardMsg', 'Parabéns! Você completou as 359 figurinhas base e desbloqueou a figurinha bônus de agradecimento.'
  )
)
FROM inserted_stickers granted
WHERE p.id = granted.user_id;

NOTIFY pgrst, 'reload schema';
