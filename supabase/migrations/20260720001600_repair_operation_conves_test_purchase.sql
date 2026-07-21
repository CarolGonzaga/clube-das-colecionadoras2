-- Repair the single purchase made while exclusive-359 still resolved to the
-- previous sticker. The predicates make this safe to execute more than once.

DO $$
DECLARE
  affected_user uuid;
  affected_quantity integer;
BEGIN
  SELECT po.user_id, poi.quantity
  INTO affected_user, affected_quantity
  FROM public.purchase_order_items poi
  JOIN public.purchase_orders po ON po.id = poi.order_id
  WHERE poi.id = 'a6492226-ebcc-4735-bf29-da61b7112046'::uuid
    AND poi.sticker_number = 358
    AND poi.product_name = 'Garotas como eu'
  FOR UPDATE;

  -- No row means it was already repaired or the expected order was not found.
  IF affected_user IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.user_stickers
  SET copies = greatest(0, copies - affected_quantity)
  WHERE user_id = affected_user AND sticker_number = 358;

  DELETE FROM public.user_stickers
  WHERE user_id = affected_user AND sticker_number = 358 AND copies <= 0;

  INSERT INTO public.user_stickers
    (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  VALUES
    (affected_user, 359, affected_quantity, false, now())
  ON CONFLICT (user_id, sticker_number) DO UPDATE
  SET copies = public.user_stickers.copies + excluded.copies;

  UPDATE public.purchase_order_items
  SET product_id = 'exclusive-359',
      product_name = 'Operação Convés',
      sticker_number = 359,
      metadata = coalesce(metadata, '{}'::jsonb)
        || jsonb_build_object('shop_number_repaired', true)
  WHERE id = 'a6492226-ebcc-4735-bf29-da61b7112046'::uuid;
END $$;

NOTIFY pgrst, 'reload schema';
