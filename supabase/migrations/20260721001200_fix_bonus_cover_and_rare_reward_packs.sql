-- Corrige a capa pública da figurinha bônus e divide a revelação das 30 raras
-- em seis pacotes persistentes de cinco figurinhas.

update public.stickers
set cover_url = 'card story/extra.jpg'
where number = 360;

alter table public.album_completion_rewards
  add column if not exists packs_opened integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'album_completion_rewards_packs_opened_check'
      and conrelid = 'public.album_completion_rewards'::regclass
  ) then
    alter table public.album_completion_rewards
      add constraint album_completion_rewards_packs_opened_check
      check (packs_opened between 0 and 6);
  end if;
end
$$;

create or replace function public.mark_album_rare_pack_opened()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_packs_opened integer;
begin
  if v_user_id is null then
    raise exception 'Usuária não autenticada.';
  end if;

  update public.album_completion_rewards
  set packs_opened = least(packs_opened + 1, 6)
  where user_id = v_user_id
  returning packs_opened into v_packs_opened;

  if v_packs_opened is null then
    raise exception 'A recompensa das raras ainda não foi resgatada.';
  end if;

  return jsonb_build_object(
    'packs_opened', v_packs_opened,
    'remaining', 6 - v_packs_opened
  );
end;
$$;

revoke all on function public.mark_album_rare_pack_opened() from public;
grant execute on function public.mark_album_rare_pack_opened() to authenticated;

notify pgrst, 'reload schema';
