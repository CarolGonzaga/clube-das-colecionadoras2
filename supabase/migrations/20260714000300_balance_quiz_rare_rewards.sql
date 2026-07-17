-- Keep quiz autograph rewards near 40%, while avoiding streaks that feel
-- unfair. Every four correct quiz rewards has one or two rares (5 to 10 in a
-- 20-sticker quiz run).
create table if not exists public.quiz_reward_rarities (
  user_id uuid references public.profiles(id) on delete cascade,
  sticker_number integer not null,
  is_rare boolean not null,
  reward_order integer not null,
  created_at timestamptz default now(),
  primary key (user_id, sticker_number)
);

alter table public.quiz_reward_rarities enable row level security;

drop policy if exists "Users can view own quiz reward rarities" on public.quiz_reward_rarities;
create policy "Users can view own quiz reward rarities"
on public.quiz_reward_rarities for select
using (auth.uid() = user_id);

-- Preserve the history already earned before this rule existed. It does not
-- change any collected sticker; it only makes subsequent rewards consistent.
insert into public.quiz_reward_rarities (user_id, sticker_number, is_rare, reward_order, created_at)
select user_id,
       sticker_number,
       is_rare,
       row_number() over (partition by user_id order by answered_at, sticker_number),
       answered_at
from (
  select distinct on (qa.user_id, qa.sticker_number)
         qa.user_id, qa.sticker_number, us.is_rare, qa.answered_at
  from public.quiz_answers qa
  join public.user_stickers us
    on us.user_id = qa.user_id and us.sticker_number = qa.sticker_number
  where qa.correct
  order by qa.user_id, qa.sticker_number, qa.answered_at
) historical_rewards
on conflict (user_id, sticker_number) do nothing;

create or replace function public.enforce_quiz_reward_rarity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  prior_rewards integer;
  group_start integer;
  rares_in_group integer;
  total_rares integer;
  assigned_rare boolean;
begin
  if new.copies <> 1
    or not exists (
      select 1 from public.quiz_answers qa
      where qa.user_id = new.user_id
        and qa.sticker_number = new.sticker_number
        and qa.correct
    )
    or exists (
      select 1 from public.quiz_reward_rarities qr
      where qr.user_id = new.user_id and qr.sticker_number = new.sticker_number
    ) then
    return new;
  end if;

  select count(*) into prior_rewards
  from public.quiz_reward_rarities
  where user_id = new.user_id;

  group_start := (prior_rewards / 4) * 4;
  select count(*) into rares_in_group
  from public.quiz_reward_rarities
  where user_id = new.user_id
    and reward_order > group_start
    and reward_order <= group_start + 4
    and is_rare;

  select count(*) into total_rares
  from public.quiz_reward_rarities
  where user_id = new.user_id and is_rare;

  if rares_in_group >= 2 or total_rares >= 10 then
    assigned_rare := false;
  elsif (prior_rewards % 4) = 3 and rares_in_group = 0 then
    assigned_rare := true;
  else
    assigned_rare := random() < 0.40;
  end if;

  new.is_rare := assigned_rare;
  insert into public.quiz_reward_rarities(user_id, sticker_number, is_rare, reward_order)
  values (new.user_id, new.sticker_number, assigned_rare, prior_rewards + 1);
  return new;
end;
$$;

drop trigger if exists user_stickers_enforce_quiz_rarity on public.user_stickers;
create trigger user_stickers_enforce_quiz_rarity
before insert on public.user_stickers
for each row execute function public.enforce_quiz_reward_rarity();
