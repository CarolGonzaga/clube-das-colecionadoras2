-- Execute depois de 20260731000500_harden_memory_daily_cycle.sql em um banco de teste.
begin;

do $$
begin
  if (select count(*) from public.memory_game_stickers) <> 67 then
    raise exception 'O catalogo do jogo deve conter exatamente 67 cartas.';
  end if;
  if exists (
    select 1 from generate_series(361,427) expected
    where not exists (select 1 from public.memory_game_stickers card where card.id=expected)
  ) then raise exception 'O catalogo deve cobrir os IDs 361 a 427.'; end if;
  if exists(select 1 from public.memory_game_stickers where front_image_path is null or back_image_path is null)
  then raise exception 'Existem imagens ausentes no catalogo.'; end if;
  if has_table_privilege('authenticated','public.memory_game_cards','SELECT')
     or has_table_privilege('authenticated','public.memory_game_cards','INSERT')
     or has_table_privilege('authenticated','public.memory_game_cards','UPDATE')
     or has_table_privilege('authenticated','public.memory_game_sessions','UPDATE')
     or has_table_privilege('authenticated','public.daily_game_rewards','INSERT')
  then raise exception 'Os privilegios do Jogo da Memoria estao amplos demais.'; end if;
  if has_function_privilege('authenticated','public.start_memory_game(uuid,text,uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.compare_memory_cards(uuid,uuid,uuid,uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.claim_daily_game_reward(uuid,text,uuid,double precision,double precision)','EXECUTE')
  then raise exception 'Clientes autenticados podem executar RPCs privadas.'; end if;
  if not exists(select 1 from public.game_settings where key='memory_game_enabled' and value='false'::jsonb)
  then raise exception 'A feature flag deve nascer desligada.'; end if;
  if not exists (
    select 1 from pg_indexes where schemaname='public' and tablename='daily_game_rewards'
      and indexdef ilike '%unique%' and indexdef ilike '%user_id%reward_date%'
  ) then raise exception 'A unicidade da recompensa global diaria esta ausente.'; end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='memory_game_sessions'
      and column_name='completed_local_date' and data_type='date'
  ) then raise exception 'A data local de conclusao da partida esta ausente.'; end if;
  if not exists (
    select 1 from pg_proc
    where proname='start_memory_game'
      and prosrc ilike '%is_memory_game_tester%'
      and prosrc ilike '%daily_game_rewards%'
      and prosrc ilike '%completed_local_date%'
  ) then raise exception 'A trava rigida de acesso ou de uma partida diaria esta ausente.'; end if;
  if exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='daily_game_rewards'
      and constraint_type='FOREIGN KEY' and constraint_name='daily_game_rewards_session_id_fkey'
  ) then raise exception 'A recompensa continua acoplada a sessoes do Caca-Palavras.'; end if;
end $$;

rollback;
