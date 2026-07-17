-- Keep the exact reward claimed each day so the Home card can show it after
-- the claim and after a page reload.
alter table public.daily_claims
  add column if not exists style_id text;

create or replace function public.claim_daily_element()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  today text := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD');
  reward text;
begin
  if uid is null then raise exception 'Unauthorized'; end if;

  if exists (select 1 from public.daily_claims where user_id = uid and day = today) then
    raise exception 'Já resgatado hoje. Volte amanhã para mais!';
  end if;

  select style_id into reward
  from public.user_styles
  where user_id = uid
    and style_id in ('lilac', 'avatar-neon-frame', 'new-icon', 'theme-dark', 'glitter')
    and not unlocked
  order by array_position(
    array['lilac', 'avatar-neon-frame', 'new-icon', 'theme-dark', 'glitter'],
    style_id
  )
  limit 1;

  if reward is null then
    raise exception 'Todos os elementos já foram resgatados! Em breve traremos novos estilos para você desbloquear';
  end if;

  insert into public.daily_claims(user_id, day, style_id) values(uid, today, reward);
  update public.user_styles set unlocked = true where user_id = uid and style_id = reward;

  return jsonb_build_object(
    'claimed', true,
    'unlocked', true,
    'style', jsonb_build_object('id', reward)
  );
end;
$$;

revoke all on function public.claim_daily_element() from public;
grant execute on function public.claim_daily_element() to authenticated;
