-- Mantém o nome histórico, mas agora verifica a liberação pública dos jogos.
begin;
do $$
declare v_key text;
begin
  foreach v_key in array array[
    'word_search_enabled','memory_game_enabled','puzzle_game_enabled','cover_guesser_enabled'
  ] loop
    if not exists(select 1 from public.game_settings where key=v_key and value='true'::jsonb)
    then raise exception 'O jogo % nao foi liberado globalmente.',v_key; end if;
  end loop;
  if exists(select 1 from pg_proc where proname in ('start_memory_game','compare_memory_cards')
    and prosrc ilike '%is_memory_game_tester%')
  then raise exception 'A Memoria ainda esta limitada as contas de teste.'; end if;
end $$;
rollback;
