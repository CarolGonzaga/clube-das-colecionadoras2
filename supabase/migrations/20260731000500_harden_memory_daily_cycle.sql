-- Endurece o beta do Jogo da Memoria: somente tres testadoras, uma partida por dia,
-- nivel imutavel durante a partida e sessoes pendentes preservadas entre dias.
begin;

alter table public.memory_game_sessions
  add column if not exists completed_local_date date;

update public.memory_game_sessions
set completed_local_date = (coalesce(won_at, claimed_at) at time zone 'America/Sao_Paulo')::date
where completed_local_date is null
  and status in ('won', 'claimed')
  and coalesce(won_at, claimed_at) is not null;

-- Repara uma eventual sessao vencida antes desta trava quando o resgate global do dia ja existe.
update public.memory_game_sessions session
set status = 'claimed',
    claimed_at = coalesce(session.claimed_at, now()),
    completed_local_date = coalesce(
      session.completed_local_date,
      (coalesce(session.won_at, now()) at time zone 'America/Sao_Paulo')::date
    ),
    updated_at = now()
where session.status = 'won'
  and exists (
    select 1 from public.daily_game_rewards reward
    where reward.user_id = session.user_id
      and reward.reward_date = (now() at time zone 'America/Sao_Paulo')::date
  );

update public.game_access_grants
set is_active = false,
    revoked_at = coalesce(revoked_at, now()),
    updated_at = now()
where game_key = 'memory_game'
  and user_id not in (
    'a2c66f5b-6cba-4984-a256-c189051e6630'::uuid,
    '483f4e4b-20b0-4340-a1bb-4666acd54b32'::uuid,
    'f8721040-035f-414a-8153-b5e12fec64d7'::uuid
  );

create or replace function public.is_memory_game_tester(p_user_id uuid)
returns boolean
language sql
immutable
set search_path = public
as $$
  select p_user_id in (
    'a2c66f5b-6cba-4984-a256-c189051e6630'::uuid,
    '483f4e4b-20b0-4340-a1bb-4666acd54b32'::uuid,
    'f8721040-035f-414a-8153-b5e12fec64d7'::uuid
  )
$$;

create or replace function public.start_memory_game(
  p_user_id uuid, p_difficulty text, p_session_id uuid default gen_random_uuid()
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_pairs integer;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_active uuid;
begin
  if p_user_id is null or p_difficulty not in ('easy','medium','hard') then
    raise exception 'Dados invalidos.';
  end if;
  if not public.is_memory_game_tester(p_user_id)
     or not exists(select 1 from public.game_settings where key='memory_game_enabled' and value='true'::jsonb)
     or not exists(select 1 from public.game_access_grants where user_id=p_user_id and game_key='memory_game' and is_active and revoked_at is null)
  then
    raise exception 'Este recurso nao esta disponivel para sua conta no momento.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':memory-game', 0));

  -- Uma partida pendente nunca expira na virada do dia e conserva o nivel original.
  select id into v_active
  from public.memory_game_sessions
  where user_id=p_user_id and status in ('in_progress','won')
  order by created_at desc
  limit 1;
  if found then return v_active; end if;

  if exists(select 1 from public.daily_game_rewards where user_id=p_user_id and reward_date=v_today)
     or exists(
       select 1 from public.memory_game_sessions
       where user_id=p_user_id
         and (local_date=v_today or completed_local_date=v_today)
     )
  then
    raise exception 'Voce ja concluiu sua partida de hoje. Volte amanha para jogar novamente.';
  end if;

  v_pairs := case p_difficulty when 'easy' then 6 when 'medium' then 8 else 12 end;
  if (select count(*) from public.memory_game_stickers where is_active and 'memory_game'=any(allowed_game_keys)) < v_pairs then
    raise exception 'Nao foi possivel preparar a partida agora.';
  end if;

  insert into public.memory_game_sessions(id,user_id,local_date,difficulty,total_pairs)
  values(p_session_id,p_user_id,v_today,p_difficulty,v_pairs);

  with chosen as (
    select id, gen_random_uuid() pair_key from public.memory_game_stickers
    where is_active and 'memory_game'=any(allowed_game_keys) order by random() limit v_pairs
  ), doubled as (
    select id, pair_key from chosen cross join generate_series(1,2)
  ), shuffled as (
    select id, pair_key, row_number() over(order by random())-1 pos from doubled
  )
  insert into public.memory_game_cards(session_id,source_sticker_id,pair_key,board_position)
  select p_session_id,id,pair_key,pos from shuffled;

  return p_session_id;
end $$;

create or replace function public.compare_memory_cards(
  p_user_id uuid, p_session_id uuid, p_first_card uuid, p_second_card uuid
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_session public.memory_game_sessions%rowtype;
  v_first public.memory_game_cards%rowtype;
  v_second public.memory_game_cards%rowtype;
  v_match boolean;
  v_now timestamptz := now();
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_count integer;
  v_reward_already_claimed boolean;
begin
  if not public.is_memory_game_tester(p_user_id) then
    raise exception 'Este recurso nao esta disponivel para sua conta no momento.';
  end if;
  if p_first_card=p_second_card then raise exception 'Escolha duas cartas diferentes.'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_session_id::text || ':compare',0));
  select * into v_session from public.memory_game_sessions where id=p_session_id and user_id=p_user_id for update;
  if not found or v_session.status<>'in_progress' then raise exception 'Esta partida nao aceita novas jogadas.'; end if;

  select * into v_first from public.memory_game_cards where session_id=p_session_id and card_instance_id=p_first_card;
  if not found or v_first.matched_at is not null then raise exception 'Carta invalida.'; end if;
  select * into v_second from public.memory_game_cards where session_id=p_session_id and card_instance_id=p_second_card;
  if not found or v_second.matched_at is not null then raise exception 'Carta invalida.'; end if;

  v_match := v_first.pair_key=v_second.pair_key;
  if v_match then
    update public.memory_game_cards
    set matched_at=v_now
    where session_id=p_session_id and id in(v_first.id,v_second.id) and matched_at is null;

    select count(distinct pair_key) into v_count
    from public.memory_game_cards where session_id=p_session_id and matched_at is not null;

    if v_count=v_session.total_pairs then
      select exists(
        select 1 from public.daily_game_rewards where user_id=p_user_id and reward_date=v_today
      ) into v_reward_already_claimed;

      update public.memory_game_sessions
      set matched_pairs=v_count,
          status=case when v_reward_already_claimed then 'claimed' else 'won' end,
          won_at=v_now,
          claimed_at=case when v_reward_already_claimed then v_now else claimed_at end,
          completed_local_date=v_today,
          updated_at=v_now
      where id=p_session_id;
    else
      update public.memory_game_sessions
      set matched_pairs=v_count, updated_at=v_now
      where id=p_session_id;
    end if;
  else
    v_count:=v_session.matched_pairs;
  end if;

  return jsonb_build_object('matched',v_match,'matchedPairs',v_count,'won',v_match and v_count=v_session.total_pairs);
end $$;

revoke all on function public.is_memory_game_tester(uuid) from public, anon, authenticated;
grant execute on function public.is_memory_game_tester(uuid) to service_role;

notify pgrst, 'reload schema';
commit;
