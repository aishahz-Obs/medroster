-- ============================================================
-- MedRoster O&G — Row-Level Security Policies
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles       enable row level security;
alter table public.locations      enable row level security;
alter table public.roster_entries enable row level security;
alter table public.clock_ins      enable row level security;
alter table public.leave_requests enable row level security;
alter table public.leave_balances enable row level security;
alter table public.courses        enable row level security;
alter table public.audit_logs     enable row level security;

-- Helper: get the current user's role
create or replace function public.get_my_role()
returns user_role language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: is current user admin or superadmin?
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Anyone authenticated can read all active profiles (needed for roster display)
create policy "profiles_select" on public.profiles
  for select using (auth.uid() is not null);

-- Users can update only their own profile (non-role fields)
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Only admins can insert/update any profile
create policy "profiles_admin_write" on public.profiles
  for all using (public.is_admin());

-- ─── locations ───────────────────────────────────────────────────────────────
create policy "locations_select_all" on public.locations
  for select using (auth.uid() is not null);

create policy "locations_admin_write" on public.locations
  for all using (public.is_admin());

-- ─── roster_entries ──────────────────────────────────────────────────────────
create policy "roster_select_all" on public.roster_entries
  for select using (auth.uid() is not null);

create policy "roster_admin_write" on public.roster_entries
  for all using (public.is_admin());

-- ─── clock_ins ───────────────────────────────────────────────────────────────
-- Users can read their own; admins see all
create policy "clockin_select_own" on public.clock_ins
  for select using (officer_id = auth.uid() or public.is_admin());

-- Users can insert/update their own clock-in
create policy "clockin_insert_own" on public.clock_ins
  for insert with check (officer_id = auth.uid());

create policy "clockin_update_own" on public.clock_ins
  for update using (officer_id = auth.uid() or public.is_admin());

-- ─── leave_requests ──────────────────────────────────────────────────────────
create policy "leave_select_own" on public.leave_requests
  for select using (officer_id = auth.uid() or public.is_admin());

create policy "leave_insert_own" on public.leave_requests
  for insert with check (officer_id = auth.uid());

-- Users can cancel their own pending leaves; admins can update any
create policy "leave_update" on public.leave_requests
  for update using (
    (officer_id = auth.uid() and status = 'pending')
    or public.is_admin()
  );

-- ─── leave_balances ──────────────────────────────────────────────────────────
create policy "balance_select_own" on public.leave_balances
  for select using (officer_id = auth.uid() or public.is_admin());

create policy "balance_admin_write" on public.leave_balances
  for all using (public.is_admin());

-- ─── courses ─────────────────────────────────────────────────────────────────
create policy "courses_select_own" on public.courses
  for select using (officer_id = auth.uid() or public.is_admin());

create policy "courses_admin_write" on public.courses
  for all using (public.is_admin());

-- ─── audit_logs ──────────────────────────────────────────────────────────────
-- Only admins can read the audit log; inserts via server-side only
create policy "audit_admin_read" on public.audit_logs
  for select using (public.is_admin());

create policy "audit_insert_all" on public.audit_logs
  for insert with check (auth.uid() is not null);
