-- Restore the administrative role catalogue in databases where the original
-- early role migration was never applied. No browser role may enumerate or
-- modify administrators.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'app_role'
  ) then
    create type public.app_role as enum ('admin', 'user');
  end if;
end
$$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create index if not exists user_roles_user_idx on public.user_roles(user_id);

alter table public.user_roles enable row level security;
revoke all on table public.user_roles from public, anon, authenticated;
grant all on table public.user_roles to service_role;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

revoke all on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to service_role;

insert into public.user_roles (user_id, role)
values
  ('a2c66f5b-6cba-4984-a256-c189051e6630', 'admin'),
  ('483f4e4b-20b0-4340-a1bb-4666acd54b32', 'admin')
on conflict (user_id, role) do nothing;

notify pgrst, 'reload schema';
