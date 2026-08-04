-- Permitir 1 partida/recompensa por dia por jogo para cada usuario.
begin;

create or replace function public.guard_daily_game_start()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_game_key text := case tg_table_name
    when 'word_search_sessions' then 'word_search'
    when 'memory_game_sessions' then 'memory_game'
    when 'puzzle_game_sessions' then 'puzzle_game'
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

  -- Bloquear se tiver outra partida ativa EM ANDAMENTO (in_progress) em outro jogo
  if (v_game_key <> 'word_search' and exists(select 1 from public.word_search_sessions where user_id=new.user_id and local_date=v_today and status='in_progress'))
    or (v_game_key <> 'memory_game' and exists(select 1 from public.memory_game_sessions where user_id=new.user_id and local_date=v_today and status='in_progress'))
    or (v_game_key <> 'puzzle_game' and exists(select 1 from public.puzzle_game_sessions where user_id=new.user_id and local_date=v_today and status='in_progress'))
  then raise exception 'Conclua a partida atual antes de iniciar outro jogo.'; end if;

  v_used:=public.daily_game_used_difficulties(new.user_id,v_game_key);
  if new.difficulty=any(v_used) then raise exception 'Complete os outros niveis antes de repetir esta dificuldade.'; end if;
  return new;
end $$;

create or replace function public.guard_daily_game_win()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_game_key text := case tg_table_name
    when 'word_search_sessions' then 'word_search'
    when 'memory_game_sessions' then 'memory_game'
    when 'puzzle_game_sessions' then 'puzzle_game'
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

-- Atualiza claim_puzzle_game_reward para filtrar daily_game_rewards por game_key='puzzle_game'
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
  where user_id = p_user_id and reward_date = v_today and game_key = 'puzzle_game';
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

  select coalesce(array_agg(distinct sticker_number), array[]::integer[])
  into v_owned from public.user_stickers where user_id = p_user_id;

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

  insert into public.daily_game_rewards (
    user_id, reward_date, game_key, session_id, sticker_number, result_type, is_rare,
    rare_bonus_applied, missing_pool_size, owned_pool_size
  ) values (
    p_user_id, v_today, 'puzzle_game', v_session.id, v_number, v_result, v_is_rare,
    v_rare_applied, cardinality(v_missing), cardinality(v_owned)
  );

  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (p_user_id, v_number, 1, v_is_rare, now())
  on conflict (user_id, sticker_number) do update
  set copies = public.user_stickers.copies + 1, is_rare = public.user_stickers.is_rare or excluded.is_rare;

  update public.puzzle_game_sessions
  set status = 'claimed', updated_at = now()
  where id = v_session.id;

  return jsonb_build_object(
    'success', true, 'idempotent', false, 'number', v_number,
    'wasNew', v_was_new, 'isRare', v_is_rare, 'resultType', v_result
  );
end $$;

notify pgrst,'reload schema';
commit;
