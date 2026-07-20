-- Estrutura de auditoria e lógica transacional de migração individual (V1 -> V2).
-- Execute no SQL Editor do Supabase V2.

-- 1. Criar tabela de auditoria de migrações
create table if not exists public.v2_migration_claims (
  user_id uuid primary key references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('pending', 'completed', 'failed')),
  stickers_imported integer not null default 0,
  styles_imported integer not null default 0,
  quiz_answers_imported integer not null default 0,
  raw_snapshot jsonb,
  error_message text
);

alter table public.v2_migration_claims enable row level security;
grant select on public.v2_migration_claims to authenticated;

-- 2. Adicionar coluna no perfil da V2 para controlar o aviso amigável de alteração de username único
alter table public.profiles 
  add column if not exists username text unique,
  add column if not exists needs_username_update boolean not null default false;

-- 3. Função de migração transacional (Security Definer para ter permissão de ler e escrever em todas as tabelas)
create or replace function public.migrate_user_v1_to_v2(target_user_id uuid)
returns jsonb as $$
declare
  staging_profile_row record;
  stickers_count integer := 0;
  styles_count integer := 0;
  quiz_count integer := 0;
  temp_username text;
  success boolean := false;
  migration_status text := 'pending';
  err_msg text;
begin
  -- Verifica se o usuário existe na base auth.users da V2
  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'Usuária não encontrada na tabela auth.users da V2. Por favor, migre a conta auth primeiro.';
  end if;

  -- Se já migrou com sucesso, retorna o resultado anterior
  if exists (select 1 from public.v2_migration_claims where user_id = target_user_id and status = 'completed') then
    return jsonb_build_object('success', true, 'message', 'Usuária já migrada anteriormente.');
  end if;

  -- Busca dados da V1 nas tabelas staging
  select * into staging_profile_row
  from public.v1_staging_profiles
  where id = target_user_id;

  if staging_profile_row.id is null then
    return jsonb_build_object('success', false, 'message', 'Nenhum histórico V1 encontrado para esta usuária.');
  end if;

  -- Iniciar log de migração
  insert into public.v2_migration_claims (user_id, status)
  values (target_user_id, 'pending')
  on conflict (user_id) do update set status = 'pending', started_at = now(), error_message = null;

  -- 1. Gerar username único temporário baseado no ID (ex: colecionadora8fa21c)
  temp_username := 'colecionadora' || substring(replace(target_user_id::text, '-', '') from 1 for 6);

  -- Garante que seja único (caso colida, adiciona número randômico)
  while exists (select 1 from public.profiles where username = temp_username) loop
    temp_username := 'colecionadora' || substring(replace(target_user_id::text, '-', '') from 1 for 5) || floor(random() * 9)::text;
  end loop;

  -- 2. Migrar perfil para public.profiles da V2
  insert into public.profiles (
    id,
    nick,
    username,
    avatar_url,
    avatar_emoji,
    mural_opt_in,
    recent_stickers,
    pending_pack,
    reveals_queue,
    needs_username_update,
    created_at
  )
  values (
    target_user_id,
    case
      when staging_profile_row.nick ~ '^[a-z0-9]+$' then staging_profile_row.nick
      else 'user' || lower(substring(replace(target_user_id::text, '-', '') from 1 for 8))
    end,
    temp_username,
    staging_profile_row.avatar_url,
    staging_profile_row.avatar_emoji,
    coalesce(staging_profile_row.mural_opt_in, true),
    coalesce(staging_profile_row.recent_stickers, '{}'),
    coalesce(staging_profile_row.pending_pack, null),
    coalesce(staging_profile_row.reveals_queue, '[]'::jsonb),
    true, -- Ativa o aviso amigável para alterar o username genérico
    coalesce(staging_profile_row.created_at, now())
  )
  on conflict (id) do update set
    nick = excluded.nick,
    username = coalesce(public.profiles.username, excluded.username),
    avatar_url = excluded.avatar_url,
    avatar_emoji = excluded.avatar_emoji,
    mural_opt_in = excluded.mural_opt_in,
    recent_stickers = excluded.recent_stickers,
    needs_username_update = true;

  -- 3. Migrar figurinhas coladas e repetidas
  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  select
    user_id,
    sticker_number,
    greatest(coalesce(copies, 0), 0),
    coalesce(is_rare, false),
    coalesce(first_unlocked_at, now())
  from public.v1_staging_user_stickers
  where user_id = target_user_id
  on conflict (user_id, sticker_number) do update set
    copies = excluded.copies,
    is_rare = excluded.is_rare;

  select count(*) into stickers_count
  from public.user_stickers
  where user_id = target_user_id;

  -- 4. Migrar respostas de quiz
  insert into public.quiz_answers (
    user_id,
    sticker_number,
    q_index,
    chosen_index,
    correct,
    answered_at,
    attempt_day
  )
  select
    user_id,
    sticker_number,
    q_index,
    chosen_index,
    coalesce(correct, false),
    coalesce(answered_at, now()),
    (coalesce(answered_at, now()) at time zone 'America/Sao_Paulo')::date
  from public.v1_staging_quiz_answers
  where user_id = target_user_id
  -- A V2 permite novas tentativas diarias e a chave antiga
  -- (user_id, sticker_number, q_index) deixou de ser unica.
  -- Sem alvo explicito, qualquer restricao unica vigente e respeitada.
  on conflict do nothing;

  select count(*) into quiz_count
  from public.quiz_answers
  where user_id = target_user_id;

  -- 5. Migrar estilos resgatados
  insert into public.user_styles (user_id, style_id, unlocked, enabled)
  select user_id, style_id, coalesce(unlocked, false), coalesce(enabled, false)
  from public.v1_staging_user_styles
  where user_id = target_user_id
  on conflict (user_id, style_id) do update set
    unlocked = excluded.unlocked,
    enabled = excluded.enabled;

  select count(*) into styles_count
  from public.user_styles
  where user_id = target_user_id;

  -- 6. Migrar missões concluídas
  insert into public.mission_completions (user_id, mission_id, completed_at)
  select user_id, mission_id, coalesce(completed_at, now())
  from public.v1_staging_mission_completions
  where user_id = target_user_id
  on conflict (user_id, mission_id) do nothing;

  -- 7. Migrar logins diários (daily claims)
  insert into public.daily_claims (user_id, day, style_id, created_at)
  select user_id, day, style_id, coalesce(created_at, day::timestamptz, now())
  from public.v1_staging_daily_claims
  where user_id = target_user_id
  on conflict (user_id, day) do nothing;

  -- 8. Migrar recompensas e códigos resgatados (reward_grants)
  insert into public.reward_grants (user_id, reward_key, granted_at)
  select user_id, reward_key, coalesce(granted_at, now())
  from public.v1_staging_reward_grants
  where user_id = target_user_id
  on conflict (user_id, reward_key) do nothing;

  -- 9. Migrar famílias de tags completadas (completed_tags)
  insert into public.completed_tags (user_id, tag_name, completed_at)
  select user_id, tag_name, coalesce(completed_at, now())
  from public.v1_staging_completed_tags
  where user_id = target_user_id
  on conflict (user_id, tag_name) do nothing;

  -- Registrar sucesso da migração
  update public.v2_migration_claims
  set status = 'completed',
      completed_at = now(),
      stickers_imported = stickers_count,
      styles_imported = styles_count,
      quiz_answers_imported = quiz_count,
      raw_snapshot = jsonb_build_object(
        'nick_antigo', staging_profile_row.nick,
        'username_temporario', temp_username
      )
  where user_id = target_user_id;

  return jsonb_build_object(
    'success', true,
    'message', 'Usuária migrada com sucesso!',
    'stickers_imported', stickers_count,
    'styles_imported', styles_count,
    'quiz_answers_imported', quiz_count,
    'temp_username', temp_username
  );

exception when others then
  get stacked diagnostics err_msg = message_text;
  
  update public.v2_migration_claims
  set status = 'failed',
      completed_at = now(),
      error_message = err_msg
  where user_id = target_user_id;

  return jsonb_build_object(
    'success', false,
    'message', 'Erro na migração: ' || err_msg
  );
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.migrate_user_v1_to_v2(uuid) from public, anon, authenticated;
grant execute on function public.migrate_user_v1_to_v2(uuid) to service_role;
