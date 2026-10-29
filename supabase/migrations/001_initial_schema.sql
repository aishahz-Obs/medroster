-- ============================================================
-- MedRoster O&G — Initial Database Schema
-- Run this in Supabase SQL Editor (Settings → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles (linked to Supabase auth.users) ────────────────────────────────
create type user_role as enum ('superadmin', 'admin', 'user');

create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  full_name        text not null,
  staff_id         text unique not null,
  email            text unique not null,
  role             user_role not null default 'user',
  department       text not null default 'Obstetrics & Gynaecology',
  join_date        date,
  is_active        boolean not null default true,
  annual_leave_days integer not null default 25,
  phone            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─── Work Locations ───────────────────────────────────────────────────────────
create table public.locations (
  id              serial primary key,
  name            text not null unique,
  code            text not null unique,         -- e.g. 'LABOUR', 'CLINIC'
  min_staff       int not null default 1,
  max_staff       int not null default 10,
  -- NULL = all working days; otherwise array of ISO weekday numbers (1=Mon..5=Fri)
  active_days     int[],
  requires_senior boolean not null default false,
  requires_tagger boolean not null default false,
  notes           text,
  display_order   int not null default 0
);

-- Seed locations
insert into public.locations (name, code, min_staff, max_staff, active_days, requires_senior, requires_tagger, notes, display_order) values
  ('Labour Unit',              'LABOUR',    2, 2,  null,       false, false, 'Always staffed',                        1),
  ('PAC 3 & 4',                'PAC',       3, 4,  null,       false, false, 'Flexible 3–4 persons',                  2),
  ('EPAU / ED',                'EPAU',      2, 2,  null,       false, false, 'Emergency coverage',                    3),
  ('Ward 8A',                  'WARD8A',    2, 3,  null,       false, false, 'Inpatient ward',                        4),
  ('Ward 8B',                  'WARD8B',    2, 3,  null,       false, false, 'Inpatient ward',                        5),
  ('Maternity OT',             'MAT_OT',    3, 3,  null,       true,  true,  '2 senior + 1 tagger required',          6),
  ('General OT',               'GEN_OT',   2, 2,  array[2,4], false, false, 'Tuesday & Thursday only',               7),
  ('Clinic',                   'CLINIC',    9, 9,  null,       false, false, '8 officers + 1 OT manager',             8),
  ('Periphery / Emergency GOT','PERIPH',    2, 2,  null,       false, false, 'Emergency coverage',                    9);

-- ─── Roster Entries ──────────────────────────────────────────────────────────
create type shift_type as enum ('regular', 'oncall', 'postcall');

create table public.roster_entries (
  id              uuid primary key default uuid_generate_v4(),
  entry_date      date not null,
  officer_id      uuid not null references public.profiles(id),
  location_id     int  references public.locations(id),
  shift           shift_type not null default 'regular',
  oncall_start    timestamptz,                  -- for oncall: shift start
  oncall_end      timestamptz,                  -- for oncall/postcall: end time
  is_tagger       boolean not null default false,
  notes           text,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  unique (entry_date, officer_id)               -- one entry per officer per day
);

create index idx_roster_date       on public.roster_entries(entry_date);
create index idx_roster_officer    on public.roster_entries(officer_id);
create index idx_roster_location   on public.roster_entries(location_id);

-- ─── Clock-In / Attendance ───────────────────────────────────────────────────
create type attendance_status as enum ('present', 'mia', 'el', 'leave');

create table public.clock_ins (
  id              uuid primary key default uuid_generate_v4(),
  officer_id      uuid not null references public.profiles(id),
  attendance_date date not null,
  clocked_in_at   timestamptz,
  location_id     int references public.locations(id),
  status          attendance_status not null default 'present',
  notes           text,
  created_at      timestamptz not null default now(),
  unique (officer_id, attendance_date)
);

create index idx_clockin_date    on public.clock_ins(attendance_date);
create index idx_clockin_officer on public.clock_ins(officer_id);

-- ─── Leave Requests ──────────────────────────────────────────────────────────
create type leave_type   as enum ('annual', 'maternity', 'study', 'emergency', 'replacement');
create type leave_status as enum ('pending', 'approved', 'rejected', 'blocked', 'cancelled');

create table public.leave_requests (
  id               uuid primary key default uuid_generate_v4(),
  officer_id       uuid not null references public.profiles(id),
  leave_type       leave_type not null default 'annual',
  start_date       date not null,
  end_date         date not null,
  days_count       int not null,
  reason           text,
  evidence_path    text,                        -- Supabase Storage path
  status           leave_status not null default 'pending',
  block_reason     text,                        -- populated when auto-blocked
  submitted_at     timestamptz not null default now(),
  reviewed_by      uuid references public.profiles(id),
  reviewed_at      timestamptz,
  review_notes     text,
  -- Override fields (Superadmin only)
  is_override      boolean not null default false,
  override_by      uuid references public.profiles(id),
  override_reason  text,
  created_at       timestamptz not null default now()
);

create index idx_leave_officer  on public.leave_requests(officer_id);
create index idx_leave_status   on public.leave_requests(status);
create index idx_leave_dates    on public.leave_requests(start_date, end_date);

-- ─── Leave Balances (per officer, per year) ──────────────────────────────────
create table public.leave_balances (
  id           uuid primary key default uuid_generate_v4(),
  officer_id   uuid not null references public.profiles(id),
  year         int not null,
  total_days   int not null default 25,
  used_days    int not null default 0,
  pending_days int not null default 0,
  unique (officer_id, year)
);

-- Auto-create balance record when leave is approved (trigger)
create or replace function public.update_leave_balance()
returns trigger language plpgsql security definer as $$
declare
  v_year int;
begin
  v_year := extract(year from new.start_date)::int;

  if (new.status = 'approved' and new.leave_type = 'annual') then
    insert into public.leave_balances (officer_id, year, total_days, used_days)
      values (new.officer_id, v_year, 25, new.days_count)
      on conflict (officer_id, year)
      do update set used_days = leave_balances.used_days + new.days_count,
                    pending_days = greatest(0, leave_balances.pending_days - new.days_count);
  end if;

  if (new.status = 'pending' and new.leave_type = 'annual') then
    insert into public.leave_balances (officer_id, year, total_days, pending_days)
      values (new.officer_id, v_year, 25, new.days_count)
      on conflict (officer_id, year)
      do update set pending_days = leave_balances.pending_days + new.days_count;
  end if;

  return new;
end;
$$;

create trigger trg_update_leave_balance
  after insert or update of status on public.leave_requests
  for each row execute function public.update_leave_balance();

-- ─── Courses (affects monthly leave cap) ─────────────────────────────────────
create table public.courses (
  id           uuid primary key default uuid_generate_v4(),
  officer_id   uuid not null references public.profiles(id),
  course_name  text not null,
  start_date   date not null,
  end_date     date not null,
  notes        text,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);

create index idx_courses_officer on public.courses(officer_id);

-- ─── Audit Log (immutable) ───────────────────────────────────────────────────
create table public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references public.profiles(id),
  action      text not null,   -- e.g. 'approve_leave', 'reject_leave', 'clock_in', 'override_block'
  target_type text,            -- 'leave_request', 'roster_entry', 'profile', 'clock_in'
  target_id   text,
  old_values  jsonb,
  new_values  jsonb,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index idx_audit_actor      on public.audit_logs(actor_id);
create index idx_audit_created    on public.audit_logs(created_at desc);
create index idx_audit_action     on public.audit_logs(action);

-- Disable DELETE and UPDATE on audit_logs for all roles
create or replace rule no_delete_audit as on delete to public.audit_logs do instead nothing;
create or replace rule no_update_audit as on update to public.audit_logs do instead nothing;

-- ─── Updated-at trigger helper ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
