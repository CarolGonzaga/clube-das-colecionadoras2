-- Read-only administrative summary for redemption-code management.
-- Activation changes continue to happen on redeem_codes and never remove history.

create or replace view public.admin_redeem_code_metrics as
select
  rc.code,
  rc.label,
  rc.element,
  rc.active,
  rc.max_redemptions,
  rc.grant_all_pool,
  rc.copies_per_sticker,
  count(distinct rg.user_id)::integer as redemption_count,
  coalesce(
    array_agg(distinct rp.sticker_number order by rp.sticker_number)
      filter (where rp.sticker_number is not null),
    array[]::integer[]
  ) as sticker_numbers
from public.redeem_codes rc
left join public.redeem_pools rp
  on rp.code = rc.code
left join public.reward_grants rg
  on rg.reward_key = 'code_' || rc.code
group by
  rc.code,
  rc.label,
  rc.element,
  rc.active,
  rc.max_redemptions,
  rc.grant_all_pool,
  rc.copies_per_sticker;

revoke all on table public.admin_redeem_code_metrics from public, anon, authenticated;
grant select on table public.admin_redeem_code_metrics to service_role;
