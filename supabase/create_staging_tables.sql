-- Tabelas staging no banco V2 para receber o clone dos dados da V1.
-- Execute no SQL Editor do Supabase V2.

drop table if exists public.v1_staging_daily_claims cascade;
drop table if exists public.v1_staging_mission_completions cascade;
drop table if exists public.v1_staging_user_styles cascade;
drop table if exists public.v1_staging_quiz_answers cascade;
drop table if exists public.v1_staging_user_stickers cascade;
drop table if exists public.v1_staging_profiles cascade;

create table public.v1_staging_profiles (
  id uuid primary key,
  nick text,
  avatar_url text,
  avatar_emoji text,
  mural_opt_in boolean,
  recent_stickers integer[],
  pending_pack jsonb,
  reveals_queue jsonb,
  created_at timestamptz
);

create table public.v1_staging_user_stickers (
  user_id uuid,
  sticker_number integer,
  copies integer,
  is_rare boolean,
  first_unlocked_at timestamptz,
  primary key (user_id, sticker_number)
);

create table public.v1_staging_quiz_answers (
  user_id uuid,
  sticker_number integer,
  q_index integer,
  chosen_index integer,
  correct boolean,
  answered_at timestamptz,
  primary key (user_id, sticker_number, q_index)
);

create table public.v1_staging_user_styles (
  user_id uuid,
  style_id text,
  unlocked boolean,
  enabled boolean,
  primary key (user_id, style_id)
);

create table public.v1_staging_mission_completions (
  user_id uuid,
  mission_id text,
  completed_at timestamptz,
  primary key (user_id, mission_id)
);

create table public.v1_staging_daily_claims (
  user_id uuid,
  day date,
  style_id text,
  created_at timestamptz,
  primary key (user_id, day)
);

-- Habilitar RLS apenas para segurança, mas deixar acesso livre para service_role
alter table public.v1_staging_profiles enable row level security;
alter table public.v1_staging_user_stickers enable row level security;
alter table public.v1_staging_quiz_answers enable row level security;
alter table public.v1_staging_user_styles enable row level security;
alter table public.v1_staging_mission_completions enable row level security;
alter table public.v1_staging_daily_claims enable row level security;

grant all on public.v1_staging_profiles to service_role;
grant all on public.v1_staging_user_stickers to service_role;
grant all on public.v1_staging_quiz_answers to service_role;
grant all on public.v1_staging_user_styles to service_role;
grant all on public.v1_staging_mission_completions to service_role;
grant all on public.v1_staging_daily_claims to service_role;
