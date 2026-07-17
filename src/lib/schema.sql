-- CLUB OF COLLECTORS (CLUBE DAS COLECIONADORAS) - DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor.
--
-- IMPORTANT SETUP FOR CUSTOM AVATARS (SUPABASE STORAGE):
-- 1. In your Supabase Dashboard, go to "Storage".
-- 2. Create a new bucket named: avatars
-- 3. Set the bucket to "Public" (so anyone can view user avatar photos).
-- 4. In the policies page for the "avatars" bucket, add a policy:
--    - Name: "Allow authenticated uploads/upserts"
--    - Operations: INSERT, UPDATE (upsert)
--    - Allowed roles: authenticated
--    - Policy definition / expression: true (or check if user's ID matches filename)
-- 5. Add another policy:
--    - Name: "Allow public read"
--    - Operations: SELECT
--    - Allowed roles: public / anon / authenticated
--    - Policy definition / expression: true
--
-- ----------------------------------------------------------------

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- TABLES DEFINITION
-- ----------------------------------------------------------------

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nick text not null,
  avatar_url text,
  avatar_emoji text default '📷',
  mural_opt_in boolean default false,
  created_at timestamptz default now()
);

-- 1b. Stickers Table (Metadata of all collection items)
create table if not exists public.stickers (
  number integer primary key,
  slug text not null,
  name text not null,
  author text,
  type text not null,
  cover_url text,
  amazon_url text,
  created_at timestamptz default now()
);

-- 2. User Stickers Table
create table if not exists public.user_stickers (
  user_id uuid references public.profiles(id) on delete cascade,
  sticker_number integer not null,
  copies integer default 1,
  is_rare boolean default false,
  first_unlocked_at timestamptz default now(),
  primary key (user_id, sticker_number)
);

-- 3. Mission Completions Table
create table if not exists public.mission_completions (
  user_id uuid references public.profiles(id) on delete cascade,
  mission_id text not null,
  completed_at timestamptz default now(),
  primary key (user_id, mission_id)
);

-- 4. Daily Claims Table
create table if not exists public.daily_claims (
  user_id uuid references public.profiles(id) on delete cascade,
  day text not null, -- format 'YYYY-MM-DD'
  style_id text,
  claimed_at timestamptz default now(),
  primary key (user_id, day)
);

-- 5. User Styles Table
create table if not exists public.user_styles (
  user_id uuid references public.profiles(id) on delete cascade,
  style_id text not null,
  unlocked boolean default false,
  enabled boolean default false,
  unlocked_at timestamptz default now(),
  primary key (user_id, style_id)
);

-- 6. Donations Table
create table if not exists public.donations (
  code text primary key,
  sticker_number integer not null,
  from_user uuid references public.profiles(id) on delete cascade not null,
  to_user uuid references public.profiles(id) on delete set null,
  status text not null default 'active', -- 'active', 'used', 'expired'
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

-- 7. Quiz Questions Table (Secure storage of correct answers)
create table if not exists public.quiz_questions (
  sticker_number integer not null,
  q_index integer not null,
  text text not null,
  options text[] not null,
  correct_index integer not null,
  primary key (sticker_number, q_index)
);

-- 8. Quiz Answers Table (History of answered quizzes)
create table if not exists public.quiz_answers (
  user_id uuid references public.profiles(id) on delete cascade,
  sticker_number integer not null,
  q_index integer not null,
  chosen_index integer not null,
  correct boolean not null,
  answered_at timestamptz default now(),
  attempt_day date not null default ((now() at time zone 'America/Sao_Paulo')::date),
  primary key (user_id, sticker_number, q_index, attempt_day)
);

-- Server-authoritative deadlines for questions that a player has opened.
create table if not exists public.quiz_question_timers (
  user_id uuid references public.profiles(id) on delete cascade,
  sticker_number integer not null,
  q_index integer not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (user_id, sticker_number, q_index)
);

-- Stores the rare/common result assigned by the quiz, independently from
-- other ways of receiving a sticker. This lets the quiz enforce a fair spread.
create table if not exists public.quiz_reward_rarities (
  user_id uuid references public.profiles(id) on delete cascade,
  sticker_number integer not null,
  is_rare boolean not null,
  reward_order integer not null,
  created_at timestamptz default now(),
  primary key (user_id, sticker_number)
);

-- 9. Quiz Daily Attempts / Session Table
create table if not exists public.quiz_attempts (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  ultimo_dia_acesso text, -- format 'YYYY-MM-DD'
  tentativas_hoje_count integer default 0,
  dia_atual integer default 0,
  perguntas_pendentes integer[] default '{}'::integer[]
);

-- 9b. App Settings Table (Global config)
create table if not exists public.app_settings (
  key text primary key,
  value text
);

-- Initialize default release date
insert into public.app_settings (key, value) values ('release_date', '2026-07-02') on conflict (key) do nothing;

-- 10. Redeem Codes Table
create table if not exists public.redeem_codes (
  code text primary key,
  element text,
  active boolean default true,
  release_day integer not null default 1
);


-- 11. Redeem Pools Table
create table if not exists public.redeem_pools (
  code text references public.redeem_codes on delete cascade,
  sticker_number integer not null,
  primary key (code, sticker_number)
);

-- 12. Reward Grants Table (Progression achievements)
create table if not exists public.reward_grants (
  user_id uuid references public.profiles(id) on delete cascade,
  reward_key text not null, -- e.g. 'quiz5', 'quiz10', 'quiz15', 'quiz20', 'total30', 'total45', 'poster'
  granted_at timestamptz default now(),
  primary key (user_id, reward_key)
);

-- 13. Completed Tags Table (Tag families completed)
create table if not exists public.completed_tags (
  user_id uuid references public.profiles(id) on delete cascade,
  tag_name text not null,
  completed_at timestamptz default now(),
  primary key (user_id, tag_name)
);

-- ----------------------------------------------------------------
-- VIEWS DEFINITION
-- ----------------------------------------------------------------

-- Scoreboard / Mural view
create or replace view public.mural as
select
  p.id,
  p.nick,
  coalesce(p.avatar_url, p.avatar_emoji, '📷') as avatar,
  count(us.sticker_number) filter (where us.copies > 0) as count,
  round((count(us.sticker_number) filter (where us.copies > 0))::numeric / 100.0 * 100.0) as pct,
  p.created_at
from public.profiles p
left join public.user_stickers us on us.user_id = p.id
where p.mural_opt_in = true
group by p.id, p.nick, p.avatar_url, p.avatar_emoji, p.created_at;

-- ----------------------------------------------------------------
-- SECURITY & RLS POLICIES
-- ----------------------------------------------------------------

-- Enable Row Level Security
alter table public.stickers enable row level security;
alter table public.profiles enable row level security;
alter table public.user_stickers enable row level security;
alter table public.mission_completions enable row level security;
alter table public.daily_claims enable row level security;
alter table public.user_styles enable row level security;
alter table public.donations enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_question_timers enable row level security;
alter table public.quiz_reward_rarities enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.redeem_codes enable row level security;
alter table public.redeem_pools enable row level security;
alter table public.reward_grants enable row level security;
alter table public.completed_tags enable row level security;

-- Stickers Policies
drop policy if exists "Allow public read on stickers" on public.stickers;
create policy "Allow public read on stickers" on public.stickers for select using (true);

-- Profiles Policies
drop policy if exists "Allow public view of profiles" on public.profiles;
drop policy if exists "Allow users to update own profile" on public.profiles;
drop policy if exists "Allow users to insert own profile" on public.profiles;
create policy "Allow public view of profiles" on public.profiles for select using (true);
create policy "Allow users to update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Allow users to insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- User Stickers Policies
drop policy if exists "Allow users to view own stickers" on public.user_stickers;
drop policy if exists "System/DB functions manage user stickers" on public.user_stickers;
create policy "Allow users to view own stickers" on public.user_stickers for select using (auth.uid() = user_id);
create policy "System/DB functions manage user stickers" on public.user_stickers for all using (auth.uid() = user_id);

-- Mission Completions Policies
drop policy if exists "Allow users to view own mission completions" on public.mission_completions;
create policy "Allow users to view own mission completions" on public.mission_completions for select using (auth.uid() = user_id);

-- Daily Claims Policies
drop policy if exists "Allow users to view own daily claims" on public.daily_claims;
create policy "Allow users to view own daily claims" on public.daily_claims for select using (auth.uid() = user_id);

-- User Styles Policies
drop policy if exists "Allow users to view own styles" on public.user_styles;
drop policy if exists "Allow users to update own styles state" on public.user_styles;
drop policy if exists "Allow users to insert own styles" on public.user_styles;
create policy "Allow users to view own styles" on public.user_styles for select using (auth.uid() = user_id);
create policy "Allow users to update own styles state" on public.user_styles for update using (auth.uid() = user_id);
create policy "Allow users to insert own styles" on public.user_styles for insert with check (auth.uid() = user_id);

-- Donations Policies
drop policy if exists "Allow public read of active donations" on public.donations;
drop policy if exists "Allow creator to manage own donations" on public.donations;
create policy "Allow public read of active donations" on public.donations for select using (true);
create policy "Allow creator to manage own donations" on public.donations for all using (auth.uid() = from_user);

-- Quiz Answers Policies
drop policy if exists "Allow users to view own quiz answers" on public.quiz_answers;
create policy "Allow users to view own quiz answers" on public.quiz_answers for select using (auth.uid() = user_id);

drop policy if exists "Allow users to view own quiz timers" on public.quiz_question_timers;
create policy "Allow users to view own quiz timers" on public.quiz_question_timers for select using (auth.uid() = user_id);

-- Quiz Reward Rarities Policies
drop policy if exists "Allow users to view own quiz reward rarities" on public.quiz_reward_rarities;
create policy "Allow users to view own quiz reward rarities" on public.quiz_reward_rarities for select using (auth.uid() = user_id);

-- Quiz Attempts Policies
drop policy if exists "Allow users to view own quiz attempts" on public.quiz_attempts;
create policy "Allow users to view own quiz attempts" on public.quiz_attempts for select using (auth.uid() = user_id);

-- Reward Grants Policies
drop policy if exists "Allow users to view own reward grants" on public.reward_grants;
create policy "Allow users to view own reward grants" on public.reward_grants for select using (auth.uid() = user_id);

-- Completed Tags Policies
drop policy if exists "Allow users to view own completed tags" on public.completed_tags;
create policy "Allow users to view own completed tags" on public.completed_tags for select using (auth.uid() = user_id);

-- Static tables read policies: Only RPC functions (Security Definer) query them, 
-- but we can optionally allow read access. Let's block direct client reads to prevent sniffing.

-- ----------------------------------------------------------------
-- TRIGGER: INITIALIZE STYLES & PROFILE ON SIGNUP
-- ----------------------------------------------------------------

-- Trigger function to automatically create profile and styles when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Create profile
  insert into public.profiles (id, nick, avatar_emoji, mural_opt_in)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nick', 'Colecionadora'),
    '📷',
    false
  );

  -- Create initial styles (unlocked = false, enabled = false)
  insert into public.user_styles (user_id, style_id, unlocked, enabled) values
    (new.id, 'lilac', false, false),
    (new.id, 'avatar-neon-frame', false, false),
    (new.id, 'new-icon', false, false),
    (new.id, 'theme-dark', false, false),
    (new.id, 'story-layout', false, false);

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------
-- HELPER STORED FUNCTIONS (RPCs)
-- ----------------------------------------------------------------

-- Remove from a draw pool only the sticker numbers that already appeared twice
-- in the package currently being assembled. This preserves repeat odds while
-- preventing three or more identical stickers in the same five-sticker pack.
create or replace function public.pack_available_pool(
  pool_numbers integer[],
  package_numbers integer[]
)
returns integer[] as $$
  select coalesce(array_agg(candidate.sticker_number), '{}'::integer[])
  from unnest(pool_numbers) as candidate(sticker_number)
  where (
    select count(*)
    from unnest(coalesce(package_numbers, '{}'::integer[])) as drawn(sticker_number)
    where drawn.sticker_number = candidate.sticker_number
  ) < 2;
$$ language sql immutable set search_path = public;

revoke all on function public.pack_available_pool(integer[], integer[]) from public, anon, authenticated;

-- Sub-helper for tag rewards drawing
create or replace function public.check_and_grant_rewards(user_id_param uuid)
returns jsonb as $$
declare
  reveals jsonb := '[]'::jsonb;
  granted_in_loop boolean := true;
  total_count integer;
  was_new boolean;
  reward_item jsonb;
  target_number integer;
  package_numbers integer[];
  available_pool integer[];
begin
  while granted_in_loop loop
    granted_in_loop := false;

    -- Count total owned stickers
    select count(*) into total_count
    from public.user_stickers us
    where us.user_id = user_id_param and us.copies > 0;

    -- 1. Total 100 -> Poster Reward
    if total_count >= 100 and not exists (select 1 from public.reward_grants where user_id = user_id_param and reward_key = 'poster') then
      insert into public.reward_grants (user_id, reward_key) values (user_id_param, 'poster');
      granted_in_loop := true;

    -- 2. Baldaverso (1, 53, 54) -> Sticker 91
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Baldaverso')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 1 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 53 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 54 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'Baldaverso');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 91, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
      returning (copies = 1) into was_new;

      reveals := reveals || jsonb_build_object('slug', 'frases-1', 'number', 91, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Baldaverso');
      package_numbers := array[91];

      -- Add 4 random stickers for the pack
      for i in 1..4 loop
        available_pool := public.pack_available_pool(array(select generate_series(21, 100)), package_numbers);
        target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
        package_numbers := array_append(package_numbers, target_number);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        reveals := reveals || jsonb_build_object('slug', 'extra', 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Baldaverso');
      end loop;

      granted_in_loop := true;

    -- 3. Frutaverso (5, 59, 60) -> Sticker 92
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Frutaverso')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 5 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 59 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 60 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'Frutaverso');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 92, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
      returning (copies = 1) into was_new;

      reveals := reveals || jsonb_build_object('slug', 'frases-2', 'number', 92, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Frutaverso');
      package_numbers := array[92];

      -- Add 4 random stickers for the pack
      for i in 1..4 loop
        available_pool := public.pack_available_pool(array(select generate_series(21, 100)), package_numbers);
        target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
        package_numbers := array_append(package_numbers, target_number);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        reveals := reveals || jsonb_build_object('slug', 'extra', 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Frutaverso');
      end loop;

      granted_in_loop := true;

    -- 4. Bright Falls (22, 51, 52) -> Sticker 93
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Bright Falls')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 22 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 51 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 52 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'Bright Falls');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 93, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
      returning (copies = 1) into was_new;

      reveals := reveals || jsonb_build_object('slug', 'frases-3', 'number', 93, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Bright Falls');
      package_numbers := array[93];

      -- Add 4 random stickers for the pack
      for i in 1..4 loop
        available_pool := public.pack_available_pool(array(select generate_series(21, 100)), package_numbers);
        target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
        package_numbers := array_append(package_numbers, target_number);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        reveals := reveals || jsonb_build_object('slug', 'extra', 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Bright Falls');
      end loop;

      granted_in_loop := true;

    -- 5. HQ (84, 85, 87) -> Sticker 94
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'HQ')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 84 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 85 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 87 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'HQ');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 94, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
      returning (copies = 1) into was_new;

      reveals := reveals || jsonb_build_object('slug', 'frases-4', 'number', 94, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_HQ');
      package_numbers := array[94];

      -- Add 4 random stickers for the pack
      for i in 1..4 loop
        available_pool := public.pack_available_pool(array(select generate_series(21, 100)), package_numbers);
        target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
        package_numbers := array_append(package_numbers, target_number);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        reveals := reveals || jsonb_build_object('slug', 'extra', 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_HQ');
      end loop;

      granted_in_loop := true;

    -- 6. Opostos Co. (19, 73, 74) -> Sticker 95
    elsif not exists (select 1 from public.completed_tags where user_id = user_id_param and tag_name = 'Opostos Co.')
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 19 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 73 and copies > 0)
       and exists (select 1 from public.user_stickers where user_id = user_id_param and sticker_number = 74 and copies > 0) then
       
      insert into public.completed_tags (user_id, tag_name) values (user_id_param, 'Opostos Co.');
      
      insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
      values (user_id_param, 95, 1, false, now())
      on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
      returning (copies = 1) into was_new;

      reveals := reveals || jsonb_build_object('slug', 'frases-5', 'number', 95, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Opostos Co.');
      package_numbers := array[95];

      -- Add 4 random stickers for the pack
      for i in 1..4 loop
        available_pool := public.pack_available_pool(array(select generate_series(21, 100)), package_numbers);
        target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
        package_numbers := array_append(package_numbers, target_number);
        insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
        values (user_id_param, target_number, 1, false, now())
        on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
        returning (copies = 1) into was_new;
        reveals := reveals || jsonb_build_object('slug', 'extra', 'number', target_number, 'wasNew', was_new, 'isRare', false, 'repeat', not was_new, 'reward', 'tag_Opostos Co.');
      end loop;

      granted_in_loop := true;
    end if;

  end loop;

  return reveals;
end;
$$ language plpgsql security definer;


create or replace function public.get_quiz_questions_for_today()
returns jsonb as $$
declare
  user_id_param uuid;
  current_day text;
  attempt_row public.quiz_attempts%rowtype;
  new_dia_atual integer;
  erradas_ids integer[];
  novas_ids integer[];
  final_pool integer[];
  q_item jsonb;
  questions_list jsonb := '[]'::jsonb;
  temp_sticker_number integer;
  temp_slug text;
  temp_name text;
  temp_author text;
  temp_q_index integer;
  temp_text text;
  temp_options text[];
  temp_correct_index integer;
  temp_errors integer;
  temp_answered boolean;
  temp_correct boolean;
  temp_chosen_index integer;
  temp_hide_indices integer[];
  temp_correct_index_return integer;
  i integer;
  correct_count integer;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  -- Ensure profile exists (fallback auto-creation if trigger didn't run yet)
  if not exists (select 1 from public.profiles where id = user_id_param) then
    insert into public.profiles (id, nick, avatar_emoji, mural_opt_in)
    values (user_id_param, 'Colecionadora', '📷', false);
  end if;

  -- Get current local day date (America/Sao_Paulo timezone)
  current_day := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD');

  -- Get user attempts state
  select * into attempt_row from public.quiz_attempts where user_id = user_id_param;

  if not found then
    -- Generate initial pool of 4 stickers (shuffled randomly)
    -- Unowned quiz stickers
    select array_agg(sticker_number) into final_pool from (
      select number as sticker_number
      from (values 
        (1), (2), (3), (4), (5), (6), (7), (8), (9), (10),
        (11), (12), (13), (14), (15), (16), (17), (18), (19), (20)
      ) as all_q(number)
      where not exists (
        select 1 from public.user_stickers us where us.user_id = user_id_param and us.sticker_number = all_q.number and us.copies > 0
      )
      order by random() limit 4
    ) q;

    if final_pool is null then
      final_pool := '{}'::integer[];
    end if;

    insert into public.quiz_attempts (user_id, ultimo_dia_acesso, tentativas_hoje_count, dia_atual, perguntas_pendentes)
    values (user_id_param, current_day, 0, 1, final_pool)
    returning * into attempt_row;
    
  elsif attempt_row.ultimo_dia_acesso <> current_day then
    new_dia_atual := attempt_row.dia_atual + 1;
    
    -- Priority 1: incorrect answered stickers (erradas) that are not yet correct
    select array_agg(distinct sticker_number) into erradas_ids from (
      select qa.sticker_number
      from public.quiz_answers qa
      where qa.user_id = user_id_param 
        and qa.correct = false
        and not exists (
          select 1 from public.user_stickers us where us.user_id = user_id_param and us.sticker_number = qa.sticker_number and us.copies > 0
        )
      order by qa.sticker_number asc
    ) q;

    if erradas_ids is null then
      erradas_ids := '{}'::integer[];
    end if;

    -- Priority 2: new unanswered stickers (shuffled randomly)
    select array_agg(sticker_number) into novas_ids from (
      select number as sticker_number
      from (values 
        (1), (2), (3), (4), (5), (6), (7), (8), (9), (10),
        (11), (12), (13), (14), (15), (16), (17), (18), (19), (20)
      ) as all_q(number)
      where not exists (
        select 1 from public.user_stickers us where us.user_id = user_id_param and us.sticker_number = all_q.number and us.copies > 0
      )
      and not (all_q.number = any(erradas_ids))
      order by random()
    ) q;

    if novas_ids is null then
      novas_ids := '{}'::integer[];
    end if;

    -- Combine pools
    final_pool := (erradas_ids || novas_ids)[1:4];

    update public.quiz_attempts
    set ultimo_dia_acesso = current_day,
        tentativas_hoje_count = 0,
        dia_atual = new_dia_atual,
        perguntas_pendentes = final_pool
    where user_id = user_id_param
    returning * into attempt_row;
  end if;

  -- Build questions details
  if array_length(attempt_row.perguntas_pendentes, 1) > 0 then
    for i in 1 .. array_upper(attempt_row.perguntas_pendentes, 1) loop
      temp_sticker_number := attempt_row.perguntas_pendentes[i];
      
      -- Calculate current q_index based on dia_atual
      temp_q_index := (temp_sticker_number + attempt_row.dia_atual) % 2;

      -- Fetch question data
      select text, options, correct_index into temp_text, temp_options, temp_correct_index
      from public.quiz_questions
      where sticker_number = temp_sticker_number and q_index = temp_q_index;

      -- If question not seeded yet, fallback safely
      if temp_text is null then
        continue;
      end if;

      -- Shuffle answer options using a deterministic permutation per (user, sticker, day)
      -- This ensures the correct answer isn't always option A
      declare
        h integer;
        perm0 integer; perm1 integer; perm2 integer; perm3 integer;
        tmp_int integer;
        shuffled_options text[];
      begin
        -- Derive a hash-based seed for this user+sticker+day
        h := abs(hashtext(user_id_param::text || temp_sticker_number::text || current_day));

        -- Build an initial permutation [0,1,2,3]
        perm0 := 0; perm1 := 1; perm2 := 2; perm3 := 3;

        -- Simple deterministic shuffle using the hash bits
        -- Swap index 3 with (h % 4)
        case (h % 4)
          when 0 then tmp_int := perm0; perm0 := perm3; perm3 := tmp_int;
          when 1 then tmp_int := perm1; perm1 := perm3; perm3 := tmp_int;
          when 2 then tmp_int := perm2; perm2 := perm3; perm3 := tmp_int;
          else null;
        end case;
        h := h / 4;
        -- Swap index 2 with (h % 3)
        case (h % 3)
          when 0 then tmp_int := perm0; perm0 := perm2; perm2 := tmp_int;
          when 1 then tmp_int := perm1; perm1 := perm2; perm2 := tmp_int;
          else null;
        end case;
        h := h / 3;
        -- Swap index 1 with (h % 2)
        if (h % 2) = 0 then
          tmp_int := perm0; perm0 := perm1; perm1 := tmp_int;
        end if;

        -- Build shuffled options in new order
        shuffled_options := array[
          temp_options[perm0 + 1],
          temp_options[perm1 + 1],
          temp_options[perm2 + 1],
          temp_options[perm3 + 1]
        ];

        -- Find new position of the correct answer
        if perm0 = temp_correct_index then temp_correct_index := 0;
        elsif perm1 = temp_correct_index then temp_correct_index := 1;
        elsif perm2 = temp_correct_index then temp_correct_index := 2;
        else temp_correct_index := 3;
        end if;

        temp_options := shuffled_options;
      end;

      -- Get sticker info
      -- Mapping titles/slugs/authors dynamically matching seeds.ts
      select 
        case temp_sticker_number
          when 1 then 'Amor Fati' when 2 then 'Cupidos não se apaixonam' when 3 then 'Eu, minha crush e minha irmã'
          when 4 then 'Liz Flores é uma farsa' when 5 then 'Segundo Clichê (Frutaverso Livro 1)' when 6 then 'Desejos Ocultos das Violetas'
          when 7 then 'O Casamento' when 8 then 'Como (não) se apaixonar' when 9 then 'Ela é mais do que você imagina'
          when 10 then '(Não) conta pra ela' when 11 then 'Opostas em Guerra' when 12 then 'Em todas as gotas de chuva'
          when 13 then 'Colegas de Quarto' when 14 then 'Imensurável: Uma nova chance para amar' when 15 then 'Georgia Rose: Segredos de Florença'
          when 16 then 'A Garota do Topo' when 17 then 'Não é só de amor que eu sei falar' when 18 then 'Os Segredos Que Contei Ao Oceano'
          when 19 then 'Opostos Complementares (Opostos Co. Livro 1)' when 20 then 'Canção dos Ossos'
          else 'Sticker Quiz'
        end into temp_name;

      select 
        case temp_sticker_number
          when 1 then 'G.B. Baldassari' when 2 then 'Clara Alves' when 3 then 'Bia Crespo'
          when 4 then 'Victoria Mendes' when 5 then 'Line Cunha' when 6 then 'Mariana Rosa'
          when 7 then 'Ju Mesquita' when 8 then 'D. Barreto' when 9 then 'V.S. Vilela'
          when 10 then 'Karoline Mandu' when 11 then 'Sarah Oliveira' when 12 then 'Englantine'
          when 13 then 'Marina Basso' when 14 then 'Zey Shelsea' when 15 then 'Victoria Moon'
          when 16 then 'Helena Nolasco' when 17 then 'Yasmim Mahmud Kader' when 18 then 'Camilla Giordanno'
          when 19 then 'Fernanda V.' when 20 then 'Giu Domingues'
          else 'Autora'
        end into temp_author;

      select 
        case temp_sticker_number
          when 1 then 'amor-fati' when 2 then 'cupidos-nao-se-apaixonam' when 3 then 'eu-minha-crush-e-minha-irma'
          when 4 then 'liz-flores-e-uma-farsa' when 5 then 'segundo-cliche' when 6 then 'desejos-ocultos-das-violetas'
          when 7 then 'o-casamento' when 8 then 'como-não-se-apaixonar' when 9 then 'ela-e-mais-do-que-voce-imagina'
          when 10 then 'nao-conta-pra-ela' when 11 then 'opostas-em-guerra' when 12 then 'em-todas-as-gotas-de-chuva'
          when 13 then 'colegas-de-quarto' when 14 then 'imensuravel-uma-nova-chance-para-amar' when 15 then 'georgia-rose'
          when 16 then 'a-garota-do-topo' when 17 then 'nao-e-so-de-amor-que-eu-sei-falar' when 18 then 'os-segredos-que-contei-ao-oceano'
          when 19 then 'opostos-complementares' when 20 then 'cancao-dos-ossos'
          else 'slug'
        end into temp_slug;

      -- Check total errors count for this question (distinct incorrect answers)
      select count(*) into temp_errors
      from public.quiz_answers
      where user_id = user_id_param and sticker_number = temp_sticker_number and correct = false;

      -- Check if already answered in this session (today)
      select exists(
        select 1 from public.quiz_answers 
        where user_id = user_id_param
          and sticker_number = temp_sticker_number
          and q_index = temp_q_index
          and attempt_day = current_day::date
      ) into temp_answered;

      if temp_answered then
        select correct, chosen_index into temp_correct, temp_chosen_index
        from public.quiz_answers
        where user_id = user_id_param
          and sticker_number = temp_sticker_number
          and q_index = temp_q_index
          and attempt_day = current_day::date;
      else
        temp_correct := false;
        temp_chosen_index := null;
      end if;

      -- Obfuscate correct_index if not answered and errors < 3 (assisted limit)
      if temp_answered or temp_errors >= 3 then
        temp_correct_index_return := temp_correct_index;
      else
        temp_correct_index_return := null;
      end if;

      -- Calculate deterministic wrong indices to hide if errors == 2 and unanswered
      temp_hide_indices := null;
      if temp_errors = 2 and not temp_answered then
        select array_agg(idx) into temp_hide_indices from (
          select idx from (
            select val as idx, ((val + temp_sticker_number) % 3) - 1 as sort_order
            from unnest(array[0, 1, 2, 3]) as val
            where val <> temp_correct_index
          ) x
          order by sort_order asc limit 2
        ) y;
      end if;

      q_item := jsonb_build_object(
        'sticker_number', temp_sticker_number,
        'slug', temp_slug,
        'title', temp_name,
        'author', temp_author,
        'q_index', temp_q_index,
        'text', temp_text,
        'options', to_jsonb(temp_options),
        'errors', temp_errors,
        'answered', temp_answered,
        'correct', temp_correct,
        'chosenIndex', temp_chosen_index,
        'correct_index', temp_correct_index_return,
        'options_to_hide', to_jsonb(temp_hide_indices)
      );
      questions_list := questions_list || q_item;
    end loop;
  end if;

  -- Count total correct quiz stickers owned by user
  select count(*) into correct_count
  from public.user_stickers us
  where us.user_id = user_id_param 
    and us.copies > 0 
    and us.sticker_number in (
      1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20
    );

  return jsonb_build_object(
    'diaAtual', attempt_row.dia_atual,
    'tentativasHojeCount', attempt_row.tentativas_hoje_count,
    'perguntasRespondidasCorretasCount', correct_count,
    'questions', questions_list
  );
end;
$$ language plpgsql security definer;

-- A quiz run has 20 rewards. Each group of four contains one to three rares;
-- this preserves the 40% feel while guaranteeing 5 to 12 rare quiz rewards.
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

drop trigger if exists user_stickers_enforce_quiz_rarity on public.user_stickers;
create trigger user_stickers_enforce_quiz_rarity
before insert on public.user_stickers
for each row execute function public.enforce_quiz_reward_rarity();


-- ----------------------------------------------------------------
-- RPC 2: ANSWER QUIZ (WITH VERIFICATION & ANTI-CHEAT & REWARDS)
-- ----------------------------------------------------------------
create or replace function public.answer_quiz_legacy(
  sticker_number_param integer,
  q_index_param integer,
  chosen_index_param integer
)
returns jsonb as $$
declare
  user_id_param uuid;
  current_day text;
  attempt_count integer;
  correct_idx_val integer;
  is_correct boolean;
  new_is_rare boolean;
  was_new boolean;
  final_is_rare boolean;
  reveals jsonb := '[]'::jsonb;
  reveal_item jsonb;
  new_errors integer;
  target_slug text;
  progression_reveals jsonb;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  current_day := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD');

  -- Verify and increment daily attempts count
  select tentativas_hoje_count into attempt_count
  from public.quiz_attempts
  where user_id = user_id_param;

  if attempt_count >= 4 then
    raise exception 'Você já esgotou suas 4 tentativas de hoje! Volte amanhã ⏳';
  end if;

  -- Verify if question is in today's pending session
  if not exists (
    select 1 from public.quiz_attempts
    where user_id = user_id_param and sticker_number_param = any(perguntas_pendentes)
  ) then
    raise exception 'Esta pergunta não está disponível para ser respondida hoje.';
  end if;

  -- Check if already answered in this session
  if exists (
    select 1 from public.quiz_answers
    where user_id = user_id_param
      and sticker_number = sticker_number_param
      and q_index = q_index_param
      and attempt_day = current_day::date
  ) then
    raise exception 'Você já respondeu a esta pergunta hoje.';
  end if;

  -- Retrieve correct index from secure quiz_questions table
  select correct_index into correct_idx_val
  from public.quiz_questions
  where sticker_number = sticker_number_param and q_index = q_index_param;

  if correct_idx_val is null then
    raise exception 'Pergunta não encontrada.';
  end if;

  -- Apply same deterministic shuffle as get_quiz_questions_for_today
  -- to find what shuffled position the correct answer now occupies.
  declare
    h integer;
    perm0 integer; perm1 integer; perm2 integer; perm3 integer;
    tmp_int integer;
    shuffled_correct_index integer;
  begin
    h := abs(hashtext(user_id_param::text || sticker_number_param::text || current_day));
    perm0 := 0; perm1 := 1; perm2 := 2; perm3 := 3;

    case (h % 4)
      when 0 then tmp_int := perm0; perm0 := perm3; perm3 := tmp_int;
      when 1 then tmp_int := perm1; perm1 := perm3; perm3 := tmp_int;
      when 2 then tmp_int := perm2; perm2 := perm3; perm3 := tmp_int;
      else null;
    end case;
    h := h / 4;
    case (h % 3)
      when 0 then tmp_int := perm0; perm0 := perm2; perm2 := tmp_int;
      when 1 then tmp_int := perm1; perm1 := perm2; perm2 := tmp_int;
      else null;
    end case;
    h := h / 3;
    if (h % 2) = 0 then
      tmp_int := perm0; perm0 := perm1; perm1 := tmp_int;
    end if;

    -- Find the shuffled position of the original correct answer
    if perm0 = correct_idx_val then shuffled_correct_index := 0;
    elsif perm1 = correct_idx_val then shuffled_correct_index := 1;
    elsif perm2 = correct_idx_val then shuffled_correct_index := 2;
    else shuffled_correct_index := 3;
    end if;

    -- Compare chosen index against the shuffled position of the correct answer
    is_correct := (chosen_index_param <> -1 and chosen_index_param = shuffled_correct_index);
  end;

  -- Update attempts count
  update public.quiz_attempts
  set tentativas_hoje_count = tentativas_hoje_count + 1
  where user_id = user_id_param;

  -- Record user answer
  insert into public.quiz_answers (
    user_id,
    sticker_number,
    q_index,
    chosen_index,
    correct,
    attempt_day
  )
  values (
    user_id_param,
    sticker_number_param,
    q_index_param,
    chosen_index_param,
    is_correct,
    current_day::date
  );

  select 
    case sticker_number_param
      when 1 then 'amor-fati' when 2 then 'cupidos-nao-se-apaixonam' when 3 then 'eu-minha-crush-e-minha-irma'
      when 4 then 'liz-flores-e-uma-farsa' when 5 then 'segundo-cliche' when 6 then 'desejos-ocultos-das-violetas'
      when 7 then 'o-casamento' when 8 then 'como-não-se-apaixonar' when 9 then 'ela-e-mais-do-que-voce-imagina'
      when 10 then 'nao-conta-pra-ela' when 11 then 'opostas-em-guerra' when 12 then 'em-todas-as-gotas-de-chuva'
      when 13 then 'colegas-de-quarto' when 14 then 'imensuravel-uma-nova-chance-para-amar' when 15 then 'georgia-rose'
      when 16 then 'a-garota-do-topo' when 17 then 'nao-e-so-de-amor-que-eu-sei-falar' when 18 then 'os-segredos-que-contei-ao-oceano'
      when 19 then 'opostos-complementares' when 20 then 'cancao-dos-ossos'
      else 'slug'
    end into target_slug;

  if is_correct then
    -- Roll for 40% chance of Rare
    new_is_rare := (random() < 0.40);

    -- Grant sticker in inventory
    insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    values (user_id_param, sticker_number_param, 1, new_is_rare, now())
    on conflict (user_id, sticker_number) do update set 
      copies = public.user_stickers.copies + 1,
      is_rare = public.user_stickers.is_rare or new_is_rare
    returning public.user_stickers.is_rare, (copies = 1) into final_is_rare, was_new;

    reveal_item := jsonb_build_object(
      'slug', target_slug,
      'number', sticker_number_param,
      'wasNew', was_new,
      'isRare', final_is_rare,
      'repeat', false, -- Quizzes don't duplicate on correct answer solving
      'reward', null
    );
    reveals := reveals || reveal_item;

    -- Trigger Milestone check
    progression_reveals := public.check_and_grant_rewards(user_id_param);
    reveals := reveals || progression_reveals;

    return jsonb_build_object(
      'correct', true,
      'reveals', reveals
    );
  else
    -- Incorrect answer
    select count(*) into new_errors
    from public.quiz_answers
    where user_id = user_id_param and sticker_number = sticker_number_param and correct = false;

    return jsonb_build_object(
      'correct', false,
      'errors', new_errors
    );
  end if;
end;
$$ language plpgsql security definer;

create or replace function public.record_quiz_timeout(
  uid uuid,
  sn integer,
  qi integer
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  error_count integer;
  current_day date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if exists (
    select 1 from public.quiz_answers
    where user_id = uid
      and sticker_number = sn
      and q_index = qi
      and attempt_day = current_day
  ) then
    delete from public.quiz_question_timers
    where user_id = uid and sticker_number = sn and q_index = qi;
    return jsonb_build_object('correct', false, 'already_answered', true);
  end if;

  insert into public.quiz_answers (
    user_id,
    sticker_number,
    q_index,
    chosen_index,
    correct,
    attempt_day
  )
  values (
    uid,
    sn,
    qi,
    -1,
    false,
    current_day
  );

  update public.quiz_attempts
  set tentativas_hoje_count = tentativas_hoje_count + 1
  where user_id = uid;

  select count(*) into error_count
  from public.quiz_answers
  where user_id = uid and sticker_number = sn and correct = false;

  delete from public.quiz_question_timers
  where user_id = uid and sticker_number = sn and q_index = qi;

  return jsonb_build_object('correct', false, 'errors', error_count, 'timed_out', true);
end;
$$;

create or replace function public.expire_quiz_question_timers()
returns void language plpgsql security definer set search_path = public as $$
declare
  timer_row record;
begin
  for timer_row in
    select * from public.quiz_question_timers
    where user_id = auth.uid() and expires_at <= now()
  loop
    perform public.record_quiz_timeout(timer_row.user_id, timer_row.sticker_number, timer_row.q_index);
  end loop;
end;
$$;

create or replace function public.start_quiz_question_timer(
  sticker_number_param integer,
  q_index_param integer
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  deadline timestamptz;
  timeout_result jsonb;
begin
  if uid is null then raise exception 'Unauthorized'; end if;

  select expires_at into deadline
  from public.quiz_question_timers
  where user_id = uid and sticker_number = sticker_number_param and q_index = q_index_param;

  if deadline is not null and deadline <= now() then
    timeout_result := public.record_quiz_timeout(uid, sticker_number_param, q_index_param);
    return timeout_result || jsonb_build_object('expired', true);
  end if;

  if deadline is null then
    deadline := now() + interval '3 minutes';
    insert into public.quiz_question_timers(user_id, sticker_number, q_index, expires_at)
    values (uid, sticker_number_param, q_index_param, deadline);
  end if;

  return jsonb_build_object('expires_at', deadline, 'expired', false);
end;
$$;

create or replace function public.answer_quiz(
  sticker_number_param integer,
  q_index_param integer,
  chosen_index_param integer
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  deadline timestamptz;
  result jsonb;
begin
  if uid is null then raise exception 'Unauthorized'; end if;

  select expires_at into deadline
  from public.quiz_question_timers
  where user_id = uid and sticker_number = sticker_number_param and q_index = q_index_param;

  if deadline is not null and deadline <= now() then
    return public.record_quiz_timeout(uid, sticker_number_param, q_index_param);
  end if;

  if deadline is null then
    insert into public.quiz_question_timers(user_id, sticker_number, q_index, expires_at)
    values (uid, sticker_number_param, q_index_param, now() + interval '3 minutes');
  end if;

  result := public.answer_quiz_legacy(sticker_number_param, q_index_param, chosen_index_param);
  delete from public.quiz_question_timers
  where user_id = uid and sticker_number = sticker_number_param and q_index = q_index_param;
  return result;
end;
$$;

revoke all on function public.answer_quiz_legacy(integer, integer, integer) from public, anon, authenticated;
grant execute on function public.expire_quiz_question_timers() to authenticated;
grant execute on function public.start_quiz_question_timer(integer, integer) to authenticated;
grant execute on function public.answer_quiz(integer, integer, integer) to authenticated;


-- ----------------------------------------------------------------
-- RPC 3: REDEEM CODE (PROMO CODES REDEMPTION & CHEAT PROOF)
-- ----------------------------------------------------------------
create or replace function public.draw_non_quiz_sticker(
  user_id_param uuid,
  pool_numbers integer[]
)
returns integer as $$
declare
  owned_count integer;
  repeat_chance double precision;
  choose_repeat boolean;
  target_number integer;
begin
  if pool_numbers is null or array_length(pool_numbers, 1) is null then
    raise exception 'Pool de figurinhas vazia.';
  end if;

  select count(distinct us.sticker_number)::integer into owned_count
  from public.user_stickers us
  where us.user_id = user_id_param
    and us.copies > 0
    and us.sticker_number between 21 and 100;

  repeat_chance := case when owned_count >= 40 then 0.47 else 0.40 end;
  choose_repeat := random() < repeat_chance;

  if choose_repeat then
    select pool.sticker_number into target_number
    from unnest(pool_numbers) as pool(sticker_number)
    where exists (
      select 1 from public.user_stickers us
      where us.user_id = user_id_param
        and us.sticker_number = pool.sticker_number
        and us.copies > 0
    )
    order by random()
    limit 1;
  end if;

  if target_number is null then
    select pool.sticker_number into target_number
    from unnest(pool_numbers) as pool(sticker_number)
    where not exists (
      select 1 from public.user_stickers us
      where us.user_id = user_id_param
        and us.sticker_number = pool.sticker_number
        and us.copies > 0
    )
    order by random()
    limit 1;
  end if;

  if target_number is null then
    target_number := pool_numbers[floor(random() * array_length(pool_numbers, 1) + 1)];
  end if;

  return target_number;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.draw_non_quiz_sticker(uuid, integer[]) from public, anon, authenticated;

create or replace function public.redeem_code(code_param text)
returns jsonb as $$
declare
  user_id_param uuid;
  code_clean text;
  code_row record;
  pool_numbers integer[];
  available_pool integer[];
  package_numbers integer[] := '{}'::integer[];
  reveals jsonb := '[]'::jsonb;
  draw_idx integer;
  target_number integer;
  target_slug text;
  was_new boolean;
  styles_unlocked jsonb := '[]'::jsonb;
  progression_reveals jsonb;
  release_date_str text;
  release_date_val timestamptz;
  days_elapsed integer;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  code_clean := upper(trim(code_param));

  -- Verify code validity
  select * into code_row from public.redeem_codes where code = code_clean and active = true;
  if not found then
    raise exception 'Código inválido.';
  end if;

  -- Verify release schedule based on app launch settings
  select value into release_date_str from public.app_settings where key = 'release_date';
  if release_date_str is null then
    release_date_val := '2026-07-02 00:00:00+00'::timestamptz;
  else
    release_date_val := (release_date_str || ' 00:00:00+00')::timestamptz;
  end if;

  days_elapsed := floor(extract(epoch from (now() - release_date_val)) / 86400)::integer + 1;
  if days_elapsed < code_row.release_day then
    raise exception 'Este código promocional ainda não está ativo! Será liberado no dia % do lançamento.', code_row.release_day;
  end if;

  -- Ensure user hasn't redeemed this code before
  if exists (
    select 1 from public.reward_grants
    where user_id = user_id_param and reward_key = 'code_' || code_clean
  ) then
    raise exception 'Você já usou esse código.';
  end if;

  -- Get code sticker pool
  select array_agg(sticker_number) into pool_numbers
  from public.redeem_pools
  where code = code_clean;

  if pool_numbers is null or array_length(pool_numbers, 1) = 0 then
    raise exception 'Pool do código vazia.';
  end if;

  -- Mark code as redeemed for this user
  insert into public.reward_grants (user_id, reward_key) values (user_id_param, 'code_' || code_clean);

  -- Perform 5 random sticker draws
  for draw_idx in 1 .. 5 loop
    available_pool := public.pack_available_pool(pool_numbers, package_numbers);
    target_number := public.draw_non_quiz_sticker(user_id_param, available_pool);
    package_numbers := array_append(package_numbers, target_number);

    -- Get sticker details
    select 
      case target_number
        when 1 then 'amor-fati' when 2 then 'cupidos-nao-se-apaixonam' when 3 then 'eu-minha-crush-e-minha-irma'
        when 4 then 'liz-flores-e-uma-farsa' when 5 then 'segundo-cliche' when 6 then 'desejos-ocultos-das-violetas'
        when 7 then 'o-casamento' when 8 then 'como-não-se-apaixonar' when 9 then 'ela-e-mais-do-que-voce-imagina'
        when 10 then 'nao-conta-pra-ela' when 11 then 'opostas-em-guerra' when 12 then 'em-todas-as-gotas-de-chuva'
        when 13 then 'colegas-de-quarto' when 14 then 'imensuravel-uma-nova-chance-para-amar' when 15 then 'georgia-rose'
        when 16 then 'a-garota-do-topo' when 17 then 'nao-e-so-de-amor-que-eu-sei-falar' when 18 then 'os-segredos-que-contei-ao-oceano'
        when 19 then 'opostos-complementares' when 20 then 'cancao-dos-ossos'
        when 21 then 'classicos-saficos' when 22 then 'bright-falls' when 23 then 'romance-e-destino'
        when 24 then 'drama-e-superacao' when 25 then 'garotas-saficas' when 26 then 'intriga-e-paixao'
        when 27 then 'segredos-revelados' when 28 then 'amores-proibidos' when 29 then 'encontros-e-desencontros'
        when 30 then 'lendo-saficos' when 31 then 'orgulho-e-preconceito' when 32 then 'emma'
        when 33 then 'razao-e-sensibilidade' when 34 then 'mansfield-park' when 35 then 'persuasao'
        when 36 then 'ls-sticker-1' when 37 then 'ls-sticker-2' when 38 then 'ls-sticker-3' when 39 then 'ls-sticker-4' when 40 then 'ls-sticker-5'
        when 41 then 'historias-de-amor' when 42 then 'representatividade' when 43 then 'poesia-safica' when 44 then 'senhora' when 45 then 'lucia-mccartney'
        when 46 then 'frase-1' when 47 then 'frase-2' when 48 then 'frase-3' when 49 then 'persuasao' when 50 then 'lendo-saficos'
        else 'frase-' || (target_number - 47)
      end into target_slug;

    -- Add to user stickers inventory
    insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    values (user_id_param, target_number, 1, false, now())
    on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
    returning (copies = 1) into was_new;

    reveals := reveals || jsonb_build_object(
      'slug', target_slug,
      'number', target_number,
      'wasNew', was_new,
      'isRare', false,
      'repeat', not was_new,
      'reward', null
    );
  end loop;

  -- Unlock cosmetic layout style if attached to promo code
  if code_row.element is not null then
    update public.user_styles
    set unlocked = true
    where user_id = user_id_param and style_id = code_row.element;
  end if;

  -- Check Progression achievements
  progression_reveals := public.check_and_grant_rewards(user_id_param);
  reveals := reveals || progression_reveals;

  return jsonb_build_object(
    'success', true,
    'reveals', reveals,
    'element', code_row.element
  );
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.redeem_code(text) from public, anon;
grant execute on function public.redeem_code(text) to authenticated;


create or replace function public.generate_donation(sticker_number_param integer)
returns text as $$
declare
  user_id_param uuid;
  existing_copies integer;
  random_code text;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  -- Check duplicate ownership
  select copies into existing_copies
  from public.user_stickers
  where user_id = user_id_param and sticker_number = sticker_number_param;

  if existing_copies is null or existing_copies <= 1 then
    raise exception 'Você não tem repetida dessa.';
  end if;

  -- Consume copy
  update public.user_stickers
  set copies = copies - 1
  where user_id = user_id_param and sticker_number = sticker_number_param;

  -- Generate 8 character random uppercase code
  loop
    random_code := upper(substring(md5(random()::text) from 1 for 8));
    exit when not exists (select 1 from public.donations where code = random_code);
  end loop;

  -- Create donation entry (expires in 24 hours)
  insert into public.donations (code, sticker_number, from_user, to_user, status, expires_at)
  values (
    random_code,
    sticker_number_param,
    user_id_param,
    null,
    'active',
    now() + interval '24 hours'
  );

  return random_code;
end;
$$ language plpgsql security definer;


-- ----------------------------------------------------------------
-- RPC 5: REDEEM DONATION (ADDS TO INVENTORY)
-- ----------------------------------------------------------------
create or replace function public.redeem_donation(code_param text)
returns jsonb as $$
declare
  user_id_param uuid;
  code_clean text;
  donation_row record;
  target_slug text;
  was_new boolean;
  reveals jsonb := '[]'::jsonb;
  progression_reveals jsonb;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  code_clean := upper(trim(code_param));

  -- Get active donation
  select * into donation_row from public.donations where code = code_clean;
  if not found then
    raise exception 'Código inválido.';
  end if;

  if donation_row.status <> 'active' then
    raise exception 'Esse código de doação já foi usado ou expirou.';
  end if;

  -- Check if expired
  if now() > donation_row.expires_at then
    update public.donations set status = 'expired' where code = code_clean;
    
    -- Revert copy to sender
    update public.user_stickers
    set copies = copies + 1
    where user_id = donation_row.from_user and sticker_number = donation_row.sticker_number;
    
    raise exception 'Código de doação expirado.';
  end if;

  -- Prevent self-claiming
  if donation_row.from_user = user_id_param then
    raise exception 'Você não pode resgatar seu próprio código 😅';
  end if;

  -- Consume donation
  update public.donations
  set status = 'used', to_user = user_id_param
  where code = code_clean;

  -- Mapping slug matching seeds.ts
  select 
    case donation_row.sticker_number
      when 1 then 'amor-fati' when 2 then 'cupidos-nao-se-apaixonam' when 3 then 'eu-minha-crush-e-minha-irma'
      when 4 then 'liz-flores-e-uma-farsa' when 5 then 'segundo-cliche' when 6 then 'desejos-ocultos-das-violetas'
      when 7 then 'o-casamento' when 8 then 'como-não-se-apaixonar' when 9 then 'ela-e-mais-do-que-voce-imagina'
      when 10 then 'nao-conta-pra-ela' when 11 then 'opostas-em-guerra' when 12 then 'em-todas-as-gotas-de-chuva'
      when 13 then 'colegas-de-quarto' when 14 then 'imensuravel-uma-nova-chance-para-amar' when 15 then 'georgia-rose'
      when 16 then 'a-garota-do-topo' when 17 then 'nao-e-so-de-amor-que-eu-sei-falar' when 18 then 'os-segredos-que-contei-ao-oceano'
      when 19 then 'opostos-complementares' when 20 then 'cancao-dos-ossos'
      when 21 then 'classicos-saficos' when 22 then 'bright-falls' when 23 then 'romance-e-destino'
      when 24 then 'drama-e-superacao' when 25 then 'garotas-saficas' when 26 then 'intriga-e-paixao'
      when 27 then 'segredos-revelados' when 28 then 'amores-proibidos' when 29 then 'encontros-e-desencontros'
      when 30 then 'lendo-saficos' when 31 then 'orgulho-e-preconceito' when 32 then 'emma'
      when 33 then 'razao-e-sensibilidade' when 34 then 'mansfield-park' when 35 then 'persuasao'
      when 36 then 'ls-sticker-1' when 37 then 'ls-sticker-2' when 38 then 'ls-sticker-3' when 39 then 'ls-sticker-4' when 40 then 'ls-sticker-5'
      when 41 then 'historias-de-amor' when 42 then 'representatividade' when 43 then 'poesia-safica' when 44 then 'senhora' when 45 then 'lucia-mccartney'
      when 46 then 'frase-1' when 47 then 'frase-2' when 48 then 'frase-3' when 49 then 'persuasao' when 50 then 'lendo-saficos'
      else 'frase-' || (donation_row.sticker_number - 47)
    end into target_slug;

  -- Add sticker to user inventory
  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (user_id_param, donation_row.sticker_number, 1, false, now())
  on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
  returning (copies = 1) into was_new;

  reveals := reveals || jsonb_build_object(
    'slug', target_slug,
    'number', donation_row.sticker_number,
    'wasNew', was_new,
    'isRare', false,
    'repeat', not was_new,
    'reward', null
  );

  -- Check achievements
  progression_reveals := public.check_and_grant_rewards(user_id_param);
  reveals := reveals || progression_reveals;

  return jsonb_build_object(
    'success', true,
    'reveals', reveals
  );
end;
$$ language plpgsql security definer;


-- ----------------------------------------------------------------
-- RPC 6: EXPIRE ACTIVE DONATIONS (AUTO-REVERTS)
-- ----------------------------------------------------------------
create or replace function public.expire_donations()
returns jsonb as $$
declare
  donation_row record;
  expired_count integer := 0;
begin
  for donation_row in 
    select * from public.donations 
    where status = 'active' and now() > expires_at
  loop
    update public.donations
    set status = 'expired'
    where code = donation_row.code;

    -- Revert copy to sender/creator
    insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    values (donation_row.from_user, donation_row.sticker_number, 1, false, now())
    on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1;

    expired_count := expired_count + 1;
  end loop;

  return jsonb_build_object('expired_count', expired_count);
end;
$$ language plpgsql security definer;


-- ----------------------------------------------------------------
-- RPC 7: COMPLETE NON-QUIZ MISSION (REWARDS STICKER)
-- ----------------------------------------------------------------

-- HELPER: RANDOM REWARD FROM POOL (21 to 100) WITH DYNAMIC REPEAT PROBABILITY
create or replace function public.get_random_pool_sticker(user_id_param uuid)
returns integer as $$
declare
  pool_numbers integer[];
begin
  select array_agg(sticker_number order by sticker_number) into pool_numbers
  from generate_series(21, 100) as pool(sticker_number);

  return public.draw_non_quiz_sticker(user_id_param, pool_numbers);
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.get_random_pool_sticker(uuid) from public, anon, authenticated;


create or replace function public.complete_mission(mission_id_param text)
returns jsonb as $$
declare
  user_id_param uuid;
  target_sticker integer;
  target_slug text;
  was_new boolean;
  reveals jsonb := '[]'::jsonb;
  progression_reveals jsonb;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  if exists (
    select 1 from public.mission_completions
    where user_id = user_id_param and mission_id = mission_id_param
  ) then
    raise exception 'Você já concluiu esta missão!';
  end if;

  if mission_id_param not in ('whatsapp', 'x', 'instagram', 'tiktok', 'copy-link') then
    raise exception 'Missão inválida';
  end if;

  insert into public.mission_completions (user_id, mission_id)
  values (user_id_param, mission_id_param);

  target_sticker := public.get_random_pool_sticker(user_id_param);

  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (user_id_param, target_sticker, 1, false, now())
  on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1
  returning (copies = 1) into was_new;

  reveals := reveals || jsonb_build_object(
    'slug', 'mission-reward',
    'number', target_sticker,
    'wasNew', was_new,
    'isRare', false,
    'repeat', not was_new,
    'reward', 'mission_' || mission_id_param
  );

  progression_reveals := public.check_and_grant_rewards(user_id_param);
  reveals := reveals || progression_reveals;

  return jsonb_build_object('success', true, 'reveals', reveals);
end;
$$ language plpgsql security definer;


create or replace function public.claim_daily_element(user_id_param uuid)
returns jsonb as $$
declare
  current_day text;
  release_date_val date;
  days_elapsed integer;
  style_id_reward text;
  style_name_reward text;
  style_icon_reward text;
begin
  if user_id_param is null then
    raise exception 'Unauthorized';
  end if;

  current_day := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD');

  -- Get release date
  select value::date into release_date_val from public.app_settings where key = 'release_date';
  if release_date_val is null then
    release_date_val := '2026-07-02'::date;
  end if;

  -- Calculate release day number (1-indexed)
  days_elapsed := ( (now() at time zone 'America/Sao_Paulo')::date - release_date_val ) + 1;

  if days_elapsed < 1 then
    raise exception 'O período de resgate de elementos ainda não começou.';
  end if;

  -- Check if already claimed today
  if exists (
    select 1 from public.daily_claims
    where user_id = user_id_param and day = current_day
  ) then
    raise exception 'Já resgatado hoje. Volte amanhã para mais!';
  end if;

  -- Determine next available reward based on the new logic
  if days_elapsed <= 5 then
    style_id_reward := case days_elapsed
      when 1 then 'lilac'
      when 2 then 'avatar-neon-frame'
      when 3 then 'new-icon'
      when 4 then 'theme-dark'
      when 5 then 'story-layout'
    end;
    
    -- Verify if the user already has this target style
    if exists (select 1 from public.user_styles where user_id = user_id_param and style_id = style_id_reward and unlocked = true) then
      style_id_reward := null;
    end if;
  end if;

  if style_id_reward is null then
    -- Fallback to the first unredeemed style (ordered by original release order)
    select style_id into style_id_reward
    from public.user_styles
    where user_id = user_id_param
      and style_id in ('lilac', 'avatar-neon-frame', 'new-icon', 'theme-dark', 'story-layout')
      and unlocked = false
    order by
      case style_id
        when 'lilac' then 1
        when 'avatar-neon-frame' then 2
        when 'new-icon' then 3
        when 'theme-dark' then 4
        when 'story-layout' then 5
      end
    limit 1;
  end if;

  if style_id_reward is null then
    raise exception 'Todos os elementos já foram resgatados! Em breve traremos novos estilos para você desbloquear.';
  end if;

  -- Set reward details based on the selected style
  if style_id_reward = 'lilac' then
    style_name_reward := 'Cor do álbum (lilás)';
    style_icon_reward := '💜';
  elsif style_id_reward = 'avatar-neon-frame' then
    style_name_reward := 'Moldura brilhante arco-íris';
    style_icon_reward := '🌈';
  elsif style_id_reward = 'new-icon' then
    style_name_reward := 'Avatares extras (13 a 16)';
    style_icon_reward := '🖼️';
  elsif style_id_reward = 'theme-dark' then
    style_name_reward := 'Cor do álbum (versão dark)';
    style_icon_reward := '🌙';
  else
    style_name_reward := 'Layout de story premium';
    style_icon_reward := '📱';
  end if;

  -- Record daily claim
  insert into public.daily_claims (user_id, day)
  values (user_id_param, current_day);

  -- Unlock cosmetic style
  update public.user_styles
  set unlocked = true
  where user_id = user_id_param and style_id = style_id_reward;

  return jsonb_build_object(
    'claimed', true,
    'unlocked', true,
    'style', jsonb_build_object(
      'id', style_id_reward,
      'name', style_name_reward,
      'icon', style_icon_reward
    )
  );
end;
$$ language plpgsql security definer;
