-- Fix donations RLS policies
-- The previous hardening migration dropped the donation policies without recreating them,
-- causing recipients to be unable to see their received donations.

-- Drop any existing policies first
drop policy if exists "Allow public read of active donations" on public.donations;
drop policy if exists "Allow creator to manage own donations" on public.donations;
drop policy if exists "Users can view own donations" on public.donations;

-- Authenticated users can read donations where they are the sender OR the receiver
create policy "Users can view own donations"
  on public.donations for select
  to authenticated
  using (auth.uid() = from_user or auth.uid() = to_user);

-- Only the sender (from_user) can manage (insert/update/delete) their own donations
-- Note: updates are done via security definer functions, so this mainly covers the JS client
drop policy if exists "Sender can manage own donations" on public.donations;
create policy "Sender can manage own donations"
  on public.donations for all
  to authenticated
  using (auth.uid() = from_user);

-- Re-grant execute on the donation functions (they were revoked in hardening migration)
grant execute on function public.generate_donation(integer) to authenticated;
grant execute on function public.redeem_donation(text) to authenticated;
