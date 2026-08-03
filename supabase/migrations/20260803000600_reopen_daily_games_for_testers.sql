-- Reabre os jogos no dia corrente somente para as tres contas do teste fechado.
-- As figurinhas ja concedidas permanecem no inventario; apenas a trava diaria e reiniciada.
begin;

do $$
declare
  v_test_users uuid[] := array[
    'a2c66f5b-6cba-4984-a256-c189051e6630'::uuid,
    '483f4e4b-20b0-4340-a1bb-4666acd54b32'::uuid,
    'f8721040-035f-414a-8153-b5e12fec64d7'::uuid
  ];
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_missing_users uuid[];
begin
  select array_agg(test_user)
  into v_missing_users
  from unnest(v_test_users) as users(test_user)
  where not exists (select 1 from auth.users where id = test_user);

  if cardinality(coalesce(v_missing_users, '{}'::uuid[])) > 0 then
    raise exception 'Contas de teste inexistentes: %', v_missing_users;
  end if;

  update public.word_search_sessions
  set status = 'abandoned', abandoned_at = now(), updated_at = now()
  where user_id = any(v_test_users) and local_date = v_today
    and status in ('in_progress', 'won', 'claimed');

  update public.memory_game_sessions
  set status = 'abandoned', abandoned_at = now(), updated_at = now()
  where user_id = any(v_test_users) and local_date = v_today
    and status in ('in_progress', 'won', 'claimed');

  update public.puzzle_game_sessions
  set status = 'abandoned', abandoned_at = now(), updated_at = now()
  where user_id = any(v_test_users) and local_date = v_today
    and status in ('in_progress', 'won', 'claimed');

  delete from public.daily_game_rewards
  where user_id = any(v_test_users) and reward_date = v_today;
end
$$;

insert into public.game_settings (key, value, description, updated_at)
values
  ('word_search_enabled', 'true'::jsonb, 'Desliga ou liga globalmente o Caca-Palavras Safico.', now()),
  ('memory_game_enabled', 'true'::jsonb, 'Desliga ou liga globalmente o Jogo da Memoria.', now()),
  ('puzzle_game_enabled', 'true'::jsonb, 'Desliga ou liga globalmente o Quebra-Cabeca.', now())
on conflict (key) do update
set value = 'true'::jsonb, updated_at = now();

insert into public.game_access_grants (
  user_id, game_key, is_active, granted_at, revoked_by, revoked_at, updated_at
)
select test_user, game_key, true, now(), null, null, now()
from unnest(array[
  'a2c66f5b-6cba-4984-a256-c189051e6630'::uuid,
  '483f4e4b-20b0-4340-a1bb-4666acd54b32'::uuid,
  'f8721040-035f-414a-8153-b5e12fec64d7'::uuid
]) as users(test_user)
cross join unnest(array['word_search', 'memory_game', 'puzzle_game']) as games(game_key)
on conflict (user_id, game_key) do update
set is_active = true,
    granted_at = now(),
    revoked_by = null,
    revoked_at = null,
    updated_at = now();

commit;
