-- Grant the poster independently of the acquisition path. Every sticker
-- source eventually writes to user_stickers, so the inventory is the single
-- reliable place to enforce completion of the basic album (1..193).

create or replace function public.grant_poster_after_inventory_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid := new.user_id;
  poster_granted boolean := false;
begin
  if new.sticker_number not between 1 and 193 or coalesce(new.copies, 0) <= 0 then
    return new;
  end if;

  if (
    select count(distinct us.sticker_number)
    from public.user_stickers us
    where us.user_id = target_user
      and us.sticker_number between 1 and 193
      and us.copies > 0
  ) <> 193 then
    return new;
  end if;

  insert into public.reward_grants (user_id, reward_key, granted_at)
  values (target_user, 'poster', now())
  on conflict (user_id, reward_key) do nothing
  returning true into poster_granted;

  if coalesce(poster_granted, false) then
    update public.profiles
    set reveals_queue = coalesce(reveals_queue, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'items', jsonb_build_array(jsonb_build_object(
          'slug', 'poster',
          'number', 0,
          'wasNew', true,
          'isRare', false,
          'repeat', false,
          'reward', 'poster'
        )),
        'title', 'Álbum Básico Completo!',
        'rewardMsg', 'Parabéns! Você completou o Álbum Básico, com todas as figurinhas de 1 a 193, e desbloqueou o Gerador de Pôster.'
      )
    )
    where id = target_user;
  end if;

  return new;
end;
$$;

drop trigger if exists user_stickers_grant_poster on public.user_stickers;
create trigger user_stickers_grant_poster
after insert or update of copies on public.user_stickers
for each row
execute function public.grant_poster_after_inventory_change();

-- Repair accounts that had already completed 1..193 through a path that did
-- not call check_and_grant_rewards. Only newly inserted grants get an alert.
with eligible as (
  select us.user_id
  from public.user_stickers us
  where us.sticker_number between 1 and 193
    and us.copies > 0
  group by us.user_id
  having count(distinct us.sticker_number) = 193
), newly_granted as (
  insert into public.reward_grants (user_id, reward_key, granted_at)
  select e.user_id, 'poster', now()
  from eligible e
  on conflict (user_id, reward_key) do nothing
  returning user_id
)
update public.profiles p
set reveals_queue = coalesce(p.reveals_queue, '[]'::jsonb) || jsonb_build_array(
  jsonb_build_object(
    'items', jsonb_build_array(jsonb_build_object(
      'slug', 'poster',
      'number', 0,
      'wasNew', true,
      'isRare', false,
      'repeat', false,
      'reward', 'poster'
    )),
    'title', 'Álbum Básico Completo!',
    'rewardMsg', 'Parabéns! Você completou o Álbum Básico, com todas as figurinhas de 1 a 193, e desbloqueou o Gerador de Pôster.'
  )
)
from newly_granted ng
where p.id = ng.user_id;

revoke all on function public.grant_poster_after_inventory_change()
from public, anon, authenticated;

notify pgrst, 'reload schema';
