-- Execute after applying 20260728000300_word_search_game.sql.
begin;

do $$
begin
  if position(
    'v_word.display_word' in
    pg_get_functiondef('public.submit_word_search_match(uuid,uuid,jsonb)'::regprocedure)
  ) = 0 then
    raise exception 'submit_word_search_match deve retornar display_word';
  end if;

  if position(
    'v_word.word' in
    pg_get_functiondef('public.submit_word_search_match(uuid,uuid,jsonb)'::regprocedure)
  ) > 0 then
    raise exception 'submit_word_search_match referencia o campo inexistente word';
  end if;

  if has_table_privilege('authenticated', 'public.game_access_grants', 'INSERT')
     or has_table_privilege('authenticated', 'public.game_access_grants', 'UPDATE')
     or has_table_privilege('authenticated', 'public.daily_game_rewards', 'INSERT')
     or has_table_privilege('authenticated', 'public.word_search_session_words', 'SELECT') then
    raise exception 'Word-search security privileges are too broad.';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.claim_word_search_reward(uuid,uuid,double precision,double precision)',
    'EXECUTE'
  ) then
    raise exception 'Authenticated clients can execute the private reward RPC.';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.submit_word_search_match(uuid,uuid,jsonb)',
    'EXECUTE'
  ) then
    raise exception 'Authenticated clients can execute the private progress RPC.';
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'daily_game_rewards'
      and indexdef ilike '%unique%' and indexdef ilike '%user_id%reward_date%'
  ) then
    raise exception 'Daily global reward uniqueness is missing.';
  end if;

  if not exists (
    select 1 from public.game_settings
    where key = 'word_search_enabled' and value = 'true'::jsonb
  ) then
    raise exception 'Feature flag must be enabled for the public release.';
  end if;
end
$$;

rollback;
