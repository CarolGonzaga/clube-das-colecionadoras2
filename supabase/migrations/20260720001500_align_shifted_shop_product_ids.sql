-- Align stable shop IDs with the sticker numbers changed by migration 014.
-- Purchase repair is intentionally handled separately: this production
-- stickers table has no reliable migration timestamp to distinguish a new
-- incorrect purchase from a legitimate historical purchase.

DO $$
DECLARE
  constraint_row record;
  old_number integer;
  ids_need_shift boolean;
BEGIN
  IF to_regclass('public.shop_products') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stickers WHERE number = 360 AND slug = 'extra'
  ) THEN
    RAISE EXCEPTION 'Bonus sticker 360 is missing; shop alignment cancelled';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.shop_products
    WHERE product_type = 'exclusive'
      AND id ~ '^exclusive-[0-9]+$'
      AND substring(id FROM '^exclusive-([0-9]+)$')::integer = sticker_number + 1
  ) INTO ids_need_shift;

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
