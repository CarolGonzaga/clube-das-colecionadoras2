-- Caça-Palavras Sáfico: estruturas isoladas, privadas e reversíveis.
-- A flag nasce desligada. Nenhuma estrutura existente é removida.
begin;

create table if not exists public.game_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.game_access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null,
  is_active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_key)
);

create table if not exists public.game_word_bank (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('trope', 'genre')),
  display_value text not null,
  normalized_value text not null,
  is_active boolean not null default true,
  minimum_difficulty text not null default 'easy'
    check (minimum_difficulty in ('easy', 'medium', 'hard')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique (category, normalized_value)
);

create table if not exists public.word_search_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null default 'word_search' check (game_key = 'word_search'),
  local_date date not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  board jsonb not null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'won', 'claimed', 'abandoned')),
  total_words integer not null check (total_words in (5, 7)),
  found_words integer not null default 0 check (found_words >= 0 and found_words <= total_words),
  algorithm_version text not null default 'word-search-v1',
  started_at timestamptz not null default now(),
  won_at timestamptz,
  claimed_at timestamptz,
  abandoned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists word_search_one_active_per_user
  on public.word_search_sessions(user_id)
  where status in ('in_progress', 'won');
create index if not exists word_search_sessions_user_date_idx
  on public.word_search_sessions(user_id, local_date desc);

create table if not exists public.word_search_session_words (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.word_search_sessions(id) on delete cascade,
  source_type text not null check (source_type in ('trope', 'genre', 'book', 'author')),
  source_id text,
  category text not null,
  display_word text not null,
  normalized_word text not null,
  path jsonb not null,
  direction text not null,
  is_reversed boolean not null default false,
  found_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, normalized_word)
);
create index if not exists word_search_words_session_idx
  on public.word_search_session_words(session_id);

create table if not exists public.daily_game_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_date date not null,
  game_key text not null,
  session_id uuid not null references public.word_search_sessions(id) on delete restrict,
  sticker_number integer not null check (sticker_number between 21 and 193),
  result_type text not null check (result_type in ('new', 'duplicate', 'completed_collection_bonus')),
  is_rare boolean not null default false,
  rare_bonus_applied boolean not null default false,
  missing_pool_size integer not null,
  owned_pool_size integer not null,
  algorithm_version text not null default 'game-reward-v1',
  created_at timestamptz not null default now(),
  unique (user_id, reward_date),
  unique (session_id)
);
create index if not exists daily_game_rewards_user_idx
  on public.daily_game_rewards(user_id, reward_date desc);

insert into public.game_settings (key, value, description)
values
  ('word_search_enabled', 'false'::jsonb, 'Desliga ou liga globalmente o Caça-Palavras Sáfico.'),
  ('completed_collection_rare_probability', '0.70'::jsonb, 'Chance de versão rara após completar 21–193.'),
  ('word_search_generation_attempt_limit', '200'::jsonb, 'Tentativas máximas por conjunto no gerador.'),
  ('word_search_min_word_length', '4'::jsonb, 'Tamanho mínimo normalizado.')
on conflict (key) do nothing;

insert into public.game_word_bank (category, display_value, normalized_value, minimum_difficulty)
values
  ('genre', 'Romance', 'ROMANCE', 'easy'),
  ('genre', 'Drama', 'DRAMA', 'easy'),
  ('genre', 'Fantasia', 'FANTASIA', 'easy'),
  ('genre', 'Suspense', 'SUSPENSE', 'easy'),
  ('genre', 'Mistério', 'MISTERIO', 'easy'),
  ('genre', 'Poesia', 'POESIA', 'easy'),
  ('genre', 'Distopia', 'DISTOPIA', 'medium'),
  ('genre', 'Contemporâneo', 'CONTEMPORANEO', 'medium'),
  ('trope', 'Rivais que se apaixonam', 'RIVAISQUESEAPAIXONAM', 'hard'),
  ('trope', 'Amigas para amantes', 'AMIGASPARAAMANTES', 'medium'),
  ('trope', 'Amor proibido', 'AMORPROIBIDO', 'medium'),
  ('trope', 'Segunda chance', 'SEGUNDACHANCE', 'easy'),
  ('trope', 'Namoro falso', 'NAMOROFALSO', 'easy'),
  ('trope', 'Slow burn', 'SLOWBURN', 'easy'),
  ('trope', 'Encontradas pelo destino', 'ENCONTRADASPELODESTINO', 'hard')
on conflict (category, normalized_value) do nothing;

-- Os três UUIDs fornecidos ficam autorizados; a flag global continua desligada.
insert into public.game_access_grants (user_id, game_key, is_active)
select id, 'word_search', true
from auth.users
where id in (
  'a2c66f5b-6cba-4984-a256-c189051e6630',
  '483f4e4b-20b0-4340-a1bb-4666acd54b32',
  'f8721040-035f-414a-8153-b5e12fec64d7'
)
on conflict (user_id, game_key) do update
set is_active = true, revoked_at = null, revoked_by = null, updated_at = now();

alter table public.game_settings enable row level security;
alter table public.game_access_grants enable row level security;
alter table public.game_word_bank enable row level security;
alter table public.word_search_sessions enable row level security;
alter table public.word_search_session_words enable row level security;
alter table public.daily_game_rewards enable row level security;

revoke all on table public.game_settings from public, anon, authenticated;
revoke all on table public.game_access_grants from public, anon, authenticated;
revoke all on table public.game_word_bank from public, anon, authenticated;
revoke all on table public.word_search_sessions from public, anon, authenticated;
revoke all on table public.word_search_session_words from public, anon, authenticated;
revoke all on table public.daily_game_rewards from public, anon, authenticated;
grant all on table public.game_settings, public.game_access_grants, public.game_word_bank,
  public.word_search_sessions, public.word_search_session_words, public.daily_game_rewards
  to service_role;

-- Recompensa atômica. Somente o backend service_role pode executar.
create or replace function public.claim_word_search_reward(
  p_user_id uuid,
  p_session_id uuid,
  p_random_bucket double precision default null,
  p_random_pick double precision default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_existing public.daily_game_rewards%rowtype;
  v_session public.word_search_sessions%rowtype;
  v_owned integer[];
  v_missing integer[];
  v_valid integer[];
  v_rare_candidates integer[] := array[28,45,47,79,112,164,167];
  v_candidates integer[];
  v_number integer;
  v_result text;
  v_is_rare boolean := false;
  v_rare_applied boolean := false;
  v_bucket double precision := coalesce(p_random_bucket, random());
  v_pick double precision := coalesce(p_random_pick, random());
  v_rare_probability double precision := 0.70;
  v_was_new boolean;
begin
  if p_user_id is null then raise exception 'Não autorizado.'; end if;
  if not exists (
    select 1 from public.game_settings
    where key = 'word_search_enabled' and value = 'true'::jsonb
  ) then raise exception 'Este recurso não está disponível no momento.'; end if;
  if not exists (
    select 1 from public.game_access_grants
    where user_id = p_user_id and game_key = 'word_search'
      and is_active and revoked_at is null
  ) then raise exception 'Este recurso não está disponível para sua conta no momento.'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':daily-games', 0));

  select * into v_existing from public.daily_game_rewards
  where user_id = p_user_id and reward_date = v_today;
  if found then
    return jsonb_build_object(
      'success', true, 'idempotent', true, 'number', v_existing.sticker_number,
      'wasNew', v_existing.result_type = 'new', 'isRare', v_existing.is_rare,
      'resultType', v_existing.result_type
    );
  end if;

  select * into v_session from public.word_search_sessions
  where id = p_session_id and user_id = p_user_id for update;
  if not found or v_session.status <> 'won' or v_session.found_words <> v_session.total_words then
    raise exception 'Vença a partida antes de resgatar a recompensa.';
  end if;

  select coalesce(array_agg(number order by number), '{}')
    into v_valid from public.stickers where number between 21 and 193;
  if cardinality(v_valid) = 0 then raise exception 'Catálogo de recompensas indisponível.'; end if;

  select coalesce(array_agg(n order by n), '{}') into v_owned
  from unnest(v_valid) n
  where exists (
    select 1 from public.user_stickers us
    where us.user_id = p_user_id and us.sticker_number = n and us.copies > 0
  );
  select coalesce(array_agg(n order by n), '{}') into v_missing
  from unnest(v_valid) n where not (n = any(v_owned));

  if cardinality(v_missing) > 0 then
    if cardinality(v_owned) = 0 or v_bucket < 0.60 then
      v_candidates := v_missing; v_result := 'new';
    else
      v_candidates := v_owned; v_result := 'duplicate';
    end if;
  else
    v_result := 'completed_collection_bonus';
    select coalesce((value #>> '{}')::double precision, 0.70)
      into v_rare_probability from public.game_settings
      where key = 'completed_collection_rare_probability';
    v_rare_candidates := array(
      select n from unnest(v_rare_candidates) n where n = any(v_valid)
    );
    if cardinality(v_rare_candidates) > 0 and v_bucket < v_rare_probability then
      v_candidates := v_rare_candidates;
      v_is_rare := true;
      v_rare_applied := true;
    else
      v_candidates := v_valid;
    end if;
  end if;

  v_number := v_candidates[
    least(cardinality(v_candidates), floor(greatest(0, least(v_pick, 0.999999999)) * cardinality(v_candidates))::integer + 1)
  ];
  v_was_new := not exists (
    select 1 from public.user_stickers
    where user_id = p_user_id and sticker_number = v_number and copies > 0
  );

  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (p_user_id, v_number, 1, v_is_rare, now())
  on conflict (user_id, sticker_number) do update
  set copies = public.user_stickers.copies + 1,
      is_rare = public.user_stickers.is_rare or excluded.is_rare;

  insert into public.daily_game_rewards (
    user_id, reward_date, game_key, session_id, sticker_number, result_type,
    is_rare, rare_bonus_applied, missing_pool_size, owned_pool_size
  ) values (
    p_user_id, v_today, 'word_search', p_session_id, v_number, v_result,
    v_is_rare, v_rare_applied, cardinality(v_missing), cardinality(v_owned)
  );

  update public.word_search_sessions
  set status = 'claimed', claimed_at = now(), updated_at = now()
  where id = p_session_id;

  perform public.check_and_grant_rewards(p_user_id);

  return jsonb_build_object(
    'success', true, 'idempotent', false, 'number', v_number,
    'wasNew', v_was_new, 'isRare', v_is_rare, 'resultType', v_result
  );
exception when unique_violation then
  select * into v_existing from public.daily_game_rewards
  where user_id = p_user_id and reward_date = v_today;
  if found then
    return jsonb_build_object(
      'success', true, 'idempotent', true, 'number', v_existing.sticker_number,
      'wasNew', v_existing.result_type = 'new', 'isRare', v_existing.is_rare,
      'resultType', v_existing.result_type
    );
  end if;
  raise;
end;
$$;

revoke all on function public.claim_word_search_reward(uuid, uuid, double precision, double precision)
  from public, anon, authenticated;
grant execute on function public.claim_word_search_reward(uuid, uuid, double precision, double precision)
  to service_role;

notify pgrst, 'reload schema';
commit;
