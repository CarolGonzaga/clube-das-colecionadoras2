-- Compatibility for databases where uuid-ossp is not available/enabled.
-- Some V2 shop tables/functions were created with uuid_generate_v4().
-- Supabase projects commonly provide gen_random_uuid() through pgcrypto, so
-- this shim keeps existing defaults and RPCs working without recreating orders.

create extension if not exists pgcrypto;

create or replace function public.uuid_generate_v4()
returns uuid
language sql
volatile
as $$
  select gen_random_uuid();
$$;

grant execute on function public.uuid_generate_v4() to anon, authenticated, service_role;
