-- O mural público expõe somente as vinte primeiras colocadas.
CREATE OR REPLACE FUNCTION public.get_public_mural()
RETURNS TABLE(
  id uuid,
  nick text,
  avatar text,
  count bigint,
  pct integer,
  quiz_correct bigint,
  rare_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH mural_data AS (
    SELECT
      p.id,
      p.nick,
      coalesce(p.avatar_url, p.avatar_emoji) AS avatar,
      count(DISTINCT us.sticker_number) FILTER (WHERE us.copies > 0) AS count,
      round(
        count(DISTINCT us.sticker_number) FILTER (WHERE us.copies > 0)
        * 100.0 / 360
      )::integer AS pct,
      coalesce((
        SELECT count(*)
        FROM public.quiz_answers qa
        WHERE qa.user_id = p.id AND qa.correct = true
      ), 0) AS quiz_correct,
      count(DISTINCT us.sticker_number)
        FILTER (WHERE us.copies > 0 AND us.is_rare) AS rare_count,
      p.created_at
    FROM public.profiles p
    LEFT JOIN public.user_stickers us ON us.user_id = p.id
    WHERE p.mural_opt_in
    GROUP BY p.id, p.nick, p.avatar_url, p.avatar_emoji, p.created_at
  )
  SELECT id, nick, avatar, count, pct, quiz_correct, rare_count
  FROM mural_data
  ORDER BY pct DESC, count DESC, rare_count DESC, quiz_correct DESC, created_at ASC
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.get_public_mural() FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_mural() TO anon, authenticated;
