-- Administrative enforcement requested on 2026-07-16.
--
-- This migration:
--   1. archives and deletes the 19 supplied fraudulent secondary accounts;
--   2. permanently blocks their normalized email addresses from new sign-ups;
--   3. applies a 24-hour authentication ban to five supplied primary accounts;
--   4. revokes existing sessions for the temporarily banned accounts.
--
-- It relies on the private audit/blocklist structures and the
-- public.hook_blocked_signup_email Auth Hook created by
-- 20260715000100_block_fraudulent_accounts.sql.

begin;

do $$
begin
  if to_regprocedure('private.normalize_auth_email(text)') is null then
    raise exception
      'Missing private.normalize_auth_email(text). Apply 20260715000100_block_fraudulent_accounts.sql first.';
  end if;

  if to_regclass('private.blocked_auth_emails') is null
     or to_regclass('private.removed_auth_accounts') is null then
    raise exception
      'Missing private fraud audit tables. Apply 20260715000100_block_fraudulent_accounts.sql first.';
  end if;
end;
$$;

-- Canonicalize and deduplicate before the upsert. This also blocks Gmail dot
-- aliases and +tags through private.normalize_auth_email.
insert into private.blocked_auth_emails (
  email_normalized,
  source_email,
  reason,
  blocked_at
)
select
  normalized.email_normalized,
  min(normalized.source_email) as source_email,
  'Fraudulent secondary account used to funnel duplicate stickers',
  now()
from (
  select
    private.normalize_auth_email(requested.email) as email_normalized,
    requested.email as source_email
  from (
    values
      ('julinhasouzapereira13@gmail.com'),
      ('rafinhamesquita13@gmail.com'),
      ('heleninhadasilva19@gmail.com'),
      ('fc.babess@gmail.com'),
      ('mariajcorrea96@gmail.com'),
      ('antoniogomesantony141@gmail.com'),
      ('tropanathaniel@gmail.com'),
      ('lisboadrizinha@gmail.com'),
      ('menezesvidal9890@gmail.com'),
      ('vidalemily280@gmail.com'),
      ('biatr2311@gmail.com'),
      ('qissuthais95@gmail.com'),
      ('bia.tr28@gmail.com'),
      ('naiaramatossouza@gmail.com'),
      ('santosmarianasantos93@gmail.com'),
      ('analrocha858@gmail.com'),
      ('katysfank@gmail.com'),
      ('filmeseseries2313@gmail.com'),
      ('noahmoodie13@gmail.com')
  ) as requested(email)
) as normalized
group by normalized.email_normalized
on conflict (email_normalized) do update
set
  source_email = excluded.source_email,
  reason = excluded.reason,
  blocked_at = excluded.blocked_at;

-- Archive and remove only exact UUID/email pairs. A mismatch aborts the whole
-- transaction so a copied UUID cannot delete an unrelated account.
do $$
declare
  account record;
  actual_email text;
begin
  for account in
    select *
    from (
      values
        ('83890149-3fb2-4da6-80b5-f60b1f5d80e1'::uuid, 'julinhasouzapereira13@gmail.com'),
        ('a853c28d-da61-4910-9875-2dbe6ee6e53b'::uuid, 'rafinhamesquita13@gmail.com'),
        ('4df0d008-db87-430e-b102-69f3a225c83f'::uuid, 'heleninhadasilva19@gmail.com'),
        ('ee60595e-845e-4ac4-8138-45b4f9c2bddc'::uuid, 'fc.babess@gmail.com'),
        ('f42ad5e8-8716-454e-baab-13c94065c083'::uuid, 'mariajcorrea96@gmail.com'),
        ('0e9f9ae3-b9fd-4981-a2db-3d244715afb1'::uuid, 'antoniogomesantony141@gmail.com'),
        ('0deac227-41c9-4881-8523-c913ff68df91'::uuid, 'tropanathaniel@gmail.com'),
        ('d1aee90b-29d1-4cbb-a8bd-44bf30761282'::uuid, 'lisboadrizinha@gmail.com'),
        ('5bfc6637-64c9-4326-bde4-27712c6c48c2'::uuid, 'menezesvidal9890@gmail.com'),
        ('61a6480c-30e2-48a3-8414-0377abf85a4b'::uuid, 'vidalemily280@gmail.com'),
        ('fabe2719-96ba-474a-8f86-0fd7db4f9205'::uuid, 'biatr2311@gmail.com'),
        ('65ba02cc-3aa5-4ea7-aa33-e661160df337'::uuid, 'qissuthais95@gmail.com'),
        ('41833db7-ef40-495b-8659-683c9756480a'::uuid, 'bia.tr28@gmail.com'),
        ('b2bbd5a2-c09c-4ac4-b593-9a5e7452e44b'::uuid, 'naiaramatossouza@gmail.com'),
        ('ee7fd76a-59b6-485b-be9f-34248ec3a5c0'::uuid, 'santosmarianasantos93@gmail.com'),
        ('6f504c41-d974-4d02-ac36-c5c2fe6a0965'::uuid, 'analrocha858@gmail.com'),
        ('b0089c8d-e82a-4cad-9ab8-90e049ef76e9'::uuid, 'katysfank@gmail.com'),
        ('6988d0df-74be-4842-af7d-4541797af64a'::uuid, 'filmeseseries2313@gmail.com'),
        ('34e5da35-67b8-4193-bb91-f6410c7a5466'::uuid, 'noahmoodie13@gmail.com')
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
    on conflict (user_id) do update
    set
      email = excluded.email,
      email_normalized = excluded.email_normalized,
      nick = excluded.nick,
      auth_created_at = excluded.auth_created_at,
      removed_at = now(),
      reason = excluded.reason,
      profile_snapshot = excluded.profile_snapshot,
      inventory_snapshot = excluded.inventory_snapshot,
      donation_snapshot = excluded.donation_snapshot;

    delete from auth.users
    where id = account.user_id
      and lower(btrim(email)) = lower(btrim(account.email));

    if not found then
      raise exception 'Auth user % was not deleted after passing validation.',
        account.user_id;
    end if;
  end loop;
end;
$$;

-- Apply a 24-hour ban without deleting or modifying these users' profile,
-- stickers, quiz answers, claims or donations. Preserve a pre-existing ban if
-- it already expires later than 24 hours from this execution.
with requested(user_id) as (
  values
    ('d0cd75ca-1dc2-4aec-aa8c-3a01735598f6'::uuid),
    ('c4d45ab5-d88d-4815-85f6-5549ab71700c'::uuid),
    ('070450cd-52d3-476c-ad51-6abd737b2566'::uuid),
    ('1932d7da-e7ed-4e1c-8150-d75abca4b9bb'::uuid),
    ('526f1952-c93e-455e-b4cc-93e543f5712d'::uuid)
)
update auth.users u
set banned_until = greatest(
  coalesce(u.banned_until, '-infinity'::timestamptz),
  now() + interval '24 hours'
)
from requested r
where u.id = r.user_id;

-- Prevent the banned users from obtaining new access tokens with an existing
-- session. Already issued short-lived JWTs expire according to the project's
-- configured JWT lifetime.
delete from auth.sessions s
where s.user_id in (
  'd0cd75ca-1dc2-4aec-aa8c-3a01735598f6'::uuid,
  'c4d45ab5-d88d-4815-85f6-5549ab71700c'::uuid,
  '070450cd-52d3-476c-ad51-6abd737b2566'::uuid,
  '1932d7da-e7ed-4e1c-8150-d75abca4b9bb'::uuid,
  '526f1952-c93e-455e-b4cc-93e543f5712d'::uuid
);

commit;
