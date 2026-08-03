-- Mantem a regra de uma partida/vitoria por dia autoritativa para todos os jogos atuais.
begin;

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
end $$;

create or replace function public.daily_game_used_difficulties(p_user_id uuid, p_game_key text)
returns text[] language plpgsql security definer set search_path = public as $$
declare v_used text[] := array[]::text[]; v_difficulty text;
begin
  if p_game_key not in ('word_search','memory_game','puzzle_game') then raise exception 'Jogo invalido.'; end if;
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
    ) history order by history.reward_date,history.created_at
  loop
    if not (v_difficulty=any(v_used)) then v_used:=array_append(v_used,v_difficulty); end if;
    if cardinality(v_used)=3 then v_used:=array[]::text[]; end if;
  end loop;
  return v_used;
end $$;

create or replace function public.guard_daily_game_start()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_game_key text := case tg_table_name when 'word_search_sessions' then 'word_search'
    when 'memory_game_sessions' then 'memory_game' when 'puzzle_game_sessions' then 'puzzle_game' else null end;
  v_used text[];
begin
  if v_game_key is null then raise exception 'Jogo diario invalido.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text||':daily-games',0));
  perform public.expire_stale_daily_game_sessions(new.user_id);
  if new.local_date<>v_today then raise exception 'A data da partida e invalida.'; end if;
  if exists(select 1 from public.daily_game_rewards where user_id=new.user_id and reward_date=v_today)
  then raise exception 'Voce ja venceu uma partida hoje. Volte amanha para jogar novamente.'; end if;
  if exists(select 1 from public.word_search_sessions where user_id=new.user_id and local_date=v_today and status in ('in_progress','won'))
    or exists(select 1 from public.memory_game_sessions where user_id=new.user_id and local_date=v_today and status in ('in_progress','won'))
    or exists(select 1 from public.puzzle_game_sessions where user_id=new.user_id and local_date=v_today and status in ('in_progress','won'))
  then raise exception 'Conclua a partida atual antes de iniciar outro jogo.'; end if;
  v_used:=public.daily_game_used_difficulties(new.user_id,v_game_key);
  if new.difficulty=any(v_used) then raise exception 'Complete os outros niveis antes de repetir esta dificuldade.'; end if;
  return new;
end $$;

create or replace function public.guard_daily_game_win()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if old.status='in_progress' and new.status='won' then
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text||':daily-games',0));
    if new.local_date<>v_today then raise exception 'Esta partida expirou. Inicie uma nova partida.'; end if;
    if exists(select 1 from public.daily_game_rewards where user_id=new.user_id and reward_date=v_today)
    then raise exception 'Voce ja venceu uma partida hoje. Volte amanha para jogar novamente.'; end if;
    if exists(select 1 from public.word_search_sessions where user_id=new.user_id and local_date=v_today and status in ('won','claimed') and (tg_table_name<>'word_search_sessions' or id<>new.id))
      or exists(select 1 from public.memory_game_sessions where user_id=new.user_id and local_date=v_today and status in ('won','claimed') and (tg_table_name<>'memory_game_sessions' or id<>new.id))
      or exists(select 1 from public.puzzle_game_sessions where user_id=new.user_id and local_date=v_today and status in ('won','claimed') and (tg_table_name<>'puzzle_game_sessions' or id<>new.id))
    then raise exception 'Voce ja venceu uma partida hoje. Volte amanha para jogar novamente.'; end if;
  end if;
  return new;
end $$;

drop trigger if exists puzzle_game_daily_start_guard on public.puzzle_game_sessions;
create trigger puzzle_game_daily_start_guard before insert on public.puzzle_game_sessions
for each row execute function public.guard_daily_game_start();
drop trigger if exists puzzle_game_daily_win_guard on public.puzzle_game_sessions;
create trigger puzzle_game_daily_win_guard before update of status on public.puzzle_game_sessions
for each row execute function public.guard_daily_game_win();

revoke all on function public.expire_stale_daily_game_sessions(uuid),public.daily_game_used_difficulties(uuid,text),
  public.guard_daily_game_start(),public.guard_daily_game_win() from public,anon,authenticated;
grant execute on function public.expire_stale_daily_game_sessions(uuid),public.daily_game_used_difficulties(uuid,text),
  public.guard_daily_game_start(),public.guard_daily_game_win() to service_role;
notify pgrst,'reload schema';
commit;
