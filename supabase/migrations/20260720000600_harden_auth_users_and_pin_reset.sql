-- Auth repair helpers for V1 cloned users and manually-created test users.
-- This migration is additive and never deletes auth.users, preserving UUID links.

create extension if not exists pgcrypto;

-- Keep cloned users compatible with GoTrue's expected email/password metadata.
update auth.users
set
  aud = coalesce(nullif(aud, ''), 'authenticated'),
  role = coalesce(nullif(role, ''), 'authenticated'),
  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || '{"provider": "email", "providers": ["email"]}'::jsonb,
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where email is not null;

-- Ensure every auth user has a matching public profile with a valid temporary nick.
insert into public.profiles (id, nick, needs_username_update, avatar_emoji, mural_opt_in)
select
  u.id,
  'user' || lower(substr(replace(u.id::text, '-', ''), 1, 8)),
  true,
  '📷',
  true
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.id = u.id
)
on conflict (id) do nothing;

-- Ensure every email/password user has an email identity.
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  u.id::text,
  now(),
  coalesce(u.created_at, now()),
  now()
from auth.users u
where u.email is not null
  and not exists (
    select 1
    from auth.identities i
    where i.user_id = u.id
      and i.provider = 'email'
  );

-- Admin-only helper: set the password hash exactly as the app expects.
-- If the user types PIN 1234, the app sends 1234CDCPIN to Supabase.
create or replace function public.admin_set_user_pin(
  target_email text,
  plain_pin text default '1234'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  if target_email is null or btrim(target_email) = '' then
    raise exception 'target_email is required';
  end if;

  if plain_pin is null or plain_pin !~ '^[0-9]{4,}$' then
    raise exception 'plain_pin must contain at least 4 digits';
  end if;

  update auth.users
  set
    encrypted_password = crypt(plain_pin || 'CDCPIN', gen_salt('bf')),
    aud = coalesce(nullif(aud, ''), 'authenticated'),
    role = coalesce(nullif(role, ''), 'authenticated'),
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || '{"provider": "email", "providers": ["email"]}'::jsonb,
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
  where lower(email) = lower(target_email)
  returning id into target_user_id;

  if target_user_id is null then
    raise exception 'User not found for email %', target_email;
  end if;

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    u.id,
    jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
    'email',
    u.id::text,
    now(),
    coalesce(u.created_at, now()),
    now()
  from auth.users u
  where u.id = target_user_id
    and not exists (
      select 1
      from auth.identities i
      where i.user_id = u.id
        and i.provider = 'email'
    );

  insert into public.profiles (id, nick, needs_username_update, avatar_emoji, mural_opt_in)
  select
    u.id,
    'user' || lower(substr(replace(u.id::text, '-', ''), 1, 8)),
    true,
    '📷',
    true
  from auth.users u
  where u.id = target_user_id
  on conflict (id) do nothing;

  return target_user_id;
end;
$$;

revoke all on function public.admin_set_user_pin(text, text) from public, anon, authenticated;
grant execute on function public.admin_set_user_pin(text, text) to service_role;
