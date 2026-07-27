-- Temporary promotional code:
--   * five random stickers from the 194..319 pool;
--   * one redemption per user (enforced by reward_grants);
--   * valid from migration execution until 32 hours later.
-- Existing permanent codes keep null windows and are not affected.

begin;

alter table public.redeem_codes
  add column if not exists available_from timestamptz,
  add column if not exists available_until timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.redeem_codes'::regclass
      and conname = 'redeem_codes_valid_window'
  ) then
    alter table public.redeem_codes
      add constraint redeem_codes_valid_window
      check (
        available_from is null
        or available_until is null
        or available_until > available_from
      );
  end if;
end
$$;

create or replace function public.redeem_code(code_param text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(btrim(code_param));
  v_code_row public.redeem_codes%rowtype;
begin
  if v_uid is null then
    raise exception 'Não autorizado.';
  end if;

  select *
  into v_code_row
  from public.redeem_codes
  where code = v_code
    and active = true;

  if not found then
    raise exception 'Código inválido ou desativado.';
  end if;

  if v_code_row.available_from is not null
     and now() < v_code_row.available_from then
    raise exception 'Este código ainda não está disponível.';
  end if;

  if v_code_row.available_until is not null
     and now() >= v_code_row.available_until then
    raise exception 'Este código promocional expirou.';
  end if;

  if exists (
    select 1
    from public.reward_grants
    where user_id = v_uid
      and reward_key = 'code_' || v_code
  ) then
    raise exception 'Você já usou este código.';
  end if;

  if v_code_row.grant_all_pool then
    return public.redeem_exact_code(v_code);
  end if;

  return public.redeem_code_legacy(v_code);
end;
$$;

revoke all on function public.redeem_code(text) from public, anon;
grant execute on function public.redeem_code(text) to authenticated;

do $$
begin
  if exists (
    select 1
    from public.redeem_codes
    where code = 'V7R2M9Q4'
  ) then
    raise exception 'O código V7R2M9Q4 já existe; criação cancelada.';
  end if;
end
$$;

insert into public.redeem_codes (
  code,
  label,
  element,
  active,
  release_day,
  max_redemptions,
  grant_all_pool,
  copies_per_sticker,
  available_from,
  available_until
)
values (
  'V7R2M9Q4',
  'Pacote temporário — 5 figurinhas entre 194 e 319',
  null,
  true,
  1,
  null,
  false,
  1,
  now(),
  now() + interval '32 hours'
);

insert into public.redeem_pools (code, sticker_number)
select 'V7R2M9Q4', s.number
from public.stickers s
where s.number between 194 and 319;

do $$
declare
  v_pool_count integer;
begin
  select count(*)
  into v_pool_count
  from public.redeem_pools
  where code = 'V7R2M9Q4'
    and sticker_number between 194 and 319;

  if v_pool_count < 5 then
    raise exception
      'Código V7R2M9Q4 não possui figurinhas suficientes no pool: %.',
      v_pool_count;
  end if;

  if exists (
    select 1
    from public.redeem_pools
    where code = 'V7R2M9Q4'
      and sticker_number not between 194 and 319
  ) then
    raise exception 'Código V7R2M9Q4 contém figurinha fora do intervalo permitido.';
  end if;
end
$$;

notify pgrst, 'reload schema';

commit;

select
  code,
  label,
  active,
  available_from,
  available_until,
  extract(epoch from (available_until - available_from)) / 3600 as validade_horas,
  (
    select count(*)
    from public.redeem_pools rp
    where rp.code = rc.code
  ) as tamanho_pool
from public.redeem_codes rc
where code = 'V7R2M9Q4';
