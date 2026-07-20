-- Supabase usually installs pgcrypto functions in the extensions schema.
-- The previous function used search_path = public, so gen_salt/crypt were not found.

create extension if not exists pgcrypto with schema extensions;

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
