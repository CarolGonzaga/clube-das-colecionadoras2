begin;

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
  if p_user_id is null then raise exception 'Não autorizado.'; end if;
  if not exists (
    select 1 from public.game_settings
    where key = 'word_search_enabled' and value = 'true'::jsonb
  ) then raise exception 'Este recurso não está disponível no momento.'; end if;
  if not exists (
    select 1 from public.game_access_grants
    where user_id = p_user_id and game_key = 'word_search'
      and is_active and revoked_at is null
  ) then raise exception 'Este recurso não está disponível para sua conta no momento.'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':daily-games', 0));

  select * into v_existing from public.daily_game_rewards
  where user_id = p_user_id and reward_date = v_today;
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
    raise exception 'Vença a partida antes de resgatar a recompensa.';
  end if;

  select coalesce(array_agg(number order by number), '{}')
    into v_valid from public.stickers where number between 21 and 193;
  if cardinality(v_valid) = 0 then raise exception 'Catálogo de recompensas indisponível.'; end if;

  select coalesce(array_agg(n order by n), '{}') into v_owned
  from unnest(v_valid) n
  where exists (
    select 1 from public.user_stickers us
    where us.user_id = p_user_id and us.sticker_number = n and us.copies > 0
  );
  select coalesce(array_agg(n order by n), '{}') into v_missing
  from unnest(v_valid) n where not (n = any(v_owned));

  select coalesce((
    select reward.is_rare
    from public.daily_game_rewards reward
    where reward.user_id = p_user_id and reward.game_key = 'word_search'
      and reward.reward_date < v_today
    order by reward.reward_date desc, reward.created_at desc
    limit 1
  ), false) into v_previous_was_rare;

  if cardinality(v_missing) > 0 then
    if cardinality(v_owned) = 0 or v_bucket < 0.60 then
      v_candidates := v_missing; v_result := 'new';
    else
      v_candidates := v_owned; v_result := 'duplicate';
    end if;
  else
    v_result := 'completed_collection_bonus';
    select coalesce((value #>> '{}')::double precision, 0.70)
      into v_rare_probability from public.game_settings
      where key = 'completed_collection_rare_probability';
    v_rare_candidates := array(
      select n from unnest(v_rare_candidates) n where n = any(v_valid)
    );
    if not v_previous_was_rare
      and cardinality(v_rare_candidates) > 0
      and v_bucket < v_rare_probability then
      v_candidates := v_rare_candidates;
      v_is_rare := true;
      v_rare_applied := true;
    else
      v_candidates := v_valid;
    end if;
  end if;

  v_number := v_candidates[
    least(
      cardinality(v_candidates),
      floor(greatest(0, least(v_pick, 0.999999999)) * cardinality(v_candidates))::integer + 1
    )
  ];
  v_was_new := not exists (
    select 1 from public.user_stickers
    where user_id = p_user_id and sticker_number = v_number and copies > 0
  );

  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (p_user_id, v_number, 1, v_is_rare, now())
  on conflict (user_id, sticker_number) do update
  set copies = public.user_stickers.copies + 1,
      is_rare = public.user_stickers.is_rare or excluded.is_rare;

  insert into public.daily_game_rewards (
    user_id, reward_date, game_key, session_id, sticker_number, result_type,
    is_rare, rare_bonus_applied, missing_pool_size, owned_pool_size
  ) values (
    p_user_id, v_today, 'word_search', p_session_id, v_number, v_result,
    v_is_rare, v_rare_applied, cardinality(v_missing), cardinality(v_owned)
  );

  update public.word_search_sessions
  set status = 'claimed', claimed_at = now(), updated_at = now()
  where id = p_session_id;

  perform public.check_and_grant_rewards(p_user_id);

  return jsonb_build_object(
    'success', true, 'idempotent', false, 'number', v_number,
    'wasNew', v_was_new, 'isRare', v_is_rare, 'resultType', v_result
  );
exception when unique_violation then
  select * into v_existing from public.daily_game_rewards
  where user_id = p_user_id and reward_date = v_today;
  if found then
    return jsonb_build_object(
      'success', true, 'idempotent', true, 'number', v_existing.sticker_number,
      'wasNew', v_existing.result_type = 'new', 'isRare', v_existing.is_rare,
      'resultType', v_existing.result_type
    );
  end if;
  raise;
end;
$$;

revoke all on function public.claim_word_search_reward(uuid, uuid, double precision, double precision)
  from public, anon, authenticated;
grant execute on function public.claim_word_search_reward(uuid, uuid, double precision, double precision)
  to service_role;

notify pgrst, 'reload schema';
commit;
