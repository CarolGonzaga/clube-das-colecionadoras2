-- Keeps shop draws at 30% repeats while there are both owned and unowned
-- stickers in the product pool. Generated new stickers are reserved across the
-- whole order, preventing large combo purchases from drawing the same "new"
-- sticker in multiple packs before any of those packs is opened.

CREATE OR REPLACE FUNCTION public.choose_shop_sticker_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pack_type text;
  v_pool_start integer;
  v_pool_end integer;
  v_wants_repeat boolean := random() < 0.30;
  v_picked integer;
  v_is_repeat boolean;
BEGIN
  IF NEW.source <> 'shop' THEN
    RETURN NEW;
  END IF;

  SELECT
    pp.pack_type,
    coalesce((poi.metadata->>'pool_start')::integer, 194),
    coalesce((poi.metadata->>'pool_end')::integer, 319)
  INTO v_pack_type, v_pool_start, v_pool_end
  FROM public.purchase_packs pp
  JOIN public.purchase_order_items poi ON poi.id = pp.order_item_id
  WHERE pp.id = NEW.pack_id;

  -- Exclusive products have a fixed sticker and are never part of the random
  -- shop pool.
  IF v_pack_type IS NULL OR v_pack_type = 'exclusive' THEN
    RETURN NEW;
  END IF;

  IF v_wants_repeat THEN
    SELECT s.number INTO v_picked
    FROM public.stickers s
    WHERE s.number BETWEEN v_pool_start AND v_pool_end
      AND EXISTS (
        SELECT 1 FROM public.user_stickers us
        WHERE us.user_id = NEW.user_id
          AND us.sticker_number = s.number
          AND us.copies > 0
      )
      AND (
        SELECT count(*) FROM public.purchase_pack_stickers prior
        WHERE prior.pack_id = NEW.pack_id
          AND prior.sticker_number = s.number
      ) < 2
    ORDER BY random()
    LIMIT 1;
  ELSE
    SELECT s.number INTO v_picked
    FROM public.stickers s
    WHERE s.number BETWEEN v_pool_start AND v_pool_end
      AND NOT EXISTS (
        SELECT 1 FROM public.user_stickers us
        WHERE us.user_id = NEW.user_id
          AND us.sticker_number = s.number
          AND us.copies > 0
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.purchase_pack_stickers prior
        WHERE prior.order_id = NEW.order_id
          AND prior.sticker_number = s.number
      )
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- If the selected side of the 30/70 draw is empty, use the other side. This
  -- lets new users receive stickers and lets completed pools continue working.
  IF v_picked IS NULL AND v_wants_repeat THEN
    SELECT s.number INTO v_picked
    FROM public.stickers s
    WHERE s.number BETWEEN v_pool_start AND v_pool_end
      AND NOT EXISTS (
        SELECT 1 FROM public.user_stickers us
        WHERE us.user_id = NEW.user_id
          AND us.sticker_number = s.number
          AND us.copies > 0
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.purchase_pack_stickers prior
        WHERE prior.order_id = NEW.order_id
          AND prior.sticker_number = s.number
      )
    ORDER BY random()
    LIMIT 1;
  ELSIF v_picked IS NULL THEN
    SELECT s.number INTO v_picked
    FROM public.stickers s
    WHERE s.number BETWEEN v_pool_start AND v_pool_end
      AND EXISTS (
        SELECT 1 FROM public.user_stickers us
        WHERE us.user_id = NEW.user_id
          AND us.sticker_number = s.number
          AND us.copies > 0
      )
      AND (
        SELECT count(*) FROM public.purchase_pack_stickers prior
        WHERE prior.pack_id = NEW.pack_id
          AND prior.sticker_number = s.number
      ) < 2
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- Pool exhaustion is the only situation in which the requested percentage
  -- cannot be maintained. Keep the purchase functional and retain the existing
  -- two-identical-stickers-per-pack limit.
  IF v_picked IS NULL THEN
    SELECT s.number INTO v_picked
    FROM public.stickers s
    WHERE s.number BETWEEN v_pool_start AND v_pool_end
      AND (
        SELECT count(*) FROM public.purchase_pack_stickers prior
        WHERE prior.pack_id = NEW.pack_id
          AND prior.sticker_number = s.number
      ) < 2
    ORDER BY random()
    LIMIT 1;
  END IF;

  IF v_picked IS NULL THEN
    RAISE EXCEPTION 'Não foi possível sortear figurinha para o pacote da loja.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_stickers us
    WHERE us.user_id = NEW.user_id
      AND us.sticker_number = v_picked
      AND us.copies > 0
  ) INTO v_is_repeat;

  NEW.sticker_number := v_picked;
  NEW.was_new_at_generation := NOT v_is_repeat;
  NEW.was_repeat_at_generation := v_is_repeat;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS choose_shop_sticker_before_insert
  ON public.purchase_pack_stickers;
CREATE TRIGGER choose_shop_sticker_before_insert
BEFORE INSERT ON public.purchase_pack_stickers
FOR EACH ROW
EXECUTE FUNCTION public.choose_shop_sticker_before_insert();

REVOKE ALL ON FUNCTION public.choose_shop_sticker_before_insert() FROM public, anon, authenticated;
