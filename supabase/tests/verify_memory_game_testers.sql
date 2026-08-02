-- Execute depois de 20260731000500_harden_memory_daily_cycle.sql.
begin;

do $$
declare
  expected_users uuid[] := array[
    'a2c66f5b-6cba-4984-a256-c189051e6630'::uuid,
    '483f4e4b-20b0-4340-a1bb-4666acd54b32'::uuid,
    'f8721040-035f-414a-8153-b5e12fec64d7'::uuid
  ];
begin
  if not exists (
    select 1 from public.game_settings
    where key = 'memory_game_enabled' and value = 'true'::jsonb
  ) then raise exception 'A flag do Jogo da Memoria nao foi ativada.'; end if;

  if (
    select count(*) from public.game_access_grants
    where game_key = 'memory_game'
      and user_id = any(expected_users)
      and is_active
      and revoked_at is null
  ) <> 3 then raise exception 'Nem todas as contas de teste foram autorizadas.'; end if;

  if exists (
    select 1 from public.game_access_grants
    where game_key = 'memory_game'
      and user_id <> all(expected_users)
      and is_active
      and revoked_at is null
  ) then raise exception 'Uma conta fora do beta ainda possui acesso ao Jogo da Memoria.'; end if;

  if not public.is_memory_game_tester(expected_users[1])
     or not public.is_memory_game_tester(expected_users[2])
     or not public.is_memory_game_tester(expected_users[3])
     or public.is_memory_game_tester('00000000-0000-0000-0000-000000000001'::uuid)
  then raise exception 'A lista rigida de testadoras esta incorreta.'; end if;
end $$;

rollback;
