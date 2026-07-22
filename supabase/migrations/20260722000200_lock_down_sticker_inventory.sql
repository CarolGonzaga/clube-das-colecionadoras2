-- Make the album inventory read-only to browser clients.
-- Stickers must be awarded, exchanged or purchased through controlled RPCs.

begin;

lock table public.user_stickers in share row exclusive mode;

revoke insert, update, delete
on table public.user_stickers
from public, anon, authenticated;

drop policy if exists "Users manage own stickers" on public.user_stickers;
drop policy if exists "System/DB functions manage user stickers" on public.user_stickers;

-- Album screens and Realtime still need read access. Existing SELECT RLS
-- policies continue restricting which inventories each user may see.
grant select on table public.user_stickers to authenticated;

do $$
begin
  if has_table_privilege('authenticated', 'public.user_stickers', 'INSERT')
     or has_table_privilege('authenticated', 'public.user_stickers', 'UPDATE')
     or has_table_privilege('authenticated', 'public.user_stickers', 'DELETE') then
    raise exception 'Authenticated still has direct inventory write privileges; migration cancelled.';
  end if;

  if has_table_privilege('anon', 'public.user_stickers', 'INSERT')
     or has_table_privilege('anon', 'public.user_stickers', 'UPDATE')
     or has_table_privilege('anon', 'public.user_stickers', 'DELETE') then
    raise exception 'Anon still has direct inventory write privileges; migration cancelled.';
  end if;

  if not has_table_privilege('authenticated', 'public.user_stickers', 'SELECT') then
    raise exception 'Authenticated lost inventory read access; migration cancelled.';
  end if;
end;
$$;

commit;
