-- The previous public function exposed quiz_errors in its OUT row type.
-- PostgreSQL requires the function to be dropped before that row type can change.
-- The error count remains an internal ranking criterion and is no longer returned.

drop function if exists public.get_completed_collectors_ranking();

create function public.get_completed_collectors_ranking()
returns table(
  id uuid,
  nick text,
  avatar text,
  count bigint,
  pct integer,
  quiz_correct bigint,
  milestone_reached_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with inventory as (
    select
      p.id,
      p.nick,
      coalesce(p.avatar_url, p.avatar_emoji) as avatar,
      count(distinct us.sticker_number)
        filter (where us.copies > 0) as sticker_count,
      coalesce(
        max(us.first_unlocked_at) filter (where us.copies > 0),
        acr.claimed_at,
        p.created_at
      ) as milestone_reached_at
    from public.profiles p
    left join public.user_stickers us on us.user_id = p.id
    left join public.album_completion_rewards acr on acr.user_id = p.id
    where p.mural_opt_in
    group by
      p.id,
      p.nick,
      p.avatar_url,
      p.avatar_emoji,
      p.created_at,
      acr.claimed_at
    having count(distinct us.sticker_number)
      filter (where us.copies > 0) >= 360
  ),
  ranked as (
    select
      i.*,
      coalesce((
        select count(distinct qa.sticker_number)
        from public.quiz_answers qa
        where qa.user_id = i.id
          and qa.correct = true
          and qa.answered_at <= i.milestone_reached_at
      ), 0) as unique_quiz_correct,
      coalesce((
        select count(*)
        from public.quiz_answers qa
        where qa.user_id = i.id
          and qa.correct = false
          and qa.answered_at <= i.milestone_reached_at
      ), 0) as quiz_errors
    from inventory i
  )
  select
    id,
    nick,
    avatar,
    sticker_count as count,
    100 as pct,
    unique_quiz_correct as quiz_correct,
    milestone_reached_at
  from ranked
  order by
    unique_quiz_correct desc,
    quiz_errors asc,
    milestone_reached_at asc,
    id asc
  limit 100;
$$;

revoke all on function public.get_completed_collectors_ranking() from public;
grant execute on function public.get_completed_collectors_ranking()
  to anon, authenticated;

notify pgrst, 'reload schema';
