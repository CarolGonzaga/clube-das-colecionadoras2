const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const sourcePath =
  "C:/Users/Carol/.codex/attachments/190c79b7-326f-47b6-9dc3-c58cfa6fdf8e/pasted-text.txt";
const migrationPath = path.join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "20260720001100_author_exact_redemption_codes.sql",
);
const reportPath = path.join(__dirname, "..", "author_redemption_codes.md");
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const usedCodes = new Set();

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function makeCode(author) {
  const letters = author
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  const prefix = `${letters}XXX`.slice(0, 3);
  const digest = crypto
    .createHash("sha256")
    .update(`CDC-AUTORAS-2026-07-20-V1|${author}`)
    .digest();
  let suffix = "";
  for (let index = 0; index < 5; index += 1) {
    suffix += alphabet[digest[index] % alphabet.length];
  }
  const code = `${prefix}${suffix}`;
  if (usedCodes.has(code)) throw new Error(`Code collision: ${code}`);
  usedCodes.add(code);
  return code;
}

const packages = Object.entries(source).map(([author, stickers]) => ({
  author,
  code: makeCode(author),
  stickers,
}));

const codeValues = packages
  .map(
    ({ author, code }) =>
      `  (${sqlString(code)}, ${sqlString(`Pacote de ${author}`)}, null, true, 1, 2, true)`,
  )
  .join(",\n");
const poolValues = packages
  .flatMap(({ code, stickers }) =>
    stickers.map(({ number }) => `  (${sqlString(code)}, ${number})`),
  )
  .join(",\n");
const codeList = packages.map(({ code }) => sqlString(code)).join(", ");

const migration = `-- Pacotes exatos e exclusivos para autoras.
-- Cada codigo pode ser usado por no maximo duas contas e apenas uma vez por conta.

alter table public.redeem_codes
  add column if not exists label text,
  add column if not exists max_redemptions integer,
  add column if not exists grant_all_pool boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.redeem_codes'::regclass
      and conname = 'redeem_codes_max_redemptions_positive'
  ) then
    alter table public.redeem_codes
      add constraint redeem_codes_max_redemptions_positive
      check (max_redemptions is null or max_redemptions > 0);
  end if;
end;
$$;

create index if not exists reward_grants_reward_key_idx
  on public.reward_grants (reward_key);

-- Guarda a implementacao promocional atual e coloca um roteador no RPC publico.
do $$
begin
  if to_regprocedure('public.redeem_code_legacy(text)') is null then
    alter function public.redeem_code(text) rename to redeem_code_legacy;
  end if;
end;
$$;

revoke all on function public.redeem_code_legacy(text)
from public, anon, authenticated;

create or replace function public.redeem_exact_code(code_param text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id_param uuid := auth.uid();
  code_clean text := upper(btrim(code_param));
  code_row public.redeem_codes%rowtype;
  pool_numbers integer[];
  target_number integer;
  target_slug text;
  was_new boolean;
  redemption_count integer;
  reveals jsonb := '[]'::jsonb;
  progression_reveals jsonb := '[]'::jsonb;
  release_date_str text;
  release_date_val timestamptz;
  days_elapsed integer;
begin
  if user_id_param is null then
    raise exception 'Não autorizado.';
  end if;

  select * into code_row
  from public.redeem_codes
  where code = code_clean
    and active = true
    and grant_all_pool = true
  for update;

  if not found then
    raise exception 'Código inválido.';
  end if;

  select value into release_date_str
  from public.app_settings
  where key = 'release_date';

  if release_date_str is null then
    release_date_val := '2026-07-02 00:00:00+00'::timestamptz;
  else
    release_date_val := (release_date_str || ' 00:00:00+00')::timestamptz;
  end if;

  days_elapsed := floor(extract(epoch from (now() - release_date_val)) / 86400)::integer + 1;
  if days_elapsed < code_row.release_day then
    raise exception 'Este código promocional ainda não está ativo.';
  end if;

  if exists (
    select 1
    from public.reward_grants
    where user_id = user_id_param
      and reward_key = 'code_' || code_clean
  ) then
    raise exception 'Você já usou esse código.';
  end if;

  select count(*) into redemption_count
  from public.reward_grants
  where reward_key = 'code_' || code_clean;

  if code_row.max_redemptions is not null
    and redemption_count >= code_row.max_redemptions then
    raise exception 'Este código atingiu o limite de resgates.';
  end if;

  select array_agg(sticker_number order by sticker_number)
  into pool_numbers
  from public.redeem_pools
  where code = code_clean;

  if pool_numbers is null or cardinality(pool_numbers) = 0 then
    raise exception 'Pacote do código vazio.';
  end if;

  insert into public.reward_grants (user_id, reward_key, granted_at)
  values (user_id_param, 'code_' || code_clean, now());

  foreach target_number in array pool_numbers loop
    select coalesce(s.slug, 'frase-' || target_number)
    into target_slug
    from public.stickers s
    where s.number = target_number;

    if target_slug is null then
      raise exception 'Figurinha % não encontrada.', target_number;
    end if;

    select not exists (
      select 1
      from public.user_stickers us
      where us.user_id = user_id_param
        and us.sticker_number = target_number
        and us.copies > 0
    ) into was_new;

    insert into public.user_stickers (
      user_id,
      sticker_number,
      copies,
      is_rare,
      first_unlocked_at
    )
    values (user_id_param, target_number, 1, false, now())
    on conflict (user_id, sticker_number) do update set
      copies = public.user_stickers.copies + 1;

    reveals := reveals || jsonb_build_array(jsonb_build_object(
      'slug', target_slug,
      'number', target_number,
      'wasNew', was_new,
      'isRare', false,
      'repeat', not was_new,
      'reward', null
    ));
  end loop;

  progression_reveals := coalesce(public.check_and_grant_rewards(user_id_param), '[]'::jsonb);
  if jsonb_typeof(progression_reveals) = 'array' then
    reveals := reveals || progression_reveals;
  end if;

  return jsonb_build_object(
    'success', true,
    'reveals', reveals,
    'element', code_row.element
  );
end;
$$;

revoke all on function public.redeem_exact_code(text)
from public, anon, authenticated;

create or replace function public.redeem_code(code_param text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  code_clean text := upper(btrim(code_param));
begin
  if exists (
    select 1
    from public.redeem_codes
    where code = code_clean
      and active = true
      and grant_all_pool = true
  ) then
    return public.redeem_exact_code(code_clean);
  end if;

  return public.redeem_code_legacy(code_clean);
end;
$$;

revoke all on function public.redeem_code(text) from public, anon;
grant execute on function public.redeem_code(text) to authenticated;

insert into public.redeem_codes (
  code,
  label,
  element,
  active,
  release_day,
  max_redemptions,
  grant_all_pool
)
values
${codeValues}
on conflict (code) do update set
  label = excluded.label,
  element = excluded.element,
  active = excluded.active,
  release_day = excluded.release_day,
  max_redemptions = excluded.max_redemptions,
  grant_all_pool = excluded.grant_all_pool;

delete from public.redeem_pools
where code in (${codeList});

insert into public.redeem_pools (code, sticker_number)
values
${poolValues};
`;

const reportRows = packages
  .map(({ author, code, stickers }) => {
    const contents = stickers
      .map(({ number, name }) => `${number} — ${name.replace(/\|/g, "\\|")}`)
      .join("<br>");
    return `| ${author.replace(/\|/g, "\\|")} | \`${code}\` | ${contents} |`;
  })
  .join("\n");
const report = `# Códigos exclusivos das autoras

Cada código permite no máximo **2 resgates globais** e apenas **1 resgate por conta**.

| Autora | Código | Conteúdo do pacote |
|---|---|---|
${reportRows}
`;

fs.writeFileSync(migrationPath, migration, "utf8");
fs.writeFileSync(reportPath, report, "utf8");
console.log(`Generated ${packages.length} codes and ${poolValues.split("\n").length} pool entries.`);
