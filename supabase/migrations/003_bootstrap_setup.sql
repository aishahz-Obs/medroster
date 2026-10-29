-- ============================================================
-- MedRoster O&G — Bootstrap: first superadmin setup
-- Run AFTER 002_rls_policies.sql
-- ============================================================

-- Allow a newly signed-up user to insert their own profile
-- ONLY when the profiles table is completely empty (first-time setup).
-- This policy is harmless once any profile exists.
create policy "profiles_bootstrap_insert" on public.profiles
  for insert with check (
    id = auth.uid()
    and not exists (select 1 from public.profiles limit 1)
  );

-- RPC called by the setup page to set the first user as superadmin.
-- SECURITY DEFINER bypasses RLS; guard ensures it only runs once.
create or replace function public.bootstrap_superadmin(
  p_full_name text,
  p_staff_id  text
) returns void
language plpgsql security definer as $$
begin
  if exists (select 1 from public.profiles limit 1) then
    raise exception 'Setup already completed — profiles table is not empty.';
  end if;

  insert into public.profiles (id, full_name, staff_id, email, role)
  select
    auth.uid(),
    p_full_name,
    p_staff_id,
    u.email,
    'superadmin'
  from auth.users u
  where u.id = auth.uid();

  -- Seed an annual leave balance for the current year
  insert into public.leave_balances (officer_id, year, total_days, used_days, pending_days)
  values (auth.uid(), extract(year from now())::int, 25, 0, 0);
end;
$$;
