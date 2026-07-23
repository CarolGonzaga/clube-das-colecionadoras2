-- Permanent 10% author coupons. Each coupon may be used once per user and has
-- no global redemption limit or expiration date.
insert into public.coupons (
  code,
  discount_percent,
  discount_cents,
  max_uses,
  max_uses_per_user,
  expires_at,
  is_active
)
values
  ('GinaMilbradt10', 10, 0, null, 1, null, true),
  ('LariAlcantara10', 10, 0, null, 1, null, true),
  ('JulesKFlorian10', 10, 0, null, 1, null, true),
  ('VSVilela10', 10, 0, null, 1, null, true),
  ('BrendaBorges10', 10, 0, null, 1, null, true),
  ('LisSelwyn10', 10, 0, null, 1, null, true),
  ('CarolBarra10', 10, 0, null, 1, null, true),
  ('HelenaNolasco10', 10, 0, null, 1, null, true),
  ('FernandaV10', 10, 0, null, 1, null, true),
  ('ThaisRodrigues10', 10, 0, null, 1, null, true),
  ('LuisaLandre10', 10, 0, null, 1, null, true)
on conflict (code) do update set
  discount_percent = excluded.discount_percent,
  discount_cents = excluded.discount_cents,
  max_uses = excluded.max_uses,
  max_uses_per_user = excluded.max_uses_per_user,
  expires_at = excluded.expires_at,
  is_active = excluded.is_active;

notify pgrst, 'reload schema';
