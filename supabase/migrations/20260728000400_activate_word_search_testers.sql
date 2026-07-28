-- Ativa o teste fechado depois da validação do build e confirma os três UUIDs
-- fornecidos. A permissão continua individual: nenhuma outra conta ganha acesso.
begin;

do $$
declare
  missing_users uuid[];
begin
  select array_agg(candidate.user_id)
  into missing_users
  from (
    values
      ('a2c66f5b-6cba-4984-a256-c189051e6630'::uuid),
      ('483f4e4b-20b0-4340-a1bb-4666acd54b32'::uuid),
      ('f8721040-035f-414a-8153-b5e12fec64d7'::uuid)
  ) as candidate(user_id)
  where not exists (select 1 from auth.users where id = candidate.user_id);

  if cardinality(coalesce(missing_users, '{}'::uuid[])) > 0 then
    raise exception 'Contas de teste inexistentes: %', missing_users;
  end if;
end
$$;

insert into public.game_access_grants (
  user_id, game_key, is_active, granted_at, revoked_by, revoked_at, updated_at
)
values
  ('a2c66f5b-6cba-4984-a256-c189051e6630', 'word_search', true, now(), null, null, now()),
  ('483f4e4b-20b0-4340-a1bb-4666acd54b32', 'word_search', true, now(), null, null, now()),
  ('f8721040-035f-414a-8153-b5e12fec64d7', 'word_search', true, now(), null, null, now())
on conflict (user_id, game_key) do update
set is_active = true,
    granted_at = now(),
    revoked_by = null,
    revoked_at = null,
    updated_at = now();

insert into public.game_settings (key, value, description, updated_at)
values (
  'word_search_enabled',
  'true'::jsonb,
  'Desliga ou liga globalmente o Caça-Palavras Sáfico.',
  now()
)
on conflict (key) do update
set value = 'true'::jsonb,
    updated_at = now();

commit;
