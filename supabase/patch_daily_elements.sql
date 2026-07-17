-- Rode este patch no SQL Editor do Supabase V2 para manter o Elemento do Dia:
-- 1 resgate por dia, 5 elementos no total.

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

grant execute on function public.claim_daily_element() to authenticated;
