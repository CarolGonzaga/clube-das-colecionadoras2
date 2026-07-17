-- Rode este patch no SQL Editor do Supabase V2 para que as missoes de clique
-- continuem ativas, mas sorteiem somente figurinhas comuns de 21 a 100.

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

grant execute on function public.complete_mission(text) to authenticated;
