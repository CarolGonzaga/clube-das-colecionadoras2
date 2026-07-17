-- Administrative cleanup requested on 2026-07-15.
--
-- This migration:
--   1. keeps a private snapshot of the removed accounts for audit purposes;
--   2. blocks the supplied addresses from being used in future sign-ups;
--   3. canonicalizes Gmail addresses so dot and +tag aliases are blocked too;
--   4. removes an auth user only when both UUID and email match the supplied pair.
--
-- After applying this migration, enable the Postgres function
-- public.hook_blocked_signup_email as the "Before User Created" Auth Hook in
-- Authentication > Hooks. Creating the function alone does not enable the hook.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create or replace function private.normalize_auth_email(input_email text)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  normalized text := lower(btrim(input_email));
  local_part text;
  domain_part text;
begin
  if position('@' in normalized) = 0 then
    return normalized;
  end if;

  local_part := split_part(normalized, '@', 1);
  domain_part := split_part(normalized, '@', 2);

  -- Gmail treats dots as insignificant and supports +tag aliases.  Googlemail
  -- is canonicalized to gmail.com so all of those variants share one block.
  if domain_part in ('gmail.com', 'googlemail.com') then
    local_part := replace(split_part(local_part, '+', 1), '.', '');
    domain_part := 'gmail.com';
  end if;

  return local_part || '@' || domain_part;
end;
$$;

create table if not exists private.blocked_auth_emails (
  email_normalized text primary key,
  source_email text not null,
  reason text not null,
  blocked_at timestamptz not null default now()
);

create table if not exists private.removed_auth_accounts (
  user_id uuid primary key,
  email text not null,
  email_normalized text not null,
  nick text,
  auth_created_at timestamptz,
  removed_at timestamptz not null default now(),
  reason text not null,
  profile_snapshot jsonb,
  inventory_snapshot jsonb not null default '[]'::jsonb,
  donation_snapshot jsonb not null default '[]'::jsonb
);

revoke all on all tables in schema private from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

insert into private.blocked_auth_emails (email_normalized, source_email, reason)
select
  normalized.email_normalized,
  min(normalized.source_email) as source_email,
  'Fraudulent secondary account used to funnel duplicate stickers'
from (
  select
    private.normalize_auth_email(blocked.email) as email_normalized,
    blocked.email as source_email
  from (
    values
      ('a.taideb1105@gmail.com'),
      ('ataideb1105@gmail.com'),
      ('contato.atrixye@gmail.com'),
      ('atai.deb1105@gmail.com'),
      ('victoria.franca@ilc.ufpa.br'),
      ('beatriz.b.ataide@aluno.uepa.br'),
      ('ataide.b1105@gmail.com'),
      ('ataid.eb1105@gmail.com'),
      ('matheus20ana@gmail.com'),
      ('cont.atoatrixye@gmail.com'),
      ('at.aideb1105@gmail.com'),
      ('ata.ideb1105@gmail.com'),
      ('contatoatrixye@gmail.com'),
      ('trixsalveomundo@gmail.com'),
      ('potededocuravivi@gmail.com')
  ) as blocked(email)
) as normalized
group by normalized.email_normalized
on conflict (email_normalized) do update
set
  reason = excluded.reason,
  blocked_at = now();

-- Archive and delete only exact UUID/email pairs.  A mismatch aborts the
-- operation instead of risking deletion of an unrelated account.  A UUID that
-- was already removed is reported as a warning, keeping the migration safe to
-- run again.
do $$
declare
  account record;
  actual_email text;
begin
  for account in
    select *
    from (
      values
        ('14342a23-fd04-4b1d-ba94-690bad53d1c4'::uuid, 'a.taideb1105@gmail.com'),
        ('9a382446-1758-4257-96f1-27654e8d720d'::uuid, 'ataideb1105@gmail.com'),
        ('b3774359-bf6e-46eb-8a74-2ebe32acb2f2'::uuid, 'contato.atrixye@gmail.com'),
        ('f2d69554-e88b-4a9d-845e-72b88525bb4c'::uuid, 'atai.deb1105@gmail.com'),
        ('4da36e3e-c6f4-4dbb-b1fd-85544d4dcbc4'::uuid, 'victoria.franca@ilc.ufpa.br'),
        ('78f6255a-52cb-437a-85d4-02cab4e98b13'::uuid, 'beatriz.b.ataide@aluno.uepa.br'),
        ('a975598a-b9bb-4d0d-9ee7-4ff2bc0540ee'::uuid, 'ataide.b1105@gmail.com'),
        ('9138c08b-6535-4a52-96ce-0f8dffaac846'::uuid, 'ataid.eb1105@gmail.com'),
        ('5e7257d1-c7af-4f35-85a5-300dc10db9f4'::uuid, 'matheus20ana@gmail.com'),
        ('b5098406-73b4-4704-8b50-c71e1a278b54'::uuid, 'cont.atoatrixye@gmail.com'),
        ('d7a10a69-d1e8-483f-a6e9-e4a8e08666a9'::uuid, 'at.aideb1105@gmail.com'),
        ('8802e4ae-60ba-4042-b0df-c3f1bcdda734'::uuid, 'ata.ideb1105@gmail.com'),
        ('36461365-dd87-48a6-bea3-a092986f922c'::uuid, 'contatoatrixye@gmail.com'),
        ('0d53a51b-ae03-4ff8-aa6e-8e1b45018c5e'::uuid, 'trixsalveomundo@gmail.com'),
        ('36ad9e35-55da-4fe9-bacb-aaa347dcfba8'::uuid, 'potededocuravivi@gmail.com')
    ) as requested(user_id, email)
  loop
    select u.email
    into actual_email
    from auth.users u
    where u.id = account.user_id;

    if not found then
      raise warning 'Auth user % is already absent; email % remains blocked.',
        account.user_id, account.email;
      continue;
    end if;

    if lower(btrim(actual_email)) <> lower(btrim(account.email)) then
      raise exception
        'Safety check failed for UUID %: database email is %, expected %.',
        account.user_id, actual_email, account.email;
    end if;

    insert into private.removed_auth_accounts (
      user_id,
      email,
      email_normalized,
      nick,
      auth_created_at,
      reason,
      profile_snapshot,
      inventory_snapshot,
      donation_snapshot
    )
    select
      u.id,
      u.email,
      private.normalize_auth_email(u.email),
      p.nick,
      u.created_at,
      'Fraudulent secondary account used to funnel duplicate stickers',
      to_jsonb(p),
      coalesce((
        select jsonb_agg(to_jsonb(us) order by us.sticker_number)
        from public.user_stickers us
        where us.user_id = u.id
      ), '[]'::jsonb),
      coalesce((
        select jsonb_agg(to_jsonb(d) order by d.created_at)
        from public.donations d
        where d.from_user = u.id or d.to_user = u.id
      ), '[]'::jsonb)
    from auth.users u
    left join public.profiles p on p.id = u.id
    where u.id = account.user_id
    on conflict (user_id) do nothing;

    delete from auth.users
    where id = account.user_id
      and lower(btrim(email)) = lower(btrim(account.email));
  end loop;
end;
$$;

-- Postgres implementation of Supabase Auth's Before User Created hook.
create or replace function public.hook_blocked_signup_email(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_email text;
  requested_normalized text;
begin
  requested_email := event -> 'user' ->> 'email';

  -- Phone-only and other non-email identities are outside this blocklist.
  if requested_email is null or btrim(requested_email) = '' then
    return '{}'::jsonb;
  end if;

  requested_normalized := private.normalize_auth_email(requested_email);

  if exists (
    select 1
    from private.blocked_auth_emails b
    where b.email_normalized = requested_normalized
  ) then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Não foi possível criar uma conta com este e-mail.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_blocked_signup_email(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_blocked_signup_email(jsonb)
  from public, anon, authenticated;
