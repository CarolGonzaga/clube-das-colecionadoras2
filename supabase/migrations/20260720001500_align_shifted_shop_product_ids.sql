-- Align stable shop IDs with the sticker numbers changed by migration 014.
-- Also repairs exclusive purchases made after the catalogue shift but before
-- this correction, when exclusive-N still resolved to sticker N-1.

DO $$
DECLARE
  constraint_row record;
  old_number integer;
  bonus_created_at timestamptz;
  ids_need_shift boolean;
BEGIN
  IF to_regclass('public.shop_products') IS NULL THEN
    RETURN;
  END IF;

  SELECT created_at INTO bonus_created_at
  FROM public.stickers
  WHERE number = 360 AND slug = 'extra';

  IF bonus_created_at IS NULL THEN
    RAISE EXCEPTION 'Bonus sticker 360 is missing; shop alignment cancelled';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.shop_products
    WHERE product_type = 'exclusive'
      AND id ~ '^exclusive-[0-9]+$'
      AND substring(id FROM '^exclusive-([0-9]+)$')::integer = sticker_number + 1
  ) INTO ids_need_shift;

  CREATE TEMP TABLE buggy_exclusive_purchases ON COMMIT DROP AS
  SELECT
    poi.id AS order_item_id,
    po.user_id,
    poi.sticker_number AS wrong_number,
    substring(poi.product_id FROM '^exclusive-([0-9]+)$')::integer AS intended_number,
    poi.quantity
  FROM public.purchase_order_items poi
  JOIN public.purchase_orders po ON po.id = poi.order_id
  WHERE poi.product_type = 'exclusive'
    AND poi.created_at >= bonus_created_at
    AND poi.product_id ~ '^exclusive-[0-9]+$'
    AND substring(poi.product_id FROM '^exclusive-([0-9]+)$')::integer BETWEEN 320 AND 359
    AND poi.sticker_number = substring(poi.product_id FROM '^exclusive-([0-9]+)$')::integer - 1;

  -- Return the incorrectly delivered copy/copies.
  UPDATE public.user_stickers us
  SET copies = greatest(0, us.copies - fixes.quantity)
  FROM (
    SELECT user_id, wrong_number, sum(quantity)::integer AS quantity
    FROM buggy_exclusive_purchases
    GROUP BY user_id, wrong_number
  ) fixes
  WHERE us.user_id = fixes.user_id
    AND us.sticker_number = fixes.wrong_number;

  DELETE FROM public.user_stickers WHERE copies <= 0;

  -- Deliver the sticker selected in the UI.
  INSERT INTO public.user_stickers
    (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  SELECT user_id, intended_number, sum(quantity)::integer, false, now()
  FROM buggy_exclusive_purchases
  GROUP BY user_id, intended_number
  ON CONFLICT (user_id, sticker_number) DO UPDATE
  SET copies = public.user_stickers.copies + excluded.copies;

  UPDATE public.purchase_order_items poi
  SET sticker_number = fixes.intended_number,
      product_name = s.name,
      metadata = coalesce(poi.metadata, '{}'::jsonb)
        || jsonb_build_object('shop_number_repaired', true)
  FROM buggy_exclusive_purchases fixes
  JOIN public.stickers s ON s.number = fixes.intended_number
  WHERE poi.id = fixes.order_item_id;

  CREATE TEMP TABLE shop_product_fk_backup ON COMMIT DROP AS
  SELECT conrelid, conname, pg_get_constraintdef(oid) AS definition
  FROM pg_constraint
  WHERE contype = 'f' AND confrelid = 'public.shop_products'::regclass;

  FOR constraint_row IN SELECT * FROM shop_product_fk_backup LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',
      constraint_row.conrelid::regclass, constraint_row.conname);
  END LOOP;

  IF ids_need_shift THEN
    -- The removed product left exclusive-331 free. Shift IDs in ascending order
    -- so every ID once again equals its product's sticker_number.
    FOR old_number IN 332..360 LOOP
      UPDATE public.purchase_order_items
      SET product_id = 'exclusive-' || (old_number - 1)::text
      WHERE product_id = 'exclusive-' || old_number::text;

      UPDATE public.shop_products
      SET id = 'exclusive-' || (old_number - 1)::text,
          updated_at = now()
      WHERE id = 'exclusive-' || old_number::text;
    END LOOP;
  END IF;

  UPDATE public.shop_products p
  SET name = s.name,
      metadata = jsonb_build_object(
        'slug', s.slug,
        'author', s.author,
        'ilustrator', s.ilustrator
      ),
      active = true,
      updated_at = now()
  FROM public.stickers s
  WHERE p.product_type = 'exclusive'
    AND p.sticker_number = s.number
    AND s.number BETWEEN 320 AND 359;

  DELETE FROM public.shop_products
  WHERE product_type = 'exclusive'
    AND (sticker_number IS NULL OR sticker_number NOT BETWEEN 320 AND 359);

  FOR constraint_row IN SELECT * FROM shop_product_fk_backup LOOP
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s',
      constraint_row.conrelid::regclass, constraint_row.conname, constraint_row.definition);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
