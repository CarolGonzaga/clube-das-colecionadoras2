-- Fix email identities created during V1 import repair.
-- Supabase email identities should use the email address as provider_id, not the user UUID.

update auth.identities i
set
  provider_id = lower(u.email),
  identity_data = coalesce(i.identity_data, '{}'::jsonb)
    || jsonb_build_object(
      'sub', u.id::text,
      'email', u.email,
      'email_verified', true
    ),
  updated_at = now()
from auth.users u
where i.user_id = u.id
  and i.provider = 'email'
  and u.email is not null
  and (
    i.provider_id is distinct from lower(u.email)
    or i.identity_data->>'email' is distinct from u.email
    or i.identity_data->>'sub' is distinct from u.id::text
  );

create or replace function public.admin_auth_login_diagnostic(
  target_email text,
  plain_pin text default '1234'
)
returns table (
  user_id uuid,
  email text,
  aud text,
  role text,
  email_confirmed boolean,
  password_hash_exists boolean,
  password_matches_app_pin boolean,
  email_identity_exists boolean,
  email_identity_provider_id text,
  raw_app_meta_data jsonb
)
language sql
security definer
set search_path = public, extensions
as $$
  select
    u.id,
    u.email,
    u.aud,
    u.role,
    u.email_confirmed_at is not null as email_confirmed,
    u.encrypted_password is not null and u.encrypted_password <> '' as password_hash_exists,
    extensions.crypt(plain_pin || 'CDCPIN', u.encrypted_password) = u.encrypted_password as password_matches_app_pin,
    i.id is not null as email_identity_exists,
    i.provider_id as email_identity_provider_id,
    u.raw_app_meta_data
  from auth.users u
  left join auth.identities i
    on i.user_id = u.id
   and i.provider = 'email'
  where lower(u.email) = lower(target_email)
  limit 1;
$$;

revoke all on function public.admin_auth_login_diagnostic(text, text) from public, anon, authenticated;
grant execute on function public.admin_auth_login_diagnostic(text, text) to service_role;

create or replace function public.admin_set_user_pin(
  target_email text,
  plain_pin text default '1234'
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  target_user_id uuid;
  target_user_email text;
begin
  if target_email is null or btrim(target_email) = '' then
    raise exception 'target_email is required';
  end if;

  if plain_pin is null or plain_pin !~ '^[0-9]{4,}$' then
    raise exception 'plain_pin must contain at least 4 digits';
  end if;

  update auth.users
  set
    encrypted_password = extensions.crypt(plain_pin || 'CDCPIN', extensions.gen_salt('bf')),
    aud = coalesce(nullif(aud, ''), 'authenticated'),
    role = coalesce(nullif(role, ''), 'authenticated'),
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || '{"provider": "email", "providers": ["email"]}'::jsonb,
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
  where lower(email) = lower(target_email)
  returning id, email into target_user_id, target_user_email;

  if target_user_id is null then
    raise exception 'User not found for email %', target_email;
  end if;

  update auth.identities
  set
    provider_id = lower(target_user_email),
    identity_data = coalesce(identity_data, '{}'::jsonb)
      || jsonb_build_object(
        'sub', target_user_id::text,
        'email', target_user_email,
        'email_verified', true
      ),
    updated_at = now()
  where user_id = target_user_id
    and provider = 'email';

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
    lower(u.email),
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
