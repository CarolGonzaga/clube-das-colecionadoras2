-- Split the public mural into active collectors and completed collectors.
-- Rarity is intentionally excluded because the album-completion reward turns
-- the same canonical set of 30 stickers rare for every completed user.

create or replace function public.get_public_mural()
returns table(
  id uuid,
  nick text,
  avatar text,
  count bigint,
  pct integer,
  quiz_correct bigint,
  rare_count bigint
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
      count(distinct us.sticker_number)
        filter (where us.copies > 0 and us.is_rare) as current_rare_count,
      max(us.first_unlocked_at)
        filter (where us.copies > 0) as milestone_reached_at,
      p.created_at
    from public.profiles p
    left join public.user_stickers us on us.user_id = p.id
    where p.mural_opt_in
    group by
      p.id,
      p.nick,
      p.avatar_url,
      p.avatar_emoji,
      p.created_at
  ),
  ranked as (
    select
      i.*,
      coalesce((
        select count(distinct qa.sticker_number)
        from public.quiz_answers qa
        where qa.user_id = i.id
          and qa.correct = true
      ), 0) as unique_quiz_correct,
      coalesce((
        select count(*)
        from public.quiz_answers qa
        where qa.user_id = i.id
          and qa.correct = false
      ), 0) as quiz_errors
    from inventory i
    where i.sticker_count < 360
  )
  select
    id,
    nick,
    avatar,
    sticker_count as count,
    round(sticker_count * 100.0 / 360)::integer as pct,
    unique_quiz_correct as quiz_correct,
    current_rare_count as rare_count
  from ranked
  order by
    sticker_count desc,
    unique_quiz_correct desc,
    quiz_errors asc,
    milestone_reached_at asc nulls last,
    id asc
  limit 20;
$$;

revoke all on function public.get_public_mural() from public;
grant execute on function public.get_public_mural() to anon, authenticated;

create or replace function public.get_completed_collectors_ranking()
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

create or replace function public.get_user_mural_rank(user_id_param uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with inventory as (
    select
      p.id,
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
    group by p.id, p.created_at, acr.claimed_at
  ),
  metrics as (
    select
      i.*,
      i.sticker_count >= 360 as completed,
      coalesce((
        select count(distinct qa.sticker_number)
        from public.quiz_answers qa
        where qa.user_id = i.id
          and qa.correct = true
          and (
            i.sticker_count < 360
            or qa.answered_at <= i.milestone_reached_at
          )
      ), 0) as unique_quiz_correct,
      coalesce((
        select count(*)
        from public.quiz_answers qa
        where qa.user_id = i.id
          and qa.correct = false
          and (
            i.sticker_count < 360
            or qa.answered_at <= i.milestone_reached_at
          )
      ), 0) as quiz_errors
    from inventory i
  ),
  positioned as (
    select
      id,
      row_number() over (
        partition by completed
        order by
          sticker_count desc,
          unique_quiz_correct desc,
          quiz_errors asc,
          milestone_reached_at asc,
          id asc
      )::integer as position
    from metrics
  )
  select position
  from positioned
  where id = user_id_param;
$$;

revoke all on function public.get_user_mural_rank(uuid) from public;
grant execute on function public.get_user_mural_rank(uuid)
  to anon, authenticated;

notify pgrst, 'reload schema';
