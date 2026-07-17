-- Final quiz rarity rule: each four correct answers grants one to three rare
-- autographs, with an absolute ceiling of 12 rares in a 20-reward quiz run.
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

  if rares_in_group >= 3 or total_rares >= 12 then
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
