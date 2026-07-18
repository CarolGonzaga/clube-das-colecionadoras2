-- Create missing tables that exist in schema.sql but were never in a migration.
-- This ensures the production database has these tables.

-- 1) reward_grants table (progression achievements)
create table if not exists public.reward_grants (
  user_id uuid references public.profiles(id) on delete cascade,
  reward_key text not null,
  granted_at timestamptz default now(),
  primary key (user_id, reward_key)
);

alter table public.reward_grants enable row level security;

drop policy if exists "Allow users to view own reward grants" on public.reward_grants;
create policy "Allow users to view own reward grants"
  on public.reward_grants for select
  using (auth.uid() = user_id);

-- 2) completed_tags table (tag families completed)
create table if not exists public.completed_tags (
  user_id uuid references public.profiles(id) on delete cascade,
  tag_name text not null,
  completed_at timestamptz default now(),
  primary key (user_id, tag_name)
);

alter table public.completed_tags enable row level security;

drop policy if exists "Allow users to view own completed tags" on public.completed_tags;
create policy "Allow users to view own completed tags"
  on public.completed_tags for select
  using (auth.uid() = user_id);

-- 3) Patch redeem_donation to handle missing reward_grants gracefully.
-- Wraps the progression check in a BEGIN/EXCEPTION block so that even if
-- check_and_grant_rewards fails, the donation is still redeemed successfully.
create or replace function public.redeem_donation(code_param text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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

  -- Get donation row
  select * into donation_row from public.donations where code = code_clean;
  if not found then
    raise exception 'Código inválido.';
  end if;

  if donation_row.status <> 'active' then
    raise exception 'Esse código de doação já foi usado ou expirou.';
  end if;

  -- Check expiry
  if now() > donation_row.expires_at then
    update public.donations set status = 'expired' where code = code_clean;
    insert into public.user_stickers (user_id, sticker_number, copies, is_rare, first_unlocked_at)
    values (donation_row.from_user, donation_row.sticker_number, 1, false, now())
    on conflict (user_id, sticker_number) do update set copies = public.user_stickers.copies + 1;
    raise exception 'Código de doação expirado.';
  end if;

  -- Prevent self-claiming
  if donation_row.from_user = user_id_param then
    raise exception 'Você não pode resgatar seu próprio código 😅';
  end if;

  -- Consume donation: mark as used and record recipient
  update public.donations
  set status = 'used', to_user = user_id_param
  where code = code_clean;

  -- Map sticker number to slug
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

  -- Add sticker to recipient's inventory
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

  -- Safely attempt progression check (won't break donation if reward_grants or
  -- check_and_grant_rewards is unavailable or throws an error)
  begin
    progression_reveals := public.check_and_grant_rewards(user_id_param);
    reveals := reveals || progression_reveals;
  exception when others then
    -- silently skip progression rewards if function fails
    null;
  end;

  return jsonb_build_object(
    'success', true,
    'reveals', reveals
  );
end;
$$;

grant execute on function public.redeem_donation(text) to authenticated;
