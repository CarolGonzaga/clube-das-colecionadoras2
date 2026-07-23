-- Guarantee the secret bonus independently of the acquisition path. Some
-- inventory writers (notably purchased packs) do not call
-- check_and_grant_rewards(), so completion must be enforced at the inventory.

create or replace function public.grant_bonus_360_after_inventory_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_granted boolean := false;
begin
  if new.sticker_number not between 1 and 359 or coalesce(new.copies, 0) <= 0 then
    return new;
  end if;

  if (
    select count(distinct us.sticker_number)
    from public.user_stickers us
    where us.user_id = new.user_id
      and us.sticker_number between 1 and 359
      and us.copies > 0
  ) <> 359 then
    return new;
  end if;

  insert into public.reward_grants (user_id, reward_key, granted_at)
  values (new.user_id, 'collection_1_359', now())
  on conflict (user_id, reward_key) do nothing
  returning true into v_granted;

  if not coalesce(v_granted, false) then
    -- Repair an inconsistent state where the grant exists but the sticker was
    -- removed or never inserted, without creating another reveal.
    insert into public.user_stickers
      (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    values (new.user_id, 360, 1, false, now())
    on conflict (user_id, sticker_number) do update set
      copies = greatest(public.user_stickers.copies, 1),
      is_rare = false;
    return new;
  end if;

  insert into public.user_stickers
    (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (new.user_id, 360, 1, false, now())
  on conflict (user_id, sticker_number) do update set
    copies = greatest(public.user_stickers.copies, 1),
    is_rare = false;

  update public.profiles
  set reveals_queue = coalesce(reveals_queue, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'items', jsonb_build_array(jsonb_build_object(
        'slug', 'extra',
        'number', 360,
        'wasNew', true,
        'isRare', false,
        'repeat', false,
        'reward', 'collection_1_359'
      )),
      'title', 'Álbum base completo!',
      'rewardMsg', 'Parabéns! Você completou as 359 figurinhas base e desbloqueou a figurinha bônus de agradecimento.'
    )
  ),
      updated_at = now()
  where id = new.user_id;

  return new;
end;
$$;

drop trigger if exists user_stickers_grant_bonus_360 on public.user_stickers;
create trigger user_stickers_grant_bonus_360
after insert or update of copies on public.user_stickers
for each row
execute function public.grant_bonus_360_after_inventory_change();

-- Backfill every account already at 359/359, including accounts where a grant
-- row exists but the actual bonus sticker is missing.
with eligible as (
  select us.user_id
  from public.user_stickers us
  where us.sticker_number between 1 and 359
    and us.copies > 0
  group by us.user_id
  having count(distinct us.sticker_number) = 359
), newly_granted as (
  insert into public.reward_grants (user_id, reward_key, granted_at)
  select e.user_id, 'collection_1_359', now()
  from eligible e
  on conflict (user_id, reward_key) do nothing
  returning user_id
), missing_bonus as (
  select e.user_id,
         not exists (
           select 1
           from public.user_stickers current_bonus
           where current_bonus.user_id = e.user_id
             and current_bonus.sticker_number = 360
             and current_bonus.copies > 0
         ) as was_missing
  from eligible e
), repaired as (
  insert into public.user_stickers
    (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  select mb.user_id, 360, 1, false, now()
  from missing_bonus mb
  where mb.was_missing
  on conflict (user_id, sticker_number) do update set
    copies = greatest(public.user_stickers.copies, 1),
    is_rare = false
  returning user_id
), reveal_users as (
  select r.user_id
  from repaired r
)
update public.profiles p
set reveals_queue = coalesce(p.reveals_queue, '[]'::jsonb) || jsonb_build_array(
  jsonb_build_object(
    'items', jsonb_build_array(jsonb_build_object(
      'slug', 'extra',
      'number', 360,
      'wasNew', true,
      'isRare', false,
      'repeat', false,
      'reward', 'collection_1_359'
    )),
    'title', 'Álbum base completo!',
    'rewardMsg', 'Parabéns! Você completou as 359 figurinhas base e desbloqueou a figurinha bônus de agradecimento.'
  )
),
    updated_at = now()
from reveal_users ru
where p.id = ru.user_id;

revoke all on function public.grant_bonus_360_after_inventory_change() from public, anon, authenticated;

notify pgrst, 'reload schema';
