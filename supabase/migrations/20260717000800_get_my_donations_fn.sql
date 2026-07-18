-- Add a security definer function to safely fetch a user's donations
-- (both sent and received) without relying on client-side RLS SELECT policies.
-- This bypasses RLS entirely via security definer, running as the function owner.

create or replace function public.get_my_donations()
returns table(
  code text,
  sticker_number integer,
  status text,
  created_at timestamptz,
  expires_at timestamptz,
  from_user uuid,
  to_user uuid,
  donor_nick text,
  receiver_nick text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Unauthorized';
  end if;

  return query
  select
    d.code,
    d.sticker_number,
    d.status,
    d.created_at,
    d.expires_at,
    d.from_user,
    d.to_user,
    p_from.nick as donor_nick,
    p_to.nick as receiver_nick
  from public.donations d
  left join public.profiles p_from on p_from.id = d.from_user
  left join public.profiles p_to on p_to.id = d.to_user
  where d.from_user = current_user_id
     or d.to_user = current_user_id
  order by d.created_at desc;
end;
$$;

grant execute on function public.get_my_donations() to authenticated;
