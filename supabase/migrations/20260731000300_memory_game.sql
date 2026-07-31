-- Jogo da Memoria: catalogo privado, sessoes persistentes e recompensa global.
-- A feature flag nasce desligada. Nenhuma conta e autorizada por esta migration.
begin;

create table if not exists public.memory_game_stickers (
  id integer primary key check (id between 361 and 427),
  front_image_path text not null unique,
  back_image_path text not null default '/verso-card.webp',
  is_active boolean not null default true,
  allowed_game_keys text[] not null default array['memory_game']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.memory_game_stickers (id, front_image_path) values
  (361, '/covers-jogos/o-despertar-do-desejo.jpg'),
  (362, '/covers-jogos/na-orbita-do-amor.jpg'),
  (363, '/covers-jogos/como-reconquistar-uma-nerd.jpg'),
  (364, '/covers-jogos/so-mais-um-poema-epico-de-amor.jpg'),
  (365, '/covers-jogos/o-diabo-veste-cor-de-rosa.jpg'),
  (366, '/covers-jogos/uma-pitada-de-sorte.jpg'),
  (367, '/covers-jogos/a-namorada-do-meu-primo.jpg'),
  (368, '/covers-jogos/alguem-que-te-faz-sorrir.jpg'),
  (369, '/covers-jogos/gap-a-teoria-rosa.jpg'),
  (370, '/covers-jogos/sombras-e-luzes-de-nos.jpg'),
  (371, '/covers-jogos/tipo-flores-e-unicornios.jpg'),
  (372, '/covers-jogos/presa-em-voce.jpg'),
  (373, '/covers-jogos/mau-agouro.jpg'),
  (374, '/covers-jogos/terapia-bar.jpg'),
  (375, '/covers-jogos/tudo-o-que-eu-sei-sobre-amar.jpg'),
  (376, '/covers-jogos/as-cegas-com-voce.jpg'),
  (377, '/covers-jogos/os-fantasmas-entre-nos.jpg'),
  (378, '/covers-jogos/duologia-boreal.jpg'),
  (379, '/covers-jogos/me-apaixonei-pela-vila.jpg'),
  (380, '/covers-jogos/seu-pequeno-segredo.jpg'),
  (381, '/covers-jogos/classe-309.jpg'),
  (382, '/covers-jogos/charlotte-delamori.jpg'),
  (383, '/covers-jogos/amor-expresso.jpg'),
  (384, '/covers-jogos/itinerario-do-tempo.jpg'),
  (385, '/covers-jogos/amor-em-12-meses-sem-juros.jpg'),
  (386, '/covers-jogos/mastermind.jpg'),
  (387, '/covers-jogos/amora.jpg'),
  (388, '/covers-jogos/oitavo-andar.jpg'),
  (389, '/covers-jogos/flores-me-lembram-voce.jpg'),
  (390, '/covers-jogos/minha-experiencia-lesbica-com-a-solidao.jpg'),
  (391, '/covers-jogos/alda.jpg'),
  (392, '/covers-jogos/minha-querida-escuridao.jpg'),
  (393, '/covers-jogos/dias-de-princesa.jpg'),
  (394, '/covers-jogos/data-venia.jpg'),
  (395, '/covers-jogos/como-nao-ressuscitar-uma-ex-namorada-morta.jpg'),
  (396, '/covers-jogos/olhe-para-mim.jpg'),
  (397, '/covers-jogos/so-para-os-fortes-de-coracao.jpg'),
  (398, '/covers-jogos/coisas-incriveis-acontecem.jpg'),
  (399, '/covers-jogos/if-true-o-codigo-da-atracao.jpg'),
  (400, '/covers-jogos/selfie-sem-filtro.jpg'),
  (401, '/covers-jogos/traicoeiro.jpg'),
  (402, '/covers-jogos/seis-e-demais.jpg'),
  (403, '/covers-jogos/voce-nao-e-minha.jpg'),
  (404, '/covers-jogos/ate-logo-violeta.jpg'),
  (405, '/covers-jogos/o-sim-das-nossas-vidas.jpg'),
  (406, '/covers-jogos/meus-dias-na-vila-das-gaivotas.jpg'),
  (407, '/covers-jogos/capitulo-extra-virando-o-jogo.jpg'),
  (408, '/covers-jogos/entre-estantes.jpg'),
  (409, '/covers-jogos/trevos-do-destino.jpg'),
  (410, '/covers-jogos/o-ultimo-voo.jpg'),
  (411, '/covers-jogos/hexagono-memorias-de-seis-vidas-entrelacadas.jpg'),
  (412, '/covers-jogos/vestigios-de-uma-tempestade.jpg'),
  (413, '/covers-jogos/na-ponta-dos-dedos.jpg'),
  (414, '/covers-jogos/nada-convencional.jpg'),
  (415, '/covers-jogos/a-espada-de-oleandro.jpg'),
  (416, '/covers-jogos/bali-encontre-a-luz.jpg'),
  (417, '/covers-jogos/terra-47-a-sobrevivente.jpg'),
  (418, '/covers-jogos/6-am-a-hora-mais-curta.jpg'),
  (419, '/covers-jogos/angra-sempre-houve-algo-sobre-ela.jpg'),
  (420, '/covers-jogos/unbreakable.jpg'),
  (421, '/covers-jogos/twister.jpg'),
  (422, '/covers-jogos/se-permitindo-amar.jpg'),
  (423, '/covers-jogos/o-caso-daphne-fontaine.jpg'),
  (424, '/covers-jogos/como-se-fosse-fanfic.jpg'),
  (425, '/covers-jogos/boa-sorte-querida.jpg'),
  (426, '/covers-jogos/a-vinganca-do-cupido.jpg'),
  (427, '/covers-jogos/inefavel-uma-paixao-inesquecivel.jpg')
on conflict (id) do update set front_image_path = excluded.front_image_path;

create table if not exists public.memory_game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null default 'memory_game' check (game_key = 'memory_game'),
  local_date date not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  total_pairs integer not null check (total_pairs in (6, 8, 12)),
  matched_pairs integer not null default 0 check (matched_pairs >= 0 and matched_pairs <= total_pairs),
  status text not null default 'in_progress' check (status in ('in_progress','won','claimed','abandoned')),
  algorithm_version text not null default 'memory-game-v1',
  started_at timestamptz not null default now(),
  won_at timestamptz,
  claimed_at timestamptz,
  abandoned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists memory_game_one_active_per_user
  on public.memory_game_sessions(user_id) where status in ('in_progress','won');
create index if not exists memory_game_sessions_user_date_idx
  on public.memory_game_sessions(user_id, local_date desc);

create table if not exists public.memory_game_cards (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.memory_game_sessions(id) on delete cascade,
  card_instance_id uuid not null default gen_random_uuid(),
  source_sticker_id integer not null references public.memory_game_stickers(id) on delete restrict,
  pair_key uuid not null,
  board_position integer not null check (board_position >= 0 and board_position < 24),
  matched_at timestamptz,
  created_at timestamptz not null default now(),
  unique(session_id, board_position),
  unique(session_id, card_instance_id)
);
create index if not exists memory_game_cards_session_idx on public.memory_game_cards(session_id);

insert into public.game_settings(key, value, description) values
  ('memory_game_enabled', 'false'::jsonb, 'Desliga ou liga globalmente o Jogo da Memoria.')
on conflict (key) do nothing;

-- daily_game_rewards e global entre jogos; a sessao e validada pela RPC compartilhada.
alter table public.daily_game_rewards drop constraint if exists daily_game_rewards_session_id_fkey;

alter table public.memory_game_stickers enable row level security;
alter table public.memory_game_sessions enable row level security;
alter table public.memory_game_cards enable row level security;
revoke all on table public.memory_game_stickers, public.memory_game_sessions, public.memory_game_cards
  from public, anon, authenticated;
grant all on table public.memory_game_stickers, public.memory_game_sessions, public.memory_game_cards
  to service_role;

create or replace function public.start_memory_game(
  p_user_id uuid, p_difficulty text, p_session_id uuid default gen_random_uuid()
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_pairs integer;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_active uuid;
begin
  if p_user_id is null or p_difficulty not in ('easy','medium','hard') then raise exception 'Dados invalidos.'; end if;
  if not exists(select 1 from public.game_settings where key='memory_game_enabled' and value='true'::jsonb)
     or not exists(select 1 from public.game_access_grants where user_id=p_user_id and game_key='memory_game' and is_active and revoked_at is null)
  then raise exception 'Este recurso nao esta disponivel para sua conta no momento.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':memory-game', 0));
  select id into v_active from public.memory_game_sessions where user_id=p_user_id and status in ('in_progress','won') limit 1;
  if found then return v_active; end if;
  v_pairs := case p_difficulty when 'easy' then 6 when 'medium' then 8 else 12 end;
  if (select count(*) from public.memory_game_stickers where is_active and 'memory_game'=any(allowed_game_keys)) < v_pairs
  then raise exception 'Nao foi possivel preparar a partida agora.'; end if;
  insert into public.memory_game_sessions(id,user_id,local_date,difficulty,total_pairs)
  values(p_session_id,p_user_id,v_today,p_difficulty,v_pairs);
  with chosen as (
    select id, gen_random_uuid() pair_key from public.memory_game_stickers
    where is_active and 'memory_game'=any(allowed_game_keys) order by random() limit v_pairs
  ), doubled as (
    select id, pair_key from chosen cross join generate_series(1,2)
  ), shuffled as (
    select id, pair_key, row_number() over(order by random())-1 pos from doubled
  )
  insert into public.memory_game_cards(session_id,source_sticker_id,pair_key,board_position)
  select p_session_id,id,pair_key,pos from shuffled;
  return p_session_id;
end $$;

create or replace function public.compare_memory_cards(
  p_user_id uuid, p_session_id uuid, p_first_card uuid, p_second_card uuid
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_session public.memory_game_sessions%rowtype; v_first public.memory_game_cards%rowtype;
  v_second public.memory_game_cards%rowtype; v_match boolean; v_now timestamptz:=now(); v_count integer;
begin
  if p_first_card=p_second_card then raise exception 'Escolha duas cartas diferentes.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_session_id::text || ':compare',0));
  select * into v_session from public.memory_game_sessions where id=p_session_id and user_id=p_user_id for update;
  if not found or v_session.status<>'in_progress' then raise exception 'Esta partida nao aceita novas jogadas.'; end if;
  select * into v_first from public.memory_game_cards where session_id=p_session_id and card_instance_id=p_first_card;
  if not found or v_first.matched_at is not null then raise exception 'Carta invalida.'; end if;
  select * into v_second from public.memory_game_cards where session_id=p_session_id and card_instance_id=p_second_card;
  if not found or v_second.matched_at is not null then raise exception 'Carta invalida.'; end if;
  v_match := v_first.pair_key=v_second.pair_key;
  if v_match then
    update public.memory_game_cards set matched_at=v_now where session_id=p_session_id and id in(v_first.id,v_second.id) and matched_at is null;
    select count(distinct pair_key) into v_count from public.memory_game_cards where session_id=p_session_id and matched_at is not null;
    update public.memory_game_sessions set matched_pairs=v_count,status=case when v_count=total_pairs then 'won' else 'in_progress' end,
      won_at=case when v_count=total_pairs then v_now else won_at end,updated_at=v_now where id=p_session_id;
  else v_count:=v_session.matched_pairs; end if;
  return jsonb_build_object('matched',v_match,'matchedPairs',v_count,'won',v_match and v_count=v_session.total_pairs);
end $$;

-- Funcao unica de recompensa. O cliente nunca informa o numero da figurinha.
create or replace function public.claim_daily_game_reward(
  p_user_id uuid, p_game_key text, p_session_id uuid,
  p_random_bucket double precision default null, p_random_pick double precision default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_today date:=(now() at time zone 'America/Sao_Paulo')::date; v_existing public.daily_game_rewards%rowtype;
  v_valid integer[]; v_owned integer[]; v_missing integer[]; v_candidates integer[]; v_rares integer[]:=array[28,45,47,79,112,164,167];
  v_number integer; v_result text; v_is_rare boolean:=false; v_prev_rare boolean:=false;
  v_bucket double precision:=coalesce(p_random_bucket,random()); v_pick double precision:=coalesce(p_random_pick,random()); v_was_new boolean;
begin
  if p_game_key not in ('word_search','memory_game') then raise exception 'Jogo invalido.'; end if;
  if not exists(select 1 from public.game_settings where key=p_game_key||'_enabled' and value='true'::jsonb)
     or not exists(select 1 from public.game_access_grants where user_id=p_user_id and game_key=p_game_key and is_active and revoked_at is null)
  then raise exception 'Este recurso nao esta disponivel para sua conta no momento.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text||':daily-games',0));
  select * into v_existing from public.daily_game_rewards where user_id=p_user_id and reward_date=v_today;
  if found then return jsonb_build_object('success',true,'idempotent',true,'number',v_existing.sticker_number,'wasNew',v_existing.result_type='new','isRare',v_existing.is_rare,'resultType',v_existing.result_type); end if;
  if p_game_key='word_search' then
    if not exists(select 1 from public.word_search_sessions where id=p_session_id and user_id=p_user_id and status='won' and found_words=total_words for update)
    then raise exception 'Venca a partida antes de resgatar a recompensa.'; end if;
  else
    if not exists(select 1 from public.memory_game_sessions where id=p_session_id and user_id=p_user_id and status='won' and matched_pairs=total_pairs for update)
    then raise exception 'Venca a partida antes de resgatar a recompensa.'; end if;
  end if;
  select coalesce(array_agg(number order by number),'{}') into v_valid from public.stickers where number between 21 and 193;
  select coalesce(array_agg(n order by n),'{}') into v_owned from unnest(v_valid)n where exists(select 1 from public.user_stickers u where u.user_id=p_user_id and u.sticker_number=n and u.copies>0);
  select coalesce(array_agg(n order by n),'{}') into v_missing from unnest(v_valid)n where not(n=any(v_owned));
  select coalesce((select is_rare from public.daily_game_rewards where user_id=p_user_id order by reward_date desc,created_at desc limit 1),false) into v_prev_rare;
  if cardinality(v_missing)>0 then
    if cardinality(v_owned)=0 or v_bucket<.60 then v_candidates:=v_missing; v_result:='new'; else v_candidates:=v_owned; v_result:='duplicate'; end if;
  else
    v_result:='completed_collection_bonus';
    if not v_prev_rare and v_bucket<coalesce((select (value#>>'{}')::double precision from public.game_settings where key='completed_collection_rare_probability'),.70)
    then v_candidates:=array(select n from unnest(v_rares)n where n=any(v_valid)); v_is_rare:=cardinality(v_candidates)>0; end if;
    if cardinality(coalesce(v_candidates,'{}'))=0 then v_candidates:=array(select n from unnest(v_valid)n where not(n=any(v_rares))); v_is_rare:=false; end if;
  end if;
  v_number:=v_candidates[least(cardinality(v_candidates),floor(greatest(0,least(v_pick,.999999999))*cardinality(v_candidates))::integer+1)];
  v_was_new:=not exists(select 1 from public.user_stickers where user_id=p_user_id and sticker_number=v_number and copies>0);
  insert into public.user_stickers(user_id,sticker_number,copies,is_rare,first_unlocked_at) values(p_user_id,v_number,1,v_is_rare,now())
    on conflict(user_id,sticker_number) do update set copies=public.user_stickers.copies+1,is_rare=public.user_stickers.is_rare or excluded.is_rare;
  insert into public.daily_game_rewards(user_id,reward_date,game_key,session_id,sticker_number,result_type,is_rare,rare_bonus_applied,missing_pool_size,owned_pool_size)
    values(p_user_id,v_today,p_game_key,p_session_id,v_number,v_result,v_is_rare,v_is_rare,cardinality(v_missing),cardinality(v_owned));
  if p_game_key='word_search' then update public.word_search_sessions set status='claimed',claimed_at=now(),updated_at=now() where id=p_session_id;
  else update public.memory_game_sessions set status='claimed',claimed_at=now(),updated_at=now() where id=p_session_id; end if;
  perform public.check_and_grant_rewards(p_user_id);
  return jsonb_build_object('success',true,'idempotent',false,'number',v_number,'wasNew',v_was_new,'isRare',v_is_rare,'resultType',v_result);
end $$;

create or replace function public.claim_word_search_reward(p_user_id uuid,p_session_id uuid,p_random_bucket double precision default null,p_random_pick double precision default null)
returns jsonb language sql security definer set search_path=public as $$ select public.claim_daily_game_reward(p_user_id,'word_search',p_session_id,p_random_bucket,p_random_pick) $$;

revoke all on function public.start_memory_game(uuid,text,uuid), public.compare_memory_cards(uuid,uuid,uuid,uuid),
 public.claim_daily_game_reward(uuid,text,uuid,double precision,double precision) from public,anon,authenticated;
grant execute on function public.start_memory_game(uuid,text,uuid), public.compare_memory_cards(uuid,uuid,uuid,uuid),
 public.claim_daily_game_reward(uuid,text,uuid,double precision,double precision) to service_role;

notify pgrst, 'reload schema';
commit;
