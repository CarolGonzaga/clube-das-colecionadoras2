-- Persiste uma palavra encontrada em uma única chamada e devolve somente o delta.
begin;

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
    where user_id = p_user_id and reward_date = v_today
  ) then
    raise exception 'Voce ja venceu uma partida hoje.';
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
    return jsonb_build_object('matched', false);
  end if;

  update public.word_search_session_words
  set found_at = v_now
  where id = v_word.id and found_at is null;

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
    'foundWord', v_word.display_word,
    'foundWordId', v_word.id,
    'foundWords', v_found_words,
    'won', v_won
  );
end;
$$;

revoke all on function public.submit_word_search_match(uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_word_search_match(uuid, uuid, jsonb)
  to service_role;

notify pgrst, 'reload schema';
commit;
