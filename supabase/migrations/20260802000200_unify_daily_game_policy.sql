-- Política única para jogos diários: uma sessão ativa e uma vitória por dia,
-- expiração na virada do dia e ciclo de dificuldade consumido somente no resgate.
begin;

create or replace function public.expire_stale_daily_game_sessions(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  update public.word_search_sessions
  set status = 'abandoned', abandoned_at = now(), updated_at = now()
  where user_id = p_user_id
    and status in ('in_progress', 'won')
    and local_date < v_today;

  update public.memory_game_sessions
  set status = 'abandoned', abandoned_at = now(), updated_at = now()
  where user_id = p_user_id
    and status in ('in_progress', 'won')
    and local_date < v_today;
end;
$$;

-- Repara estados legados: nenhum jogo pode continuar depois do resgate do dia.
update public.word_search_sessions session
set status = 'abandoned', abandoned_at = now(), updated_at = now()
where session.status in ('in_progress', 'won')
  and exists (
    select 1 from public.daily_game_rewards reward
    where reward.user_id = session.user_id and reward.reward_date = session.local_date
  );

update public.memory_game_sessions session
set status = 'abandoned', abandoned_at = now(), updated_at = now()
where session.status in ('in_progress', 'won')
  and exists (
    select 1 from public.daily_game_rewards reward
    where reward.user_id = session.user_id and reward.reward_date = session.local_date
  );

-- Se o estado antigo deixou dois jogos ativos no mesmo dia, conserva apenas o mais recente.
with ranked as (
  select active.game_key, active.id,
    row_number() over(partition by active.user_id, active.local_date order by active.created_at desc, active.id desc) as position
  from (
    select 'word_search'::text game_key, id, user_id, local_date, created_at
    from public.word_search_sessions where status in ('in_progress', 'won')
    union all
    select 'memory_game'::text game_key, id, user_id, local_date, created_at
    from public.memory_game_sessions where status in ('in_progress', 'won')
  ) active
)
update public.word_search_sessions session
set status = 'abandoned', abandoned_at = now(), updated_at = now()
from ranked
where ranked.game_key = 'word_search' and ranked.id = session.id and ranked.position > 1;

with ranked as (
  select active.game_key, active.id,
    row_number() over(partition by active.user_id, active.local_date order by active.created_at desc, active.id desc) as position
  from (
    select 'word_search'::text game_key, id, user_id, local_date, created_at
    from public.word_search_sessions where status in ('in_progress', 'won')
    union all
    select 'memory_game'::text game_key, id, user_id, local_date, created_at
    from public.memory_game_sessions where status in ('in_progress', 'won')
  ) active
)
update public.memory_game_sessions session
set status = 'abandoned', abandoned_at = now(), updated_at = now()
from ranked
where ranked.game_key = 'memory_game' and ranked.id = session.id and ranked.position > 1;

create or replace function public.daily_game_used_difficulties(
  p_user_id uuid,
  p_game_key text
) returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used text[] := array[]::text[];
  v_difficulty text;
begin
  if p_game_key not in ('word_search', 'memory_game') then
    raise exception 'Jogo invalido.';
  end if;

  for v_difficulty in
    select history.difficulty
    from (
      select reward.reward_date, reward.created_at, session.difficulty
      from public.daily_game_rewards reward
      join public.word_search_sessions session on session.id = reward.session_id
      where reward.user_id = p_user_id and reward.game_key = 'word_search'
        and p_game_key = 'word_search'
      union all
      select reward.reward_date, reward.created_at, session.difficulty
      from public.daily_game_rewards reward
      join public.memory_game_sessions session on session.id = reward.session_id
      where reward.user_id = p_user_id and reward.game_key = 'memory_game'
        and p_game_key = 'memory_game'
    ) history
    order by history.reward_date, history.created_at
  loop
    if not (v_difficulty = any(v_used)) then
      v_used := array_append(v_used, v_difficulty);
    end if;
    if cardinality(v_used) = 3 then
      v_used := array[]::text[];
    end if;
  end loop;
  return v_used;
end;
$$;

create or replace function public.guard_daily_game_start()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_game_key text := case when tg_table_name = 'word_search_sessions'
    then 'word_search' else 'memory_game' end;
  v_used text[];
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || ':daily-games', 0));
  perform public.expire_stale_daily_game_sessions(new.user_id);

  if new.local_date <> v_today then
    raise exception 'A data da partida e invalida.';
  end if;
  if exists (
    select 1 from public.daily_game_rewards
    where user_id = new.user_id and reward_date = v_today
  ) then
    raise exception 'Voce ja venceu uma partida hoje. Volte amanha para jogar novamente.';
  end if;
  if exists (
    select 1 from public.word_search_sessions
    where user_id = new.user_id and local_date = v_today and status in ('in_progress', 'won')
  ) or exists (
    select 1 from public.memory_game_sessions
    where user_id = new.user_id and local_date = v_today and status in ('in_progress', 'won')
  ) then
    raise exception 'Conclua a partida atual antes de iniciar outro jogo.';
  end if;

  v_used := public.daily_game_used_difficulties(new.user_id, v_game_key);
  if new.difficulty = any(v_used) then
    raise exception 'Complete os outros niveis antes de repetir esta dificuldade.';
  end if;
  return new;
end;
$$;

create or replace function public.guard_daily_game_win()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if old.status = 'in_progress' and new.status = 'won' then
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || ':daily-games', 0));
    if new.local_date <> v_today then
      raise exception 'Esta partida expirou. Inicie uma nova partida.';
    end if;
    if exists (
      select 1 from public.daily_game_rewards
      where user_id = new.user_id and reward_date = v_today
    ) then
      raise exception 'Voce ja venceu uma partida hoje. Volte amanha para jogar novamente.';
    end if;
    if exists (
      select 1 from public.word_search_sessions
      where user_id = new.user_id and local_date = v_today and status in ('won', 'claimed')
        and id <> new.id
    ) or exists (
      select 1 from public.memory_game_sessions
      where user_id = new.user_id and local_date = v_today and status in ('won', 'claimed')
        and id <> new.id
    ) then
      raise exception 'Voce ja venceu uma partida hoje. Volte amanha para jogar novamente.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists word_search_daily_start_guard on public.word_search_sessions;
create trigger word_search_daily_start_guard
before insert on public.word_search_sessions
for each row execute function public.guard_daily_game_start();

drop trigger if exists memory_game_daily_start_guard on public.memory_game_sessions;
create trigger memory_game_daily_start_guard
before insert on public.memory_game_sessions
for each row execute function public.guard_daily_game_start();

drop trigger if exists word_search_daily_win_guard on public.word_search_sessions;
create trigger word_search_daily_win_guard
before update of status on public.word_search_sessions
for each row execute function public.guard_daily_game_win();

drop trigger if exists memory_game_daily_win_guard on public.memory_game_sessions;
create trigger memory_game_daily_win_guard
before update of status on public.memory_game_sessions
for each row execute function public.guard_daily_game_win();

create or replace function public.start_memory_game(
  p_user_id uuid, p_difficulty text, p_session_id uuid default gen_random_uuid()
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pairs integer;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_active uuid;
begin
  if p_user_id is null or p_difficulty not in ('easy', 'medium', 'hard') then
    raise exception 'Dados invalidos.';
  end if;
  if not public.is_memory_game_tester(p_user_id)
     or not exists(select 1 from public.game_settings where key = 'memory_game_enabled' and value = 'true'::jsonb)
     or not exists(select 1 from public.game_access_grants where user_id = p_user_id and game_key = 'memory_game' and is_active and revoked_at is null)
  then
    raise exception 'Este recurso nao esta disponivel para sua conta no momento.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':daily-games', 0));
  perform public.expire_stale_daily_game_sessions(p_user_id);

  select id into v_active
  from public.memory_game_sessions
  where user_id = p_user_id and local_date = v_today and status in ('in_progress', 'won')
  order by created_at desc limit 1;
  if found then return v_active; end if;

  if exists(select 1 from public.word_search_sessions where user_id = p_user_id and local_date = v_today and status in ('in_progress', 'won')) then
    raise exception 'Conclua a partida atual antes de iniciar outro jogo.';
  end if;
  if exists(select 1 from public.daily_game_rewards where user_id = p_user_id and reward_date = v_today) then
    raise exception 'Voce ja venceu uma partida hoje. Volte amanha para jogar novamente.';
  end if;
  if p_difficulty = any(public.daily_game_used_difficulties(p_user_id, 'memory_game')) then
    raise exception 'Complete os outros niveis antes de repetir esta dificuldade.';
  end if;

  v_pairs := case p_difficulty when 'easy' then 6 when 'medium' then 8 else 12 end;
  if (select count(*) from public.memory_game_stickers where is_active and 'memory_game' = any(allowed_game_keys)) < v_pairs then
    raise exception 'Nao foi possivel preparar a partida agora.';
  end if;

  insert into public.memory_game_sessions(id, user_id, local_date, difficulty, total_pairs)
  values(p_session_id, p_user_id, v_today, p_difficulty, v_pairs);

  with chosen as (
    select id, gen_random_uuid() pair_key
    from public.memory_game_stickers
    where is_active and 'memory_game' = any(allowed_game_keys)
    order by random() limit v_pairs
  ), doubled as (
    select id, pair_key from chosen cross join generate_series(1, 2)
  ), shuffled as (
    select id, pair_key, row_number() over(order by random()) - 1 pos from doubled
  )
  insert into public.memory_game_cards(session_id, source_sticker_id, pair_key, board_position)
  select p_session_id, id, pair_key, pos from shuffled;
  return p_session_id;
end;
$$;

create or replace function public.compare_memory_cards(
  p_user_id uuid, p_session_id uuid, p_first_card uuid, p_second_card uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.memory_game_sessions%rowtype;
  v_first public.memory_game_cards%rowtype;
  v_second public.memory_game_cards%rowtype;
  v_match boolean;
  v_now timestamptz := now();
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_count integer;
begin
  if not public.is_memory_game_tester(p_user_id) then
    raise exception 'Este recurso nao esta disponivel para sua conta no momento.';
  end if;
  if p_first_card = p_second_card then raise exception 'Escolha duas cartas diferentes.'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':daily-games', 0));
  select * into v_session from public.memory_game_sessions
  where id = p_session_id and user_id = p_user_id for update;
  if not found or v_session.status <> 'in_progress' or v_session.local_date <> v_today then
    raise exception 'Esta partida expirou ou nao aceita novas jogadas.';
  end if;
  if exists(select 1 from public.daily_game_rewards where user_id = p_user_id and reward_date = v_today) then
    raise exception 'Voce ja venceu uma partida hoje. Volte amanha para jogar novamente.';
  end if;

  select * into v_first from public.memory_game_cards where session_id = p_session_id and card_instance_id = p_first_card;
  if not found or v_first.matched_at is not null then raise exception 'Carta invalida.'; end if;
  select * into v_second from public.memory_game_cards where session_id = p_session_id and card_instance_id = p_second_card;
  if not found or v_second.matched_at is not null then raise exception 'Carta invalida.'; end if;

  v_match := v_first.pair_key = v_second.pair_key;
  if v_match then
    update public.memory_game_cards set matched_at = v_now
    where session_id = p_session_id and id in (v_first.id, v_second.id) and matched_at is null;
    select count(distinct pair_key) into v_count
    from public.memory_game_cards where session_id = p_session_id and matched_at is not null;
    update public.memory_game_sessions
    set matched_pairs = v_count,
        status = case when v_count = total_pairs then 'won' else 'in_progress' end,
        won_at = case when v_count = total_pairs then v_now else won_at end,
        completed_local_date = case when v_count = total_pairs then v_today else completed_local_date end,
        updated_at = v_now
    where id = p_session_id;
  else
    v_count := v_session.matched_pairs;
  end if;
  return jsonb_build_object('matched', v_match, 'matchedPairs', v_count, 'won', v_match and v_count = v_session.total_pairs);
end;
$$;

revoke all on function public.expire_stale_daily_game_sessions(uuid),
  public.daily_game_used_difficulties(uuid, text), public.guard_daily_game_start(),
  public.guard_daily_game_win() from public, anon, authenticated;
grant execute on function public.expire_stale_daily_game_sessions(uuid),
  public.daily_game_used_difficulties(uuid, text), public.guard_daily_game_start(),
  public.guard_daily_game_win() to service_role;

notify pgrst, 'reload schema';
commit;
