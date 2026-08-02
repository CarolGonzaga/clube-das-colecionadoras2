-- Reassert the two completion rewards that can be missed when old users
-- crossed a threshold before the newer trigger existed.

insert into public.stickers
  (number, slug, name, author, ilustrator, type, category, cover_url, amazon_url)
values
  (360, 'extra', 'Agradecimentos', null, null, 'bonus', 'bonus', 'card story/extra.jpg', null)
on conflict (number) do update set
  slug = excluded.slug,
  name = excluded.name,
  author = excluded.author,
  ilustrator = excluded.ilustrator,
  type = excluded.type,
  category = excluded.category,
  cover_url = excluded.cover_url,
  amazon_url = excluded.amazon_url;

delete from public.redeem_pools where sticker_number = 360;

do $$
begin
  if to_regclass('public.shop_products') is not null then
    delete from public.shop_products where sticker_number = 360;
  end if;
end $$;

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

  insert into public.user_stickers
    (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (new.user_id, 360, 1, false, now())
  on conflict (user_id, sticker_number) do update set
    copies = greatest(public.user_stickers.copies, 1),
    is_rare = false;

  if coalesce(v_granted, false) then
    update public.profiles
    set reveals_queue = coalesce(reveals_queue, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'items', jsonb_build_array(jsonb_build_object(
          'slug', 'extra',
          'number', 360,
          'wasNew', true,
          'isRare', false,
          'repeat', false,
          'reward', 'collection_1_359',
          'rewardMessage', 'Parabens! Voce completou as 359 figurinhas base e desbloqueou a figurinha bonus de agradecimento.'
        )),
        'title', 'Album base completo!',
        'rewardMsg', 'Parabens! Voce completou as 359 figurinhas base e desbloqueou a figurinha bonus de agradecimento.'
      )
    )
    where id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists user_stickers_grant_bonus_360 on public.user_stickers;
create trigger user_stickers_grant_bonus_360
after insert or update of copies on public.user_stickers
for each row
execute function public.grant_bonus_360_after_inventory_change();

create or replace function public.grant_poster_after_inventory_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_granted boolean := false;
begin
  if new.sticker_number not between 1 and 193 or coalesce(new.copies, 0) <= 0 then
    return new;
  end if;

  if (
    select count(distinct us.sticker_number)
    from public.user_stickers us
    where us.user_id = new.user_id
      and us.sticker_number between 1 and 193
      and us.copies > 0
  ) <> 193 then
    return new;
  end if;

  insert into public.reward_grants (user_id, reward_key, granted_at)
  values (new.user_id, 'poster', now())
  on conflict (user_id, reward_key) do nothing
  returning true into v_granted;

  if coalesce(v_granted, false) then
    update public.profiles
    set reveals_queue = coalesce(reveals_queue, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'items', jsonb_build_array(jsonb_build_object(
          'slug', 'poster',
          'number', 0,
          'wasNew', true,
          'isRare', false,
          'repeat', false,
          'reward', 'poster',
          'rewardMessage', 'Parabens! Voce completou o Album Basico, com todas as figurinhas de 1 a 193, e desbloqueou o Gerador de Poster.'
        )),
        'title', 'Album Basico Completo!',
        'rewardMsg', 'Parabens! Voce completou o Album Basico, com todas as figurinhas de 1 a 193, e desbloqueou o Gerador de Poster.'
      )
    )
    where id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists user_stickers_grant_poster on public.user_stickers;
create trigger user_stickers_grant_poster
after insert or update of copies on public.user_stickers
for each row
execute function public.grant_poster_after_inventory_change();

with eligible_359 as (
  select us.user_id
  from public.user_stickers us
  where us.sticker_number between 1 and 359
    and us.copies > 0
  group by us.user_id
  having count(distinct us.sticker_number) = 359
), missing_360 as (
  select e.user_id
  from eligible_359 e
  where not exists (
    select 1
    from public.user_stickers us
    where us.user_id = e.user_id
      and us.sticker_number = 360
      and us.copies > 0
  )
), granted_360 as (
  insert into public.reward_grants (user_id, reward_key, granted_at)
  select user_id, 'collection_1_359', now()
  from missing_360
  on conflict (user_id, reward_key) do nothing
  returning user_id
), inserted_360 as (
  insert into public.user_stickers
    (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  select user_id, 360, 1, false, now()
  from missing_360
  on conflict (user_id, sticker_number) do update set
    copies = greatest(public.user_stickers.copies, 1),
    is_rare = false
  returning user_id
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
      'reward', 'collection_1_359',
      'rewardMessage', 'Parabens! Voce completou as 359 figurinhas base e desbloqueou a figurinha bonus de agradecimento.'
    )),
    'title', 'Album base completo!',
    'rewardMsg', 'Parabens! Voce completou as 359 figurinhas base e desbloqueou a figurinha bonus de agradecimento.'
  )
)
from inserted_360 i
where p.id = i.user_id
  and exists (select 1 from granted_360 g where g.user_id = i.user_id);

with eligible_193 as (
  select us.user_id
  from public.user_stickers us
  where us.sticker_number between 1 and 193
    and us.copies > 0
  group by us.user_id
  having count(distinct us.sticker_number) = 193
), granted_poster as (
  insert into public.reward_grants (user_id, reward_key, granted_at)
  select user_id, 'poster', now()
  from eligible_193
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
      'reward', 'poster',
      'rewardMessage', 'Parabens! Voce completou o Album Basico, com todas as figurinhas de 1 a 193, e desbloqueou o Gerador de Poster.'
    )),
    'title', 'Album Basico Completo!',
    'rewardMsg', 'Parabens! Voce completou o Album Basico, com todas as figurinhas de 1 a 193, e desbloqueou o Gerador de Poster.'
  )
)
from granted_poster gp
where p.id = gp.user_id;

revoke all on function public.grant_bonus_360_after_inventory_change()
from public, anon, authenticated;
revoke all on function public.grant_poster_after_inventory_change()
from public, anon, authenticated;

notify pgrst, 'reload schema';
