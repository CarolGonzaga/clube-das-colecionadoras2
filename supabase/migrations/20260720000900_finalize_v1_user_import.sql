-- Finaliza a importacao V1 -> V2 depois que auth.users e as tabelas
-- public.v1_staging_* ja estiverem carregadas.
--
-- Antes deste arquivo, execute a versao atual de supabase/run_migration_logic.sql.

-- Nao continue silenciosamente se duas contas da mesma instancia compartilham
-- o mesmo e-mail. O GoTrue nao consegue decidir qual delas autenticar.
do $$
begin
  if exists (
    select 1
    from auth.users
    where email is not null
    group by lower(btrim(email))
    having count(*) > 1
  ) then
    raise exception
      'Existem e-mails duplicados em auth.users. Resolva-os antes da migracao em lote.';
  end if;
end;
$$;

-- Normaliza somente as contas que possuem perfil no staging da V1.
update auth.users u
set
  instance_id = coalesce(
    u.instance_id,
    '00000000-0000-0000-0000-000000000000'::uuid
  ),
  aud = coalesce(nullif(u.aud, ''), 'authenticated'),
  role = coalesce(nullif(u.role, ''), 'authenticated'),
  confirmation_token = coalesce(u.confirmation_token, ''),
  recovery_token = coalesce(u.recovery_token, ''),
  email_change_token_new = coalesce(u.email_change_token_new, ''),
  email_change = coalesce(u.email_change, ''),
  phone_change = coalesce(u.phone_change, ''),
  phone_change_token = coalesce(u.phone_change_token, ''),
  email_change_token_current = coalesce(u.email_change_token_current, ''),
  reauthentication_token = coalesce(u.reauthentication_token, ''),
  email_change_confirm_status = coalesce(u.email_change_confirm_status, 0),
  is_sso_user = coalesce(u.is_sso_user, false),
  is_anonymous = coalesce(u.is_anonymous, false),
  raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb)
    || '{"provider":"email","providers":["email"]}'::jsonb,
  raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb),
  email_confirmed_at = coalesce(u.email_confirmed_at, now()),
  updated_at = now()
from public.v1_staging_profiles s
where s.id = u.id;

-- Corrige identidades existentes para o formato esperado pelo GoTrue.
update auth.identities i
set
  provider_id = lower(btrim(u.email)),
  identity_data = coalesce(i.identity_data, '{}'::jsonb)
    || jsonb_build_object(
      'sub', u.id::text,
      'email', u.email,
      'email_verified', true
    ),
  updated_at = now()
from auth.users u
join public.v1_staging_profiles s on s.id = u.id
where i.user_id = u.id
  and i.provider = 'email'
  and u.email is not null;

-- Cria a identidade de e-mail se alguma conta importada ainda nao a possuir.
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
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true
  ),
  'email',
  lower(btrim(u.email)),
  now(),
  coalesce(u.created_at, now()),
  now()
from auth.users u
join public.v1_staging_profiles s on s.id = u.id
where u.email is not null
  and not exists (
    select 1
    from auth.identities i
    where i.user_id = u.id
      and i.provider = 'email'
  );

-- Processa no maximo batch_size contas por chamada. Contas concluidas ou que
-- ja falharam ficam fora dos lotes seguintes e permanecem na auditoria.
create or replace function public.migrate_v1_batch(batch_size integer default 100)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate record;
  migration_result jsonb;
  processed_count integer := 0;
  success_count integer := 0;
  failure_count integer := 0;
  remaining_count integer := 0;
begin
  if batch_size < 1 or batch_size > 250 then
    raise exception 'batch_size deve estar entre 1 e 250';
  end if;

  for candidate in
    select s.id
    from public.v1_staging_profiles s
    join auth.users u on u.id = s.id
    left join public.v2_migration_claims c on c.user_id = s.id
    where c.user_id is null
    order by s.id
    limit batch_size
  loop
    migration_result := public.migrate_user_v1_to_v2(candidate.id);
    processed_count := processed_count + 1;

    if coalesce((migration_result->>'success')::boolean, false) then
      success_count := success_count + 1;
    else
      failure_count := failure_count + 1;
    end if;
  end loop;

  select count(*) into remaining_count
  from public.v1_staging_profiles s
  join auth.users u on u.id = s.id
  left join public.v2_migration_claims c on c.user_id = s.id
  where c.user_id is null;

  return jsonb_build_object(
    'processed', processed_count,
    'completed', success_count,
    'failed', failure_count,
    'remaining', remaining_count
  );
end;
$$;

revoke all on function public.migrate_v1_batch(integer)
from public, anon, authenticated;
grant execute on function public.migrate_v1_batch(integer) to service_role;

