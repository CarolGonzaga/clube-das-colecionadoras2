-- Apply this migration in the Supabase SQL editor after src/lib/schema.sql.
-- It is safe to run on the current Clube schema and does not require user data.

-- Safe drops to avoid return type change or overloading conflicts
drop function if exists public.get_public_mural();
drop function if exists public.claim_daily_element(uuid);
drop function if exists public.claim_daily_element();
drop function if exists public.toggle_style(text,boolean);

alter table public.profiles add column if not exists recent_stickers integer[] not null default '{}';
alter table public.profiles add column if not exists pending_pack jsonb;
alter table public.profiles add column if not exists reveals_queue jsonb not null default '[]'::jsonb;

insert into public.user_styles (user_id, style_id, unlocked, enabled)
select p.id, s.style_id, false, false
from public.profiles p cross join (values
  ('lilac'), ('avatar-neon-frame'), ('new-icon'), ('theme-dark'),
  ('glitter'), ('story-layout'), ('goldframe')
) s(style_id)
on conflict (user_id, style_id) do nothing;

-- Browser users may read their own inventory but must never alter rewards directly.
drop policy if exists "System/DB functions manage user stickers" on public.user_stickers;
drop policy if exists "Allow users to update own styles state" on public.user_styles;
drop policy if exists "Allow users to insert own styles" on public.user_styles;
drop policy if exists "Allow public read of active donations" on public.donations;
drop policy if exists "Allow creator to manage own donations" on public.donations;

create or replace function public.get_public_album(profile_id uuid)
returns table(sticker_number integer, copies integer, is_rare boolean)
language sql stable security definer set search_path = public as $$
  select sticker_number, copies, is_rare from public.user_stickers
  where user_id = profile_id and copies > 0;
$$;

create or replace function public.get_public_mural()
returns table(id uuid, nick text, avatar text, count bigint, pct integer, quiz_correct bigint, rare_count bigint)
language sql stable security definer set search_path = public as $$
  with mural_data as (
    select p.id, p.nick, coalesce(p.avatar_url, p.avatar_emoji, '🌸') as avatar,
      count(distinct us.sticker_number) filter (where us.copies > 0) as count,
      count(distinct us.sticker_number) filter (where us.copies > 0)::integer as pct,
      coalesce((select count(*) from public.quiz_answers qa where qa.user_id = p.id and qa.correct = true), 0) as quiz_correct,
      count(distinct us.sticker_number) filter (where us.copies > 0 and us.is_rare) as rare_count,
      p.created_at
    from public.profiles p left join public.user_stickers us on us.user_id = p.id
    where p.mural_opt_in group by p.id, p.nick, p.avatar_url, p.avatar_emoji, p.created_at
  )
  select id, nick, avatar, count, pct, quiz_correct, rare_count
  from mural_data
  order by pct desc, quiz_correct desc, rare_count desc, created_at asc limit 20;
$$;

create or replace function public.claim_daily_element()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); today text := to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM-DD'); reward text;
begin
  if uid is null then raise exception 'Unauthorized'; end if;
  if exists(select 1 from public.daily_claims where user_id=uid and day=today) then raise exception 'Já resgatado hoje. Volte amanhã para mais!'; end if;
  select style_id into reward from public.user_styles where user_id=uid
    and style_id in ('lilac','avatar-neon-frame','new-icon','theme-dark','glitter') and not unlocked
    order by array_position(array['lilac','avatar-neon-frame','new-icon','theme-dark','glitter'],style_id) limit 1;
  if reward is null then raise exception 'Todos os elementos já foram resgatados! Em breve traremos novos estilos para você desbloquear'; end if;
  insert into public.daily_claims(user_id,day) values(uid,today);
  update public.user_styles set unlocked=true where user_id=uid and style_id=reward;
  return jsonb_build_object('claimed',true,'unlocked',true,'style',jsonb_build_object('id',reward));
end; $$;

create or replace function public.toggle_style(style_id_param text, enabled_param boolean)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.user_styles where user_id=uid and style_id=style_id_param and unlocked) then raise exception 'Estilização não desbloqueada'; end if;
  if enabled_param and style_id_param='lilac' then update public.user_styles set enabled=false where user_id=uid and style_id='theme-dark'; end if;
  if enabled_param and style_id_param='theme-dark' then update public.user_styles set enabled=false where user_id=uid and style_id='lilac'; end if;
  update public.user_styles set enabled=enabled_param where user_id=uid and style_id=style_id_param;
end; $$;

create or replace function public.grant_goldframe_if_complete(uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.user_stickers where user_id=uid and copies>0) >= 100 then
    update public.user_styles set unlocked=true where user_id=uid and style_id='goldframe';
  end if;
end; $$;

create or replace function public.on_sticker_inventory_changed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.grant_goldframe_if_complete(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end; $$;

drop trigger if exists user_stickers_grant_goldframe on public.user_stickers;
create trigger user_stickers_grant_goldframe
after insert or update of copies on public.user_stickers
for each row execute function public.on_sticker_inventory_changed();

-- New sign-ups receive every style row.  Daily rewards unlock only the first
-- five; story is automatic at completion and gold is the album reward.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nick, avatar_emoji, mural_opt_in)
  values (new.id, coalesce(new.raw_user_meta_data->>'nick','Colecionadora'), '🌸',
    coalesce((new.raw_user_meta_data->>'mural_opt_in')::boolean, false));
  insert into public.user_styles (user_id, style_id, unlocked, enabled) values
    (new.id,'lilac',false,false),(new.id,'avatar-neon-frame',false,false),
    (new.id,'new-icon',false,false),(new.id,'theme-dark',false,false),
    (new.id,'glitter',false,false),(new.id,'story-layout',false,false),
    (new.id,'goldframe',false,false);
  return new;
end; $$;

-- Compatibility for deployed clients; expire_donations must be invoked by a
-- scheduled service-role job, never by a browser.
create or replace function public.claim_donation(code_param text) returns jsonb language sql security definer set search_path=public as $$ select public.redeem_donation(code_param); $$;

create or replace function public.get_user_mural_rank(user_id_param uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  user_rank integer;
begin
  with ranked_mural as (
    select p.id,
      row_number() over (
        order by 
          count(distinct us.sticker_number) filter (where us.copies > 0) desc,
          coalesce((select count(*) from public.quiz_answers qa where qa.user_id = p.id and qa.correct = true), 0) desc,
          count(distinct us.sticker_number) filter (where us.copies > 0 and us.is_rare) desc,
          p.created_at asc
      ) as rnk
    from public.profiles p
    left join public.user_stickers us on us.user_id = p.id
    where p.mural_opt_in
    group by p.id
  )
  select rnk into user_rank from ranked_mural where id = user_id_param;
  return user_rank;
end; $$;

create or replace function public.delete_user_account()
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Unauthorized'; end if;
  delete from auth.users where id = uid;
end; $$;

-- Safe pg_cron setup for automatic donations expiration
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('expire-donations-every-hour');
    perform cron.schedule('expire-donations-every-hour', '0 * * * *', 'select public.expire_donations()');
  end if;
exception when others then
  -- Ignore pg_cron scheduling if cron extension or schema is not accessible
end; $$;

revoke all on function public.get_public_album(uuid), public.get_public_mural(), public.claim_daily_element(), public.toggle_style(text,boolean), public.grant_goldframe_if_complete(uuid), public.expire_donations(), public.get_user_mural_rank(uuid), public.delete_user_account() from public;
grant execute on function public.get_public_album(uuid), public.get_public_mural(), public.claim_daily_element(), public.toggle_style(text,boolean), public.claim_donation(text), public.get_user_mural_rank(uuid) to anon, authenticated;
grant execute on function public.delete_user_account() to authenticated;
grant execute on function public.expire_donations() to service_role;
