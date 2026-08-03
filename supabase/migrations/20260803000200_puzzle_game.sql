-- Quebra-Cabeça (Puzzle Game): tabelas isoladas, sessoes persistentes e recompensa global.
begin;

insert into public.game_settings (key, value, description)
values ('puzzle_game_enabled', 'true'::jsonb, 'Desliga ou liga globalmente o Quebra-Cabeca.')
on conflict (key) do update set value = 'true'::jsonb;

-- Garantir que as figurinhas do catalogo aceitam 'puzzle_game'
update public.memory_game_stickers
set allowed_game_keys = array_append(allowed_game_keys, 'puzzle_game')
where not ('puzzle_game' = any(allowed_game_keys));

create table if not exists public.puzzle_game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null default 'puzzle_game' check (game_key = 'puzzle_game'),
  local_date date not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  sticker_id integer not null references public.memory_game_stickers(id) on delete restrict,
  grid_rows integer not null check (grid_rows in (3, 4, 5)),
  grid_cols integer not null check (grid_cols in (3, 4, 5)),
  total_pieces integer not null,
  placed_pieces integer not null default 0,
  board_state jsonb not null default '[]'::jsonb,
  status text not null default 'in_progress' check (status in ('in_progress', 'won', 'claimed', 'abandoned')),
  started_at timestamptz not null default now(),
  won_at timestamptz,
  claimed_at timestamptz,
  abandoned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists puzzle_game_one_active_per_user
  on public.puzzle_game_sessions(user_id) where status in ('in_progress', 'won');
create index if not exists puzzle_game_sessions_user_date_idx
  on public.puzzle_game_sessions(user_id, local_date desc);

alter table public.puzzle_game_sessions enable row level security;
revoke all on table public.puzzle_game_sessions from public, anon, authenticated;
grant all on table public.puzzle_game_sessions to service_role;

create or replace function public.claim_puzzle_game_reward(
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
  v_session public.puzzle_game_sessions%rowtype;
  v_owned integer[];
  v_missing integer[];
  v_valid integer[];
  v_rare_candidates integer[] := array[28,45,47,79,112,164,167];
  v_candidates integer[];
  v_number integer;
  v_result text;
  v_is_rare boolean := false;
  v_rare_applied boolean := false;
  v_previous_was_rare boolean := false;
  v_bucket double precision := coalesce(p_random_bucket, random());
  v_pick double precision := coalesce(p_random_pick, random());
  v_rare_probability double precision := 0.70;
  v_was_new boolean;
begin
  if p_user_id is null then raise exception 'Nao autorizado.'; end if;
  if not exists (
    select 1 from public.game_settings
    where key = 'puzzle_game_enabled' and value = 'true'::jsonb
  ) then raise exception 'Este recurso nao esta disponivel no momento.'; end if;
  if not exists (
    select 1 from public.game_access_grants
    where user_id = p_user_id and game_key = 'puzzle_game'
      and is_active and revoked_at is null
  ) then raise exception 'Este recurso nao esta disponivel para sua conta no momento.'; end if;

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

  select * into v_session from public.puzzle_game_sessions
  where id = p_session_id and user_id = p_user_id for update;
  if not found or v_session.status <> 'won' or v_session.placed_pieces <> v_session.total_pieces then
    raise exception 'Venca a partida antes de resgatar a recompensa.';
  end if;

  select coalesce(array_agg(number order by number), '{}')
    into v_valid from public.stickers where number between 21 and 193;
  if cardinality(v_valid) = 0 then raise exception 'Catalogo de recompensas indisponivel.'; end if;

  select coalesce(array_agg(n order by n), '{}') into v_owned
  from unnest(v_valid) n
  where exists (
    select 1 from public.user_stickers us
    where us.user_id = p_user_id and us.sticker_number = n and us.copies > 0
  );
  select coalesce(array_agg(n order by n), '{}') into v_missing
  from unnest(v_valid) n where not (n = any(v_owned));

  select coalesce((
    select reward.is_rare
    from public.daily_game_rewards reward
    where reward.user_id = p_user_id
      and reward.reward_date < v_today
    order by reward.reward_date desc, reward.created_at desc
    limit 1
  ), false) into v_previous_was_rare;

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
    if not v_previous_was_rare
      and cardinality(v_rare_candidates) > 0
      and v_bucket < v_rare_probability then
      v_candidates := v_rare_candidates;
      v_is_rare := true;
      v_rare_applied := true;
    else
      v_candidates := v_valid;
    end if;
  end if;

  v_number := v_candidates[
    least(
      cardinality(v_candidates),
      floor(greatest(0, least(v_pick, 0.999999999)) * cardinality(v_candidates))::integer + 1
    )
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
    p_user_id, v_today, 'puzzle_game', p_session_id, v_number, v_result,
    v_is_rare, v_rare_applied, cardinality(v_missing), cardinality(v_owned)
  );

  update public.puzzle_game_sessions
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

revoke all on function public.claim_puzzle_game_reward(uuid, uuid, double precision, double precision)
  from public, anon, authenticated;
grant execute on function public.claim_puzzle_game_reward(uuid, uuid, double precision, double precision)
  to service_role;

notify pgrst, 'reload schema';
commit;
