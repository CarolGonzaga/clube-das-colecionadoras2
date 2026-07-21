-- Some V2 databases were imported before reward_is_rare was introduced.
-- The restored quiz flow persists the rarity actually granted in this column,
-- so add it without changing any existing answer or sticker state.

ALTER TABLE public.quiz_answers
  ADD COLUMN IF NOT EXISTS reward_is_rare boolean;

UPDATE public.quiz_answers qa
SET reward_is_rare = coalesce(qr.is_rare, false)
FROM public.quiz_reward_rarities qr
WHERE qr.user_id = qa.user_id
  AND qr.sticker_number = qa.sticker_number
  AND qa.correct = true
  AND qa.reward_is_rare IS NULL;

UPDATE public.quiz_answers
SET reward_is_rare = false
WHERE reward_is_rare IS NULL;

ALTER TABLE public.quiz_answers
  ALTER COLUMN reward_is_rare SET DEFAULT false,
  ALTER COLUMN reward_is_rare SET NOT NULL;

NOTIFY pgrst, 'reload schema';
