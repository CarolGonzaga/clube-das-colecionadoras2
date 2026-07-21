-- Pacotes exatos e exclusivos para autoras.
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
  ('ALENQ764', 'Pacote de Alexia', null, true, 1, 2, true),
  ('ANA9UK74', 'Pacote de Ana França', null, true, 1, 2, true),
  ('ANDMFQQE', 'Pacote de Andremis', null, true, 1, 2, true),
  ('ARQA3MTC', 'Pacote de Arquelana', null, true, 1, 2, true),
  ('BIAMKH8B', 'Pacote de Bia Freitas', null, true, 1, 2, true),
  ('BIAGU2L2', 'Pacote de Bia R.D. Ramos', null, true, 1, 2, true),
  ('BREYNH49', 'Pacote de Brenda Borges', null, true, 1, 2, true),
  ('CAR52FLN', 'Pacote de Carol Barra', null, true, 1, 2, true),
  ('CARP2STY', 'Pacote de Carol Cara', null, true, 1, 2, true),
  ('CAR65HDA', 'Pacote de Carol Cara, Liliane Reis', null, true, 1, 2, true),
  ('CARP7L9M', 'Pacote de Carol Rutz', null, true, 1, 2, true),
  ('CLAU9U7H', 'Pacote de Clara Alves', null, true, 1, 2, true),
  ('DBAQ3JVV', 'Pacote de D. Barreto', null, true, 1, 2, true),
  ('DANKZ2RJ', 'Pacote de Danda Odeleci', null, true, 1, 2, true),
  ('DEBT9DZ7', 'Pacote de Debora Carvalho', null, true, 1, 2, true),
  ('DEN55FDK', 'Pacote de Denise Flaibam', null, true, 1, 2, true),
  ('EMEAMSU4', 'Pacote de Emely Luiza Curcio', null, true, 1, 2, true),
  ('ENGDDQTV', 'Pacote de Englantine', null, true, 1, 2, true),
  ('EVYRPRL2', 'Pacote de Evyn Mota', null, true, 1, 2, true),
  ('FERU3G6V', 'Pacote de Fernanda Moser', null, true, 1, 2, true),
  ('GBBXR36A', 'Pacote de G.B. Baldassari', null, true, 1, 2, true),
  ('GIN3UYU5', 'Pacote de Gina Milbradt', null, true, 1, 2, true),
  ('GISXBT25', 'Pacote de Gisele Cerqueira, Hannah Kaiser', null, true, 1, 2, true),
  ('GIUQLVC3', 'Pacote de Giu Nascimento', null, true, 1, 2, true),
  ('GIUX6MN5', 'Pacote de Giu Nascimento, Jús Saraiva, Sol Alessandri,Thaís Berlanga, Luca Vasconcelos, Turí, Sol Braga', null, true, 1, 2, true),
  ('GOLEC99B', 'Pacote de Golden Faery', null, true, 1, 2, true),
  ('GRAVWH3L', 'Pacote de Graziela Santos', null, true, 1, 2, true),
  ('HELCAEX2', 'Pacote de Helena Nolasco', null, true, 1, 2, true),
  ('HELWYDAN', 'Pacote de Helena Nolasco, Milly Ricardo', null, true, 1, 2, true),
  ('IKP4ZPZ7', 'Pacote de I.K. Prado', null, true, 1, 2, true),
  ('INGR4D6W', 'Pacote de Ingrid Paranhos', null, true, 1, 2, true),
  ('ISA52Z2E', 'Pacote de Isabella Pereira', null, true, 1, 2, true),
  ('JESYTLAY', 'Pacote de Jess Lim', null, true, 1, 2, true),
  ('JIAMPQK6', 'Pacote de Jia Monure', null, true, 1, 2, true),
  ('JUMTJCJQ', 'Pacote de Ju Mesquita', null, true, 1, 2, true),
  ('JUL9D7KC', 'Pacote de Jules K. Florian', null, true, 1, 2, true),
  ('JUL8UP78', 'Pacote de Júlia Raimann', null, true, 1, 2, true),
  ('KIMRSSNF', 'Pacote de Kimmcharlie', null, true, 1, 2, true),
  ('LARUPUWS', 'Pacote de Lari Alcantara', null, true, 1, 2, true),
  ('LARXQKEJ', 'Pacote de Larissa Ferrioli', null, true, 1, 2, true),
  ('LIL5W6T2', 'Pacote de Liliane Reis', null, true, 1, 2, true),
  ('LIN56Q96', 'Pacote de Line Cunha', null, true, 1, 2, true),
  ('LISBWJ2G', 'Pacote de Lis Selwyn', null, true, 1, 2, true),
  ('LUIJTL87', 'Pacote de Luisa Landre', null, true, 1, 2, true),
  ('MANABARN', 'Pacote de Mandy Vieira', null, true, 1, 2, true),
  ('MAREWDLY', 'Pacote de Márcia Camargo', null, true, 1, 2, true),
  ('MAR84CVJ', 'Pacote de Mariana Rosa', null, true, 1, 2, true),
  ('MARTCKDA', 'Pacote de Marina Dutra', null, true, 1, 2, true),
  ('MARWEYVR', 'Pacote de Marina Feijóo', null, true, 1, 2, true),
  ('MIL7HEPK', 'Pacote de Milly Ricardo', null, true, 1, 2, true),
  ('NATETP22', 'Pacote de Natalia Avila', null, true, 1, 2, true),
  ('NICRUAM5', 'Pacote de Nicole Oliveira', null, true, 1, 2, true),
  ('RAQ8QRS4', 'Pacote de Raquel Alves', null, true, 1, 2, true),
  ('SARVP5ND', 'Pacote de Sarah Oliveira', null, true, 1, 2, true),
  ('SODYXTRY', 'Pacote de Sodré', null, true, 1, 2, true),
  ('SWYR2856', 'Pacote de Swyanne Rodriguez', null, true, 1, 2, true),
  ('TATQ59ZF', 'Pacote de Tattah Nascimento', null, true, 1, 2, true),
  ('TES5GFJE', 'Pacote de Tessa Reis', null, true, 1, 2, true),
  ('THA8XDFG', 'Pacote de Thaís Boito', null, true, 1, 2, true),
  ('THA4FMDU', 'Pacote de Thais Rodrigues', null, true, 1, 2, true),
  ('TORTKXLA', 'Pacote de Tori Lopes', null, true, 1, 2, true),
  ('VSVF9JEY', 'Pacote de V.S. Vilela', null, true, 1, 2, true),
  ('VANHH8Z6', 'Pacote de Vanessa Freitas', null, true, 1, 2, true),
  ('VICGM363', 'Pacote de Victoria Mendes', null, true, 1, 2, true),
  ('VICH9HSL', 'Pacote de Victoria Moon', null, true, 1, 2, true),
  ('YAS6K63T', 'Pacote de Yasmim Mahmud Kader', null, true, 1, 2, true),
  ('ZEYY9M9C', 'Pacote de Zey Shelsea', null, true, 1, 2, true),
  ('ZEYKT8KS', 'Pacote de Zey Shelsea, Yas Oliveira', null, true, 1, 2, true)
on conflict (code) do update set
  label = excluded.label,
  element = excluded.element,
  active = excluded.active,
  release_day = excluded.release_day,
  max_redemptions = excluded.max_redemptions,
  grant_all_pool = excluded.grant_all_pool;

delete from public.redeem_pools
where code in ('ALENQ764', 'ANA9UK74', 'ANDMFQQE', 'ARQA3MTC', 'BIAMKH8B', 'BIAGU2L2', 'BREYNH49', 'CAR52FLN', 'CARP2STY', 'CAR65HDA', 'CARP7L9M', 'CLAU9U7H', 'DBAQ3JVV', 'DANKZ2RJ', 'DEBT9DZ7', 'DEN55FDK', 'EMEAMSU4', 'ENGDDQTV', 'EVYRPRL2', 'FERU3G6V', 'GBBXR36A', 'GIN3UYU5', 'GISXBT25', 'GIUQLVC3', 'GIUX6MN5', 'GOLEC99B', 'GRAVWH3L', 'HELCAEX2', 'HELWYDAN', 'IKP4ZPZ7', 'INGR4D6W', 'ISA52Z2E', 'JESYTLAY', 'JIAMPQK6', 'JUMTJCJQ', 'JUL9D7KC', 'JUL8UP78', 'KIMRSSNF', 'LARUPUWS', 'LARXQKEJ', 'LIL5W6T2', 'LIN56Q96', 'LISBWJ2G', 'LUIJTL87', 'MANABARN', 'MAREWDLY', 'MAR84CVJ', 'MARTCKDA', 'MARWEYVR', 'MIL7HEPK', 'NATETP22', 'NICRUAM5', 'RAQ8QRS4', 'SARVP5ND', 'SODYXTRY', 'SWYR2856', 'TATQ59ZF', 'TES5GFJE', 'THA8XDFG', 'THA4FMDU', 'TORTKXLA', 'VSVF9JEY', 'VANHH8Z6', 'VICGM363', 'VICH9HSL', 'YAS6K63T', 'ZEYY9M9C', 'ZEYKT8KS');

insert into public.redeem_pools (code, sticker_number)
values
  ('ALENQ764', 223),
  ('ANA9UK74', 266),
  ('ANA9UK74', 309),
  ('ANA9UK74', 312),
  ('ANDMFQQE', 342),
  ('ARQA3MTC', 275),
  ('BIAMKH8B', 216),
  ('BIAGU2L2', 258),
  ('BIAGU2L2', 296),
  ('BREYNH49', 255),
  ('CAR52FLN', 206),
  ('CAR52FLN', 221),
  ('CAR52FLN', 323),
  ('CAR52FLN', 343),
  ('CAR52FLN', 355),
  ('CARP2STY', 260),
  ('CAR65HDA', 210),
  ('CAR65HDA', 291),
  ('CARP7L9M', 226),
  ('CLAU9U7H', 207),
  ('CLAU9U7H', 250),
  ('CLAU9U7H', 259),
  ('CLAU9U7H', 334),
  ('CLAU9U7H', 349),
  ('DBAQ3JVV', 272),
  ('DBAQ3JVV', 288),
  ('DBAQ3JVV', 322),
  ('DBAQ3JVV', 339),
  ('DBAQ3JVV', 352),
  ('DANKZ2RJ', 199),
  ('DANKZ2RJ', 246),
  ('DEBT9DZ7', 203),
  ('DEBT9DZ7', 209),
  ('DEBT9DZ7', 271),
  ('DEN55FDK', 231),
  ('DEN55FDK', 244),
  ('DEN55FDK', 248),
  ('EMEAMSU4', 195),
  ('EMEAMSU4', 239),
  ('EMEAMSU4', 263),
  ('EMEAMSU4', 335),
  ('EMEAMSU4', 346),
  ('ENGDDQTV', 215),
  ('ENGDDQTV', 253),
  ('ENGDDQTV', 273),
  ('EVYRPRL2', 261),
  ('FERU3G6V', 252),
  ('GBBXR36A', 274),
  ('GBBXR36A', 284),
  ('GBBXR36A', 318),
  ('GBBXR36A', 320),
  ('GBBXR36A', 336),
  ('GBBXR36A', 338),
  ('GIN3UYU5', 276),
  ('GISXBT25', 243),
  ('GIUQLVC3', 267),
  ('GIUQLVC3', 321),
  ('GIUX6MN5', 218),
  ('GOLEC99B', 228),
  ('GOLEC99B', 279),
  ('GOLEC99B', 316),
  ('GRAVWH3L', 298),
  ('GRAVWH3L', 351),
  ('HELCAEX2', 285),
  ('HELCAEX2', 299),
  ('HELCAEX2', 308),
  ('HELWYDAN', 241),
  ('IKP4ZPZ7', 217),
  ('IKP4ZPZ7', 289),
  ('INGR4D6W', 197),
  ('INGR4D6W', 282),
  ('ISA52Z2E', 214),
  ('JESYTLAY', 202),
  ('JESYTLAY', 278),
  ('JESYTLAY', 330),
  ('JIAMPQK6', 213),
  ('JUMTJCJQ', 240),
  ('JUL9D7KC', 194),
  ('JUL9D7KC', 283),
  ('JUL8UP78', 310),
  ('KIMRSSNF', 201),
  ('LARUPUWS', 254),
  ('LARUPUWS', 303),
  ('LARXQKEJ', 220),
  ('LIL5W6T2', 196),
  ('LIL5W6T2', 245),
  ('LIL5W6T2', 286),
  ('LIN56Q96', 327),
  ('LIN56Q96', 356),
  ('LIN56Q96', 360),
  ('LISBWJ2G', 222),
  ('LISBWJ2G', 293),
  ('LISBWJ2G', 326),
  ('LISBWJ2G', 359),
  ('LUIJTL87', 219),
  ('LUIJTL87', 229),
  ('LUIJTL87', 301),
  ('LUIJTL87', 328),
  ('LUIJTL87', 344),
  ('MANABARN', 204),
  ('MAREWDLY', 232),
  ('MAREWDLY', 294),
  ('MAR84CVJ', 236),
  ('MAR84CVJ', 287),
  ('MAR84CVJ', 319),
  ('MARTCKDA', 306),
  ('MARTCKDA', 331),
  ('MARTCKDA', 345),
  ('MARWEYVR', 257),
  ('MARWEYVR', 307),
  ('MIL7HEPK', 280),
  ('NATETP22', 297),
  ('NATETP22', 341),
  ('NICRUAM5', 292),
  ('NICRUAM5', 324),
  ('RAQ8QRS4', 233),
  ('RAQ8QRS4', 304),
  ('RAQ8QRS4', 317),
  ('RAQ8QRS4', 332),
  ('RAQ8QRS4', 337),
  ('RAQ8QRS4', 354),
  ('SARVP5ND', 227),
  ('SARVP5ND', 249),
  ('SODYXTRY', 242),
  ('SWYR2856', 224),
  ('SWYR2856', 268),
  ('SWYR2856', 313),
  ('SWYR2856', 325),
  ('SWYR2856', 348),
  ('TATQ59ZF', 247),
  ('TATQ59ZF', 277),
  ('TATQ59ZF', 302),
  ('TATQ59ZF', 357),
  ('TES5GFJE', 200),
  ('TES5GFJE', 269),
  ('TES5GFJE', 295),
  ('TES5GFJE', 300),
  ('TES5GFJE', 314),
  ('THA8XDFG', 311),
  ('THA8XDFG', 340),
  ('THA4FMDU', 235),
  ('THA4FMDU', 305),
  ('THA4FMDU', 333),
  ('THA4FMDU', 347),
  ('THA4FMDU', 358),
  ('TORTKXLA', 208),
  ('TORTKXLA', 230),
  ('TORTKXLA', 265),
  ('VSVF9JEY', 237),
  ('VSVF9JEY', 264),
  ('VSVF9JEY', 329),
  ('VSVF9JEY', 350),
  ('VSVF9JEY', 353),
  ('VANHH8Z6', 262),
  ('VANHH8Z6', 270),
  ('VANHH8Z6', 290),
  ('VICGM363', 238),
  ('VICGM363', 281),
  ('VICGM363', 315),
  ('VICH9HSL', 251),
  ('VICH9HSL', 256),
  ('YAS6K63T', 211),
  ('YAS6K63T', 234),
  ('ZEYY9M9C', 198),
  ('ZEYY9M9C', 205),
  ('ZEYY9M9C', 225),
  ('ZEYKT8KS', 212);
