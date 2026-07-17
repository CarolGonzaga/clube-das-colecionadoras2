-- Use a camera as the default avatar for future accounts and migrate the
-- previous flower default, without touching a member's chosen avatar.
alter table public.profiles
  alter column avatar_emoji set default '📷';

update public.profiles
set avatar_emoji = '📷'
where avatar_emoji = '🌸'
  and avatar_url is null;

-- Keep the auth trigger aligned with the new default for future profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nick, avatar_emoji, mural_opt_in)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nick', 'Colecionadora'),
    '📷',
    coalesce((new.raw_user_meta_data ->> 'mural_opt_in')::boolean, false)
  );
  insert into public.user_styles (user_id, style_id, unlocked, enabled) values
    (new.id, 'lilac', false, false),
    (new.id, 'avatar-neon-frame', false, false),
    (new.id, 'new-icon', false, false),
    (new.id, 'theme-dark', false, false),
    (new.id, 'glitter', false, false),
    (new.id, 'story-layout', false, false),
    (new.id, 'goldframe', false, false);
  return new;
end;
$$;
