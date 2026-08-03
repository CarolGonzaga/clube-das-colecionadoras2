-- Reset para permitir teste do Quebra-Cabeca nas tres contas de teste em 03/08/2026.
begin;

update public.word_search_sessions
set status = 'abandoned',
    abandoned_at = now(),
    updated_at = now()
where user_id in (
    'a2c66f5b-6cba-4984-a256-c189051e6630'::uuid,
    '483f4e4b-20b0-4340-a1bb-4666acd54b32'::uuid,
    'f8721040-035f-414a-8153-b5e12fec64d7'::uuid
  )
  and local_date = date '2026-08-03'
  and status in ('in_progress', 'won', 'claimed');

update public.memory_game_sessions
set status = 'abandoned',
    abandoned_at = now(),
    updated_at = now()
where user_id in (
    'a2c66f5b-6cba-4984-a256-c189051e6630'::uuid,
    '483f4e4b-20b0-4340-a1bb-4666acd54b32'::uuid,
    'f8721040-035f-414a-8153-b5e12fec64d7'::uuid
  )
  and local_date = date '2026-08-03'
  and status in ('in_progress', 'won', 'claimed');

update public.puzzle_game_sessions
set status = 'abandoned',
    abandoned_at = now(),
    updated_at = now()
where user_id in (
    'a2c66f5b-6cba-4984-a256-c189051e6630'::uuid,
    '483f4e4b-20b0-4340-a1bb-4666acd54b32'::uuid,
    'f8721040-035f-414a-8153-b5e12fec64d7'::uuid
  )
  and local_date = date '2026-08-03'
  and status in ('in_progress', 'won', 'claimed');

delete from public.daily_game_rewards
where user_id in (
    'a2c66f5b-6cba-4984-a256-c189051e6630'::uuid,
    '483f4e4b-20b0-4340-a1bb-4666acd54b32'::uuid,
    'f8721040-035f-414a-8153-b5e12fec64d7'::uuid
  )
  and reward_date = date '2026-08-03';

commit;
