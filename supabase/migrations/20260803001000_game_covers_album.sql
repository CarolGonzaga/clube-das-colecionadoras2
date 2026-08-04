-- Album de capas conquistadas nos jogos.
begin;

create table if not exists public.user_game_stickers (
  user_id uuid not null references auth.users(id) on delete cascade,
  sticker_id integer not null references public.memory_game_stickers(id) on delete restrict,
  source_game text not null check (source_game in ('memory_game','puzzle_game','cover_guesser')),
  first_unlocked_at timestamptz not null default now(),
  primary key (user_id, sticker_id)
);
create index if not exists user_game_stickers_user_idx
  on public.user_game_stickers(user_id, first_unlocked_at desc);

alter table public.user_game_stickers enable row level security;
revoke all on table public.user_game_stickers from public,anon,authenticated;
grant all on table public.user_game_stickers to service_role;

create or replace function public.grant_game_album_covers()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.status <> 'won' and new.status = 'won' then
    if tg_table_name = 'memory_game_sessions' then
      insert into public.user_game_stickers(user_id,sticker_id,source_game)
      select new.user_id,card.source_sticker_id,'memory_game'
      from public.memory_game_cards card where card.session_id=new.id
      group by card.source_sticker_id
      on conflict (user_id,sticker_id) do nothing;
    elsif tg_table_name = 'puzzle_game_sessions' then
      insert into public.user_game_stickers(user_id,sticker_id,source_game)
      values(new.user_id,new.sticker_id,'puzzle_game')
      on conflict (user_id,sticker_id) do nothing;
    elsif tg_table_name = 'cover_guesser_sessions' then
      insert into public.user_game_stickers(user_id,sticker_id,source_game)
      values(new.user_id,new.sticker_id,'cover_guesser')
      on conflict (user_id,sticker_id) do nothing;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists memory_game_album_covers on public.memory_game_sessions;
create trigger memory_game_album_covers after update of status on public.memory_game_sessions
for each row execute function public.grant_game_album_covers();
drop trigger if exists puzzle_game_album_covers on public.puzzle_game_sessions;
create trigger puzzle_game_album_covers after update of status on public.puzzle_game_sessions
for each row execute function public.grant_game_album_covers();
drop trigger if exists cover_guesser_album_covers on public.cover_guesser_sessions;
create trigger cover_guesser_album_covers after update of status on public.cover_guesser_sessions
for each row execute function public.grant_game_album_covers();

-- Recupera capas de partidas ja vencidas ou resgatadas antes desta migration.
insert into public.user_game_stickers(user_id,sticker_id,source_game,first_unlocked_at)
select session.user_id,card.source_sticker_id,'memory_game',coalesce(session.won_at,session.updated_at)
from public.memory_game_sessions session join public.memory_game_cards card on card.session_id=session.id
where session.status in ('won','claimed')
group by session.user_id,card.source_sticker_id,session.won_at,session.updated_at
on conflict (user_id,sticker_id) do nothing;
insert into public.user_game_stickers(user_id,sticker_id,source_game,first_unlocked_at)
select user_id,sticker_id,'puzzle_game',coalesce(won_at,updated_at)
from public.puzzle_game_sessions where status in ('won','claimed')
on conflict (user_id,sticker_id) do nothing;
insert into public.user_game_stickers(user_id,sticker_id,source_game,first_unlocked_at)
select user_id,sticker_id,'cover_guesser',coalesce(won_at,updated_at)
from public.cover_guesser_sessions where status in ('won','claimed')
on conflict (user_id,sticker_id) do nothing;

revoke all on function public.grant_game_album_covers() from public,anon,authenticated;
grant execute on function public.grant_game_album_covers() to service_role;
commit;
