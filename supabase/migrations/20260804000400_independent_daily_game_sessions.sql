-- Cada jogo possui uma recompensa e uma sessão diária independentes.
-- Uma partida pendente deve bloquear apenas uma nova partida do mesmo jogo.
begin;

create or replace function public.guard_daily_game_start()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_today date:=(now() at time zone 'America/Sao_Paulo')::date;
  v_game_key text:=case tg_table_name
    when 'word_search_sessions' then 'word_search'
    when 'memory_game_sessions' then 'memory_game'
    when 'puzzle_game_sessions' then 'puzzle_game'
    when 'cover_guesser_sessions' then 'cover_guesser' else null end;
begin
  if v_game_key is null then raise exception 'Jogo diario invalido.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text||':'||v_game_key,0));
  perform public.expire_stale_daily_game_sessions(new.user_id);
  if new.local_date<>v_today then raise exception 'A data da partida e invalida.'; end if;
  if exists(
    select 1 from public.daily_game_rewards
    where user_id=new.user_id and reward_date=v_today and game_key=v_game_key
  ) then raise exception 'Voce ja venceu uma partida deste jogo hoje.'; end if;
  if new.difficulty=any(public.daily_game_used_difficulties(new.user_id,v_game_key))
  then raise exception 'Complete os outros niveis antes de repetir esta dificuldade.'; end if;
  return new;
end $$;

create or replace function public.start_memory_game(
  p_user_id uuid,p_difficulty text,p_session_id uuid default gen_random_uuid()
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_pairs integer; v_today date:=(now() at time zone 'America/Sao_Paulo')::date; v_active uuid;
begin
  if p_user_id is null or p_difficulty not in ('easy','medium','hard')
  then raise exception 'Dados invalidos.'; end if;
  if not exists(select 1 from public.game_settings where key='memory_game_enabled' and value='true'::jsonb)
  then raise exception 'Este recurso nao esta disponivel no momento.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text||':memory_game',0));
  perform public.expire_stale_daily_game_sessions(p_user_id);
  select id into v_active from public.memory_game_sessions
  where user_id=p_user_id and local_date=v_today and status in ('in_progress','won')
  order by created_at desc limit 1;
  if found then return v_active; end if;
  if exists(select 1 from public.daily_game_rewards
    where user_id=p_user_id and reward_date=v_today and game_key='memory_game')
  then raise exception 'Voce ja venceu uma partida deste jogo hoje.'; end if;
  if p_difficulty=any(public.daily_game_used_difficulties(p_user_id,'memory_game'))
  then raise exception 'Complete os outros niveis antes de repetir esta dificuldade.'; end if;
  v_pairs:=case p_difficulty when 'easy' then 6 when 'medium' then 8 else 12 end;
  if (select count(*) from public.memory_game_stickers
      where is_active and 'memory_game'=any(allowed_game_keys))<v_pairs
  then raise exception 'Nao foi possivel preparar a partida agora.'; end if;
  insert into public.memory_game_sessions(id,user_id,local_date,difficulty,total_pairs)
  values(p_session_id,p_user_id,v_today,p_difficulty,v_pairs);
  with chosen as (
    select id,gen_random_uuid() pair_key from public.memory_game_stickers
    where is_active and 'memory_game'=any(allowed_game_keys) order by random() limit v_pairs
  ), doubled as (select id,pair_key from chosen cross join generate_series(1,2)),
  shuffled as (select id,pair_key,row_number() over(order by random())-1 pos from doubled)
  insert into public.memory_game_cards(session_id,source_sticker_id,pair_key,board_position)
  select p_session_id,id,pair_key,pos from shuffled;
  return p_session_id;
end $$;

revoke all on function public.guard_daily_game_start(),public.start_memory_game(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.start_memory_game(uuid,text,uuid) to service_role;

commit;
