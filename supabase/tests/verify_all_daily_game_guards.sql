-- Execute depois de 20260803000500_harden_all_daily_game_guards.sql.
begin;
do $$
begin
  if not exists(select 1 from pg_trigger where tgname='puzzle_game_daily_start_guard' and not tgisinternal)
     or not exists(select 1 from pg_trigger where tgname='puzzle_game_daily_win_guard' and not tgisinternal)
  then raise exception 'As travas do Quebra-Cabeca nao foram instaladas.'; end if;
  if not exists(select 1 from pg_proc where proname='guard_daily_game_start' and prosrc ilike '%puzzle_game_sessions%')
     or not exists(select 1 from pg_proc where proname='guard_daily_game_win' and prosrc ilike '%puzzle_game_sessions%')
     or not exists(select 1 from pg_proc where proname='expire_stale_daily_game_sessions' and prosrc ilike '%puzzle_game_sessions%')
  then raise exception 'A politica diaria nao cobre todos os jogos.'; end if;
  if has_function_privilege('authenticated','public.guard_daily_game_start()','EXECUTE')
     or has_function_privilege('authenticated','public.guard_daily_game_win()','EXECUTE')
  then raise exception 'Clientes autenticados podem executar as travas privadas.'; end if;
end $$;
rollback;
