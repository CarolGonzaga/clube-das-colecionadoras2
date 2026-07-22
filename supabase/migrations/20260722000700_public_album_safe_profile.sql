-- Public albums expose only the fields required by their presentation.
begin;

create or replace function public.get_public_profile(profile_id uuid)
returns table(id uuid, nick text, avatar_url text, avatar_emoji text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.nick, p.avatar_url, p.avatar_emoji
  from public.profiles p
  where p.id = profile_id;
$$;

create or replace function public.get_public_styles(profile_id uuid)
returns table(style_id text)
language sql
stable
security definer
set search_path = public
as $$
  select us.style_id
  from public.user_styles us
  where us.user_id = profile_id
    and us.unlocked = true
    and us.enabled = true;
$$;

revoke all on function public.get_public_profile(uuid) from public;
revoke all on function public.get_public_styles(uuid) from public;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;
grant execute on function public.get_public_styles(uuid) to anon, authenticated;

commit;
