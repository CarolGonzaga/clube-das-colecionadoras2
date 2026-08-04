-- Jogo "Adivinhe a Capa": adivinhe o titulo do livro a partir da capa borrada.
-- Usa o mesmo catalogo da memory_game_stickers (IDs 361-427).
-- Feature flag nasce desligada. Apenas os 3 testers tem acesso inicial.
begin;

-- Sessoes do jogo
create table if not exists public.cover_guesser_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  sticker_id integer not null references public.memory_game_stickers(id),
  hints_allowed integer not null,
  hints_used integer not null default 0,
  status text not null default 'in_progress' check (status in ('in_progress', 'won', 'abandoned', 'claimed')),
  won_at timestamptz,
  abandoned_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cover_guesser_sessions_user_date_idx
  on public.cover_guesser_sessions(user_id, local_date desc, status);

-- Feature flag e configurações
insert into public.game_settings (key, value, description)
values
  ('cover_guesser_enabled', 'false'::jsonb, 'Habilita o jogo Adivinhe a Capa globalmente.')
on conflict (key) do nothing;

-- Acesso para os 3 testers (os mesmos dos outros jogos)
insert into public.game_access_grants (user_id, game_key, is_active)
select id, 'cover_guesser', true
from auth.users
where id in (
  'a2c66f5b-6cba-4984-a256-c189051e6630',
  '483f4e4b-20b0-4340-a1bb-4666acd54b32',
  'f8721040-035f-414a-8153-b5e12fec64d7'
)
on conflict (user_id, game_key) do update
set is_active = true, revoked_at = null, revoked_by = null, updated_at = now();

-- RLS
alter table public.cover_guesser_sessions enable row level security;
revoke all on table public.cover_guesser_sessions from public, anon, authenticated;
grant all on table public.cover_guesser_sessions to service_role;

-- RPC para resgatar recompensa
create or replace function public.claim_cover_guesser_reward(
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
  v_session public.cover_guesser_sessions%rowtype;
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
    where key = 'cover_guesser_enabled' and value = 'true'::jsonb
  ) then raise exception 'Este recurso nao esta disponivel no momento.'; end if;
  if not exists (
    select 1 from public.game_access_grants
    where user_id = p_user_id and game_key = 'cover_guesser'
      and is_active and revoked_at is null
  ) then raise exception 'Este recurso nao esta disponivel para sua conta no momento.'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':daily-games', 0));

  -- Idempotência: se já resgatou hoje neste jogo, retorna o existente
  select * into v_existing from public.daily_game_rewards
  where user_id = p_user_id and reward_date = v_today and game_key = 'cover_guesser';
  if found then
    return jsonb_build_object(
      'success', true, 'idempotent', true, 'number', v_existing.sticker_number,
      'wasNew', v_existing.result_type = 'new', 'isRare', v_existing.is_rare,
      'resultType', v_existing.result_type
    );
  end if;

  -- Valida sessão
  select * into v_session from public.cover_guesser_sessions
  where id = p_session_id and user_id = p_user_id for update;
  if not found or v_session.status <> 'won' then
    raise exception 'Venca a partida antes de resgatar a recompensa.';
  end if;

  -- Pool de figurinhas
  select coalesce(array_agg(distinct sticker_number), array[]::integer[])
  into v_owned from public.user_stickers where user_id = p_user_id and copies > 0;

  select coalesce(array_agg(number), array[]::integer[])
  into v_valid from public.stickers
  where number between 21 and 193;

  select coalesce(array_agg(number), array[]::integer[])
  into v_missing from unnest(v_valid) number
  where not (number = any(v_owned));

  select coalesce((
    select is_rare from public.daily_game_rewards
    where user_id = p_user_id order by reward_date desc, created_at desc limit 1
  ), false) into v_previous_was_rare;

  -- Sorteio
  if cardinality(v_missing) > 0 then
    if not v_previous_was_rare and v_bucket < v_rare_probability then
      select coalesce(array_agg(number), array[]::integer[])
      into v_candidates from unnest(v_missing) number
      where number = any(v_rare_candidates);
      if cardinality(v_candidates) > 0 then
        v_is_rare := true;
        v_rare_applied := true;
      end if;
    end if;
    if not v_rare_applied then
      v_candidates := v_missing;
    end if;
  else
    v_candidates := v_valid;
  end if;

  v_number := v_candidates[1 + floor(v_pick * cardinality(v_candidates))::integer];
  if v_number is null then
    v_number := v_valid[1 + floor(v_pick * cardinality(v_valid))::integer];
  end if;

  select not (v_number = any(v_owned)) into v_was_new;
  v_result := case when v_was_new then 'new' else 'duplicate' end;

  -- Grava recompensa
  insert into public.daily_game_rewards (
    user_id, reward_date, game_key, session_id, sticker_number, result_type, is_rare,
    rare_bonus_applied, missing_pool_size, owned_pool_size
  ) values (
    p_user_id, v_today, 'cover_guesser', v_session.id, v_number, v_result, v_is_rare,
    v_rare_applied, cardinality(v_missing), cardinality(v_owned)
  );

  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (p_user_id, v_number, 1, v_is_rare, now())
  on conflict (user_id, sticker_number) do update
  set copies = public.user_stickers.copies + 1, is_rare = public.user_stickers.is_rare or excluded.is_rare;

  update public.cover_guesser_sessions
  set status = 'claimed', claimed_at = now(), updated_at = now()
  where id = v_session.id;

  perform public.check_and_grant_rewards(p_user_id);

  return jsonb_build_object(
    'success', true, 'idempotent', false, 'number', v_number,
    'wasNew', v_was_new, 'isRare', v_is_rare, 'resultType', v_result
  );
end $$;

revoke all on function public.claim_cover_guesser_reward(uuid, uuid, double precision, double precision)
  from public, anon, authenticated;
grant execute on function public.claim_cover_guesser_reward(uuid, uuid, double precision, double precision)
  to authenticated;

-- Atualizar expire_stale_daily_game_sessions para incluir cover_guesser_sessions
create or replace function public.expire_stale_daily_game_sessions(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  update public.word_search_sessions set status='abandoned', abandoned_at=now(), updated_at=now()
  where user_id=p_user_id and status in ('in_progress','won') and local_date<v_today;
  update public.memory_game_sessions set status='abandoned', abandoned_at=now(), updated_at=now()
  where user_id=p_user_id and status in ('in_progress','won') and local_date<v_today;
  update public.puzzle_game_sessions set status='abandoned', abandoned_at=now(), updated_at=now()
  where user_id=p_user_id and status in ('in_progress','won') and local_date<v_today;
  update public.cover_guesser_sessions set status='abandoned', abandoned_at=now(), updated_at=now()
  where user_id=p_user_id and status in ('in_progress','won') and local_date<v_today;
end $$;

-- Atualizar daily_game_used_difficulties para incluir cover_guesser
create or replace function public.daily_game_used_difficulties(p_user_id uuid, p_game_key text)
returns text[] language plpgsql security definer set search_path = public as $$
declare v_used text[] := array[]::text[]; v_difficulty text;
begin
  if p_game_key not in ('word_search','memory_game','puzzle_game','cover_guesser') then raise exception 'Jogo invalido.'; end if;
  for v_difficulty in
    select history.difficulty from (
      select reward.reward_date,reward.created_at,session.difficulty
      from public.daily_game_rewards reward join public.word_search_sessions session on session.id=reward.session_id
      where reward.user_id=p_user_id and reward.game_key='word_search' and p_game_key='word_search'
      union all
      select reward.reward_date,reward.created_at,session.difficulty
      from public.daily_game_rewards reward join public.memory_game_sessions session on session.id=reward.session_id
      where reward.user_id=p_user_id and reward.game_key='memory_game' and p_game_key='memory_game'
      union all
      select reward.reward_date,reward.created_at,session.difficulty
      from public.daily_game_rewards reward join public.puzzle_game_sessions session on session.id=reward.session_id
      where reward.user_id=p_user_id and reward.game_key='puzzle_game' and p_game_key='puzzle_game'
      union all
      select reward.reward_date,reward.created_at,session.difficulty
      from public.daily_game_rewards reward join public.cover_guesser_sessions session on session.id=reward.session_id
      where reward.user_id=p_user_id and reward.game_key='cover_guesser' and p_game_key='cover_guesser'
    ) history order by history.reward_date,history.created_at
  loop
    if not (v_difficulty=any(v_used)) then v_used:=array_append(v_used,v_difficulty); end if;
    if cardinality(v_used)=3 then v_used:=array[]::text[]; end if;
  end loop;
  return v_used;
end $$;

-- Atualizar guard_daily_game_start para incluir cover_guesser
create or replace function public.guard_daily_game_start()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_game_key text := case tg_table_name
    when 'word_search_sessions' then 'word_search'
    when 'memory_game_sessions' then 'memory_game'
    when 'puzzle_game_sessions' then 'puzzle_game'
    when 'cover_guesser_sessions' then 'cover_guesser'
    else null end;
  v_used text[];
begin
  if v_game_key is null then raise exception 'Jogo diario invalido.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text||':daily-games',0));
  perform public.expire_stale_daily_game_sessions(new.user_id);
  if new.local_date<>v_today then raise exception 'A data da partida e invalida.'; end if;

  -- Bloquear apenas se ja recebeu recompensa HOJE NESTE JOGO ESPECIFICO
  if exists(select 1 from public.daily_game_rewards where user_id=new.user_id and reward_date=v_today and game_key=v_game_key)
  then raise exception 'Voce ja venceu uma partida deste jogo hoje. Volte amanha para jogar novamente.'; end if;

  -- Bloquear se tiver outra partida ativa EM ANDAMENTO em outro jogo
  if (v_game_key <> 'word_search' and exists(select 1 from public.word_search_sessions where user_id=new.user_id and local_date=v_today and status='in_progress'))
    or (v_game_key <> 'memory_game' and exists(select 1 from public.memory_game_sessions where user_id=new.user_id and local_date=v_today and status='in_progress'))
    or (v_game_key <> 'puzzle_game' and exists(select 1 from public.puzzle_game_sessions where user_id=new.user_id and local_date=v_today and status='in_progress'))
    or (v_game_key <> 'cover_guesser' and exists(select 1 from public.cover_guesser_sessions where user_id=new.user_id and local_date=v_today and status='in_progress'))
  then raise exception 'Conclua a partida atual antes de iniciar outro jogo.'; end if;

  v_used:=public.daily_game_used_difficulties(new.user_id,v_game_key);
  if new.difficulty=any(v_used) then raise exception 'Complete os outros niveis antes de repetir esta dificuldade.'; end if;
  return new;
end $$;

-- Atualizar guard_daily_game_win para incluir cover_guesser
create or replace function public.guard_daily_game_win()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_game_key text := case tg_table_name
    when 'word_search_sessions' then 'word_search'
    when 'memory_game_sessions' then 'memory_game'
    when 'puzzle_game_sessions' then 'puzzle_game'
    when 'cover_guesser_sessions' then 'cover_guesser'
    else null end;
begin
  if old.status='in_progress' and new.status='won' then
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text||':daily-games',0));
    if new.local_date<>v_today then raise exception 'Esta partida expirou. Inicie uma nova partida.'; end if;
    if exists(select 1 from public.daily_game_rewards where user_id=new.user_id and reward_date=v_today and game_key=v_game_key)
    then raise exception 'Voce ja venceu uma partida deste jogo hoje. Volte amanha para jogar novamente.'; end if;
  end if;
  return new;
end $$;

-- Criar triggers para cover_guesser_sessions
drop trigger if exists cover_guesser_daily_start_guard on public.cover_guesser_sessions;
create trigger cover_guesser_daily_start_guard before insert on public.cover_guesser_sessions
for each row execute function public.guard_daily_game_start();
drop trigger if exists cover_guesser_daily_win_guard on public.cover_guesser_sessions;
create trigger cover_guesser_daily_win_guard before update of status on public.cover_guesser_sessions
for each row execute function public.guard_daily_game_win();

revoke all on function public.expire_stale_daily_game_sessions(uuid),public.daily_game_used_difficulties(uuid,text),
  public.guard_daily_game_start(),public.guard_daily_game_win() from public,anon,authenticated;
grant execute on function public.expire_stale_daily_game_sessions(uuid),public.daily_game_used_difficulties(uuid,text),
  public.guard_daily_game_start(),public.guard_daily_game_win() to service_role;

notify pgrst,'reload schema';
commit;
