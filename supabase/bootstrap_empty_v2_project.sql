-- Bootstrap minimo para rodar a V1 clonada em um projeto Supabase vazio.
-- Rode no Supabase SQL Editor do projeto V2.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nick text not null default 'Colecionadora',
  avatar_url text,
  avatar_emoji text default '📷',
  mural_opt_in boolean not null default true,
  recent_stickers integer[] not null default '{}',
  pending_pack jsonb,
  reveals_queue jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.stickers (
  number integer primary key,
  slug text not null unique,
  name text not null,
  author text,
  type text not null default 'sorteio',
  cover_url text,
  amazon_url text
);

create table if not exists public.user_stickers (
  user_id uuid not null references auth.users(id) on delete cascade,
  sticker_number integer not null references public.stickers(number) on delete cascade,
  copies integer not null default 1,
  is_rare boolean not null default false,
  first_unlocked_at timestamptz not null default now(),
  primary key (user_id, sticker_number)
);

create table if not exists public.user_styles (
  user_id uuid not null references auth.users(id) on delete cascade,
  style_id text not null,
  unlocked boolean not null default false,
  enabled boolean not null default false,
  primary key (user_id, style_id)
);

create table if not exists public.daily_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  style_id text,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table if not exists public.mission_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, mission_id)
);

create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

create table if not exists public.donations (
  code text primary key,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid references auth.users(id) on delete set null,
  sticker_number integer not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create table if not exists public.quiz_answers (
  user_id uuid not null references auth.users(id) on delete cascade,
  sticker_number integer not null,
  q_index integer not null,
  chosen_index integer,
  correct boolean not null default false,
  answered_at timestamptz not null default now(),
  primary key (user_id, sticker_number, q_index)
);

insert into public.app_settings (key, value)
values ('release_date', '2026-07-02')
on conflict (key) do nothing;

insert into public.stickers (number, slug, name, author, type, cover_url)
select
  n,
  'figurinha-' || n,
  'Figurinha ' || n,
  case when n <= 20 then 'Clube das Colecionadoras' else null end,
  case
    when n <= 20 then 'quiz'
    when n <= 80 then 'sorteio'
    when n <= 90 then 'ls'
    else 'frase'
  end,
  null
from generate_series(1, 100) as n
on conflict (number) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nick, avatar_emoji, mural_opt_in)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nick', split_part(new.email, '@', 1), 'Colecionadora'),
    '📷',
    coalesce((new.raw_user_meta_data ->> 'mural_opt_in')::boolean, true)
  )
  on conflict (id) do nothing;

  insert into public.user_styles (user_id, style_id, unlocked, enabled)
  values
    (new.id, 'lilac', false, false),
    (new.id, 'avatar-neon-frame', false, false),
    (new.id, 'new-icon', false, false),
    (new.id, 'theme-dark', false, false),
    (new.id, 'story-layout', false, false)
  on conflict (user_id, style_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, nick, avatar_emoji, mural_opt_in)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'nick', split_part(u.email, '@', 1), 'Colecionadora'),
  '📷',
  coalesce((u.raw_user_meta_data ->> 'mural_opt_in')::boolean, true)
from auth.users u
on conflict (id) do nothing;

insert into public.user_styles (user_id, style_id, unlocked, enabled)
select u.id, s.style_id, false, false
from auth.users u
cross join (values
  ('lilac'),
  ('avatar-neon-frame'),
  ('new-icon'),
  ('theme-dark'),
  ('story-layout')
) as s(style_id)
on conflict (user_id, style_id) do nothing;

alter table public.profiles enable row level security;
alter table public.stickers enable row level security;
alter table public.user_stickers enable row level security;
alter table public.user_styles enable row level security;
alter table public.daily_claims enable row level security;
alter table public.mission_completions enable row level security;
alter table public.app_settings enable row level security;
alter table public.donations enable row level security;
alter table public.quiz_answers enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "stickers_public_read" on public.stickers;
create policy "stickers_public_read" on public.stickers for select to anon, authenticated using (true);

drop policy if exists "user_stickers_own_all" on public.user_stickers;
create policy "user_stickers_own_all" on public.user_stickers for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_styles_own_all" on public.user_styles;
create policy "user_styles_own_all" on public.user_styles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "daily_claims_own_all" on public.daily_claims;
create policy "daily_claims_own_all" on public.daily_claims for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "mission_completions_own_all" on public.mission_completions;
create policy "mission_completions_own_all" on public.mission_completions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "app_settings_read" on public.app_settings;
create policy "app_settings_read" on public.app_settings for select to authenticated using (true);

drop policy if exists "donations_own_all" on public.donations;
create policy "donations_own_all" on public.donations for all to authenticated using (auth.uid() = from_user or auth.uid() = to_user) with check (auth.uid() = from_user or auth.uid() = to_user);

drop policy if exists "quiz_answers_own_all" on public.quiz_answers;
create policy "quiz_answers_own_all" on public.quiz_answers for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.get_public_album(profile_id uuid)
returns table(sticker_number integer, copies integer, is_rare boolean)
language sql
stable
security definer
set search_path = public
as $$
  select us.sticker_number, us.copies, us.is_rare
  from public.user_stickers us
  join public.profiles p on p.id = us.user_id
  where us.user_id = profile_id
    and us.copies > 0
    and p.mural_opt_in;
$$;

create or replace function public.get_public_mural()
returns table(id uuid, nick text, avatar text, count bigint, pct integer, quiz_correct bigint, rare_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.nick,
    coalesce(p.avatar_url, p.avatar_emoji, '📷') as avatar,
    count(distinct us.sticker_number) filter (where us.copies > 0) as count,
    least(100, round((count(distinct us.sticker_number) filter (where us.copies > 0))::numeric))::integer as pct,
    coalesce((select count(*) from public.quiz_answers qa where qa.user_id = p.id and qa.correct), 0) as quiz_correct,
    count(distinct us.sticker_number) filter (where us.copies > 0 and us.is_rare) as rare_count
  from public.profiles p
  left join public.user_stickers us on us.user_id = p.id
  where p.mural_opt_in
  group by p.id, p.nick, p.avatar_url, p.avatar_emoji, p.created_at
  order by pct desc, quiz_correct desc, rare_count desc, p.created_at asc
  limit 20;
$$;

create or replace function public.get_user_mural_rank(user_id_param uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      p.id,
      row_number() over (
        order by count(distinct us.sticker_number) filter (where us.copies > 0) desc, p.created_at asc
      ) as rank
    from public.profiles p
    left join public.user_stickers us on us.user_id = p.id
    where p.mural_opt_in
    group by p.id, p.created_at
  )
  select rank::integer from ranked where id = user_id_param;
$$;

create or replace function public.toggle_style(style_id_param text, enabled_param boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_styles (user_id, style_id, unlocked, enabled)
  values (auth.uid(), style_id_param, true, enabled_param)
  on conflict (user_id, style_id)
  do update set enabled = enabled_param;
end;
$$;

create or replace function public.complete_mission(mission_id_param text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id_param uuid;
  target_sticker integer;
  was_new boolean;
  reveals jsonb := '[]'::jsonb;
begin
  user_id_param := auth.uid();
  if user_id_param is null then
    raise exception 'Nao autenticado';
  end if;

  if mission_id_param not in ('whatsapp', 'x', 'instagram', 'tiktok', 'copy-link') then
    raise exception 'Missao invalida';
  end if;

  insert into public.mission_completions (user_id, mission_id)
  values (user_id_param, mission_id_param)
  on conflict do nothing;

  if not found then
    raise exception 'Missao ja concluida';
  end if;

  select number
  into target_sticker
  from public.stickers
  where number between 21 and 100
  order by random()
  limit 1;

  if target_sticker is null then
    raise exception 'Nenhuma figurinha disponivel para sorteio';
  end if;

  insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
  values (user_id_param, target_sticker, 1, false, now())
  on conflict (user_id, sticker_number)
  do update set copies = public.user_stickers.copies + 1
  returning (copies = 1) into was_new;

  reveals := reveals || jsonb_build_object(
    'slug', 'mission-reward',
    'number', target_sticker,
    'wasNew', was_new,
    'isRare', false,
    'repeat', not was_new,
    'reward', 'mission_' || mission_id_param
  );

  return jsonb_build_object('success', true, 'reveals', reveals);
end;
$$;

create or replace function public.claim_daily_element()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  reward_ids text[] := array['lilac', 'avatar-neon-frame', 'new-icon', 'theme-dark', 'story-layout'];
  already_claimed text;
  unlocked_count integer;
  next_style text;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Nao autenticado';
  end if;

  select style_id into already_claimed
  from public.daily_claims
  where user_id = uid and day = current_date;

  if already_claimed is not null then
    return jsonb_build_object(
      'success', true,
      'unlocked', false,
      'style', jsonb_build_object('id', already_claimed),
      'message', 'Elemento do dia ja resgatado.'
    );
  end if;

  select count(*) into unlocked_count
  from public.user_styles
  where user_id = uid and style_id = any(reward_ids) and unlocked;

  if unlocked_count >= array_length(reward_ids, 1) then
    return jsonb_build_object(
      'success', true,
      'unlocked', false,
      'style', null,
      'message', 'Todos os elementos ja foram resgatados.'
    );
  end if;

  next_style := reward_ids[unlocked_count + 1];

  insert into public.user_styles (user_id, style_id, unlocked, enabled)
  values (uid, next_style, true, false)
  on conflict (user_id, style_id)
  do update set unlocked = true;

  insert into public.daily_claims (user_id, day)
  values (uid, current_date)
  on conflict (user_id, day) do update set style_id = next_style;

  update public.daily_claims
  set style_id = next_style
  where user_id = uid and day = current_date;

  return jsonb_build_object(
    'success', true,
    'unlocked', true,
    'style', jsonb_build_object('id', next_style),
    'message', 'Elemento do dia resgatado.'
  );
end;
$$;

create or replace function public.expire_quiz_question_timers()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  return;
end;
$$;

create or replace function public.get_quiz_questions_for_today()
returns jsonb
language sql
security definer
set search_path = public
as $$ select '[]'::jsonb; $$;

create or replace function public.start_quiz_question_timer(sticker_number_param integer, q_index_param integer)
returns jsonb
language sql
security definer
set search_path = public
as $$ select jsonb_build_object('success', true); $$;

create or replace function public.answer_quiz(sticker_number_param integer, q_index_param integer, chosen_index_param integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.quiz_answers (user_id, sticker_number, q_index, chosen_index, correct)
  values (auth.uid(), sticker_number_param, q_index_param, chosen_index_param, false)
  on conflict (user_id, sticker_number, q_index)
  do update set chosen_index = chosen_index_param, answered_at = now();
  return jsonb_build_object('correct', false, 'reveals', '[]'::jsonb);
end;
$$;

create or replace function public.redeem_code(code_param text)
returns jsonb
language sql
security definer
set search_path = public
as $$ select jsonb_build_object('success', false, 'message', 'Codigo indisponivel neste banco de teste.'); $$;

create or replace function public.generate_donation(sticker_number_param integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare new_code text;
begin
  new_code := upper(substr(md5(random()::text), 1, 8));
  insert into public.donations (code, from_user, sticker_number)
  values (new_code, auth.uid(), sticker_number_param);
  return new_code;
end;
$$;

create or replace function public.redeem_donation(code_param text)
returns jsonb
language sql
security definer
set search_path = public
as $$ select jsonb_build_object('success', false, 'message', 'Doacoes serao substituidas por trocas na V2.'); $$;

create or replace function public.expire_donations()
returns integer
language sql
security definer
set search_path = public
as $$
  update public.donations
  set status = 'expired'
  where status = 'active' and expires_at < now();
  select 1;
$$;

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.profiles where id = auth.uid();
end;
$$;

grant usage on schema public to anon, authenticated;
grant select on public.stickers to anon, authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.user_stickers,
  public.user_styles,
  public.daily_claims,
  public.mission_completions,
  public.donations,
  public.quiz_answers
to authenticated;
grant select on public.app_settings to authenticated;

grant execute on function public.get_public_album(uuid) to anon, authenticated;
grant execute on function public.get_public_mural() to anon, authenticated;
grant execute on function public.get_user_mural_rank(uuid) to authenticated;
grant execute on function public.toggle_style(text, boolean) to authenticated;
grant execute on function public.complete_mission(text) to authenticated;
grant execute on function public.claim_daily_element() to authenticated;
grant execute on function public.expire_quiz_question_timers() to authenticated;
grant execute on function public.get_quiz_questions_for_today() to authenticated;
grant execute on function public.start_quiz_question_timer(integer, integer) to authenticated;
grant execute on function public.answer_quiz(integer, integer, integer) to authenticated;
grant execute on function public.redeem_code(text) to authenticated;
grant execute on function public.generate_donation(integer) to authenticated;
grant execute on function public.redeem_donation(text) to authenticated;
grant execute on function public.expire_donations() to authenticated;
grant execute on function public.delete_user_account() to authenticated;
