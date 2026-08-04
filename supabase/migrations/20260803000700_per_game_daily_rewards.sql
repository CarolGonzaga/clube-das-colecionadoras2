begin;

-- Atualizar restricao para permitir 1 recompensa por dia PARA CADA JOGO (user_id, reward_date, game_key)
alter table public.daily_game_rewards
  drop constraint if exists daily_game_rewards_user_id_reward_date_key;

alter table public.daily_game_rewards
  drop constraint if exists daily_game_rewards_user_reward_game_key;

alter table public.daily_game_rewards
  add constraint daily_game_rewards_user_reward_game_key
  unique (user_id, reward_date, game_key);

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

-- Atualizar submit_word_search_match para verificar rewards apenas de 'word_search'
create or replace function public.submit_word_search_match(
  p_user_id uuid,
  p_session_id uuid,
  p_path jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_now timestamptz := now();
  v_session public.word_search_sessions%rowtype;
  v_word public.word_search_session_words%rowtype;
  v_reversed_path jsonb;
  v_found_words integer;
  v_won boolean;
begin
  if p_user_id is null or p_session_id is null or jsonb_typeof(p_path) <> 'array' then
    raise exception 'Selecao invalida.';
  end if;
  if not exists (
    select 1 from public.game_settings
    where key = 'word_search_enabled' and value = 'true'::jsonb
  ) or not exists (
    select 1 from public.game_access_grants
    where user_id = p_user_id and game_key = 'word_search'
      and is_active and revoked_at is null
  ) then
    raise exception 'Este recurso nao esta disponivel para sua conta no momento.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':daily-games', 0));
  select * into v_session
  from public.word_search_sessions
  where id = p_session_id and user_id = p_user_id
  for update;

  if not found or v_session.status <> 'in_progress' or v_session.local_date <> v_today then
    raise exception 'Esta partida expirou ou nao aceita novas palavras.';
  end if;
  if exists (
    select 1 from public.daily_game_rewards
    where user_id = p_user_id and reward_date = v_today and game_key = 'word_search'
  ) then
    raise exception 'Voce ja venceu uma partida deste jogo hoje.';
  end if;

  select coalesce(jsonb_agg(item.value order by item.ordinality desc), '[]'::jsonb)
  into v_reversed_path
  from jsonb_array_elements(p_path) with ordinality as item(value, ordinality);

  select * into v_word
  from public.word_search_session_words
  where session_id = p_session_id
    and found_at is null
    and (path = p_path or path = v_reversed_path)
  limit 1
  for update;

  if not found then
    return jsonb_build_object('matched', false, 'won', false, 'foundWords', v_session.found_words);
  end if;

  update public.word_search_session_words
  set found_at = v_now
  where id = v_word.id;

  select count(*) into v_found_words
  from public.word_search_session_words
  where session_id = p_session_id and found_at is not null;

  v_won := v_found_words = v_session.total_words;

  update public.word_search_sessions
  set found_words = v_found_words,
      status = case when v_won then 'won' else 'in_progress' end,
      won_at = case when v_won then v_now else won_at end,
      updated_at = v_now
  where id = p_session_id;

  return jsonb_build_object(
    'matched', true,
    'foundWordId', v_word.id,
    'foundWord', v_word.display_word,
    'foundWords', v_found_words,
    'won', v_won
  );
end;
$$;

-- Atualizar start_memory_game para verificar rewards apenas de 'memory_game'
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
  where user_id = p_user_id and local_date = v_today and status = 'in_progress'
  order by created_at desc limit 1;
  if found then return v_active; end if;

  if exists(select 1 from public.word_search_sessions where user_id = p_user_id and local_date = v_today and status = 'in_progress')
     or exists(select 1 from public.puzzle_game_sessions where user_id = p_user_id and local_date = v_today and status = 'in_progress') then
    raise exception 'Conclua a partida atual antes de iniciar outro jogo.';
  end if;
  if exists(select 1 from public.daily_game_rewards where user_id = p_user_id and reward_date = v_today and game_key = 'memory_game') then
    raise exception 'Voce ja venceu uma partida deste jogo hoje. Volte amanha para jogar novamente.';
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

-- Atualizar compare_memory_cards para verificar rewards apenas de 'memory_game'
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
  if exists(select 1 from public.daily_game_rewards where user_id = p_user_id and reward_date = v_today and game_key = 'memory_game') then
    raise exception 'Voce ja venceu uma partida deste jogo hoje. Volte amanha para jogar novamente.';
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
        updated_at = v_now
    where id = p_session_id;
  end if;

  return jsonb_build_object(
    'matched', v_match,
    'firstCard', jsonb_build_object('id', v_first.card_instance_id, 'pairKey', v_first.pair_key, 'sourceStickerId', v_first.source_sticker_id),
    'secondCard', jsonb_build_object('id', v_second.card_instance_id, 'pairKey', v_second.pair_key, 'sourceStickerId', v_second.source_sticker_id),
    'matchedPairs', case when v_match then v_count else v_session.matched_pairs end,
    'won', v_match and v_count = v_session.total_pairs
  );
end;
$$;

-- Atualizar claim_word_search_reward para filtrar daily_game_rewards por game_key='word_search'
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
  v_previous_was_rare boolean := false;
  v_bucket double precision := coalesce(p_random_bucket, random());
  v_pick double precision := coalesce(p_random_pick, random());
  v_rare_probability double precision := 0.70;
  v_was_new boolean;
begin
  if p_user_id is null then raise exception 'Nao autorizado.'; end if;
  if not exists (
    select 1 from public.game_settings
    where key = 'word_search_enabled' and value = 'true'::jsonb
  ) then raise exception 'Este recurso nao esta disponivel no momento.'; end if;
  if not exists (
    select 1 from public.game_access_grants
    where user_id = p_user_id and game_key = 'word_search'
      and is_active and revoked_at is null
  ) then raise exception 'Este recurso nao esta disponivel para sua conta no momento.'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':daily-games', 0));

  select * into v_existing from public.daily_game_rewards
  where user_id = p_user_id and reward_date = v_today and game_key = 'word_search';
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
    raise exception 'Venca a partida antes de resgatar a recompensa.';
  end if;

  select coalesce(array_agg(number), array[]::integer[])
  into v_valid from public.stickers
  where number between 21 and 193;

  select coalesce(array_agg(distinct sticker_number), array[]::integer[])
  into v_owned from public.user_stickers where user_id = p_user_id and copies > 0;

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
    p_user_id, v_today, 'word_search', v_session.id, v_number, v_result, v_is_rare,
    v_rare_applied, cardinality(v_missing), cardinality(v_owned)
  );

  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (p_user_id, v_number, 1, v_is_rare, now())
  on conflict (user_id, sticker_number) do update
  set copies = public.user_stickers.copies + 1, is_rare = public.user_stickers.is_rare or excluded.is_rare;

  update public.word_search_sessions
  set status = 'claimed', claimed_at = now(), updated_at = now()
  where id = v_session.id;

  perform public.check_and_grant_rewards(p_user_id);

  return jsonb_build_object(
    'success', true, 'idempotent', false, 'number', v_number,
    'wasNew', v_was_new, 'isRare', v_is_rare, 'resultType', v_result
  );
end $$;

-- Atualizar claim_daily_game_reward para filtrar daily_game_rewards por p_game_key
create or replace function public.claim_daily_game_reward(
  p_user_id uuid, p_game_key text, p_session_id uuid,
  p_random_bucket double precision default null, p_random_pick double precision default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_today date:=(now() at time zone 'America/Sao_Paulo')::date; v_existing public.daily_game_rewards%rowtype;
  v_valid integer[]; v_owned integer[]; v_missing integer[]; v_candidates integer[]; v_rares integer[]:=array[28,45,47,79,112,164,167];
  v_number integer; v_result text; v_is_rare boolean:=false; v_prev_rare boolean:=false;
  v_bucket double precision:=coalesce(p_random_bucket,random()); v_pick double precision:=coalesce(p_random_pick,random()); v_was_new boolean;
begin
  if p_game_key not in ('word_search','memory_game') then raise exception 'Jogo invalido.'; end if;
  if not exists(select 1 from public.game_settings where key=p_game_key||'_enabled' and value='true'::jsonb)
     or not exists(select 1 from public.game_access_grants where user_id=p_user_id and game_key=p_game_key and is_active and revoked_at is null)
  then raise exception 'Este recurso nao esta disponivel para sua conta no momento.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text||':daily-games',0));
  select * into v_existing from public.daily_game_rewards where user_id=p_user_id and reward_date=v_today and game_key=p_game_key;
  if found then return jsonb_build_object('success',true,'idempotent',true,'number',v_existing.sticker_number,'wasNew',v_existing.result_type='new','isRare',v_existing.is_rare,'resultType',v_existing.result_type); end if;
  if p_game_key='word_search' then
    if not exists(select 1 from public.word_search_sessions where id=p_session_id and user_id=p_user_id and status='won' and found_words=total_words for update)
    then raise exception 'Venca a partida antes de resgatar a recompensa.'; end if;
  else
    if not exists(select 1 from public.memory_game_sessions where id=p_session_id and user_id=p_user_id and status='won' and matched_pairs=total_pairs for update)
    then raise exception 'Venca a partida antes de resgatar a recompensa.'; end if;
  end if;
  select coalesce(array_agg(number order by number),'{}') into v_valid from public.stickers where number between 21 and 193;
  select coalesce(array_agg(n order by n),'{}') into v_owned from unnest(v_valid)n where exists(select 1 from public.user_stickers u where u.user_id=p_user_id and u.sticker_number=n and u.copies>0);
  select coalesce(array_agg(n order by n),'{}') into v_missing from unnest(v_valid)n where not(n=any(v_owned));
  select coalesce((select is_rare from public.daily_game_rewards where user_id=p_user_id order by reward_date desc,created_at desc limit 1),false) into v_prev_rare;

  if cardinality(v_missing)>0 then
    if not v_prev_rare and v_bucket<coalesce((select (value#>>'{}')::double precision from public.game_settings where key='completed_collection_rare_probability'),.70)
    then v_candidates:=array(select n from unnest(v_rares)n where n=any(v_valid)); v_is_rare:=cardinality(v_candidates)>0; end if;
    if cardinality(coalesce(v_candidates,'{}'))=0 then v_candidates:=array(select n from unnest(v_valid)n where not(n=any(v_rares))); v_is_rare:=false; end if;
  else
    v_candidates:=v_valid;
  end if;
  v_number:=v_candidates[least(cardinality(v_candidates),floor(greatest(0,least(v_pick,.999999999))*cardinality(v_candidates))::integer+1)];
  v_was_new:=not exists(select 1 from public.user_stickers where user_id=p_user_id and sticker_number=v_number and copies>0);
  v_result:=case when v_was_new then 'new' else 'duplicate' end;
  insert into public.user_stickers(user_id,sticker_number,copies,is_rare,first_unlocked_at) values(p_user_id,v_number,1,v_is_rare,now())
    on conflict(user_id,sticker_number) do update set copies=public.user_stickers.copies+1,is_rare=public.user_stickers.is_rare or excluded.is_rare;
  insert into public.daily_game_rewards(user_id,reward_date,game_key,session_id,sticker_number,result_type,is_rare,rare_bonus_applied,missing_pool_size,owned_pool_size)
    values(p_user_id,v_today,p_game_key,p_session_id,v_number,v_result,v_is_rare,v_is_rare,cardinality(v_missing),cardinality(v_owned));
  if p_game_key='word_search' then update public.word_search_sessions set status='claimed',claimed_at=now(),updated_at=now() where id=p_session_id;
  else update public.memory_game_sessions set status='claimed',claimed_at=now(),updated_at=now() where id=p_session_id; end if;
  perform public.check_and_grant_rewards(p_user_id);
  return jsonb_build_object('success',true,'idempotent',false,'number',v_number,'wasNew',v_was_new,'isRare',v_is_rare,'resultType',v_result);
end $$;

-- Atualizar claim_puzzle_game_reward para filtrar daily_game_rewards por game_key='puzzle_game'
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

  perform public.check_and_grant_rewards(p_user_id);

  return jsonb_build_object(
    'success', true, 'idempotent', false, 'number', v_number,
    'wasNew', v_was_new, 'isRare', v_is_rare, 'resultType', v_result
  );
end $$;

notify pgrst,'reload schema';
commit;
