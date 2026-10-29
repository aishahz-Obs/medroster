-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004: Seed the remaining 9 medical officers
-- Run this AFTER you have created Auth users for each officer in Supabase Auth
-- (Dashboard → Authentication → Users → Add user, or use the SQL below).
--
-- OPTION A — create Auth users via SQL (requires service_role key):
--
-- insert into auth.users (id, email, encrypted_password, email_confirmed_at,
--   raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
-- values
--   (gen_random_uuid(), 'officer2@moh.gov.my', crypt('TempPass@123', gen_salt('bf')),
--    now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated'),
--   ... (repeat for each officer)
--
-- OPTION B — use the /setup page approach (already done for superadmin).
-- For bulk, paste OPTION A in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- STEP 1: Create Auth users (run in Supabase SQL Editor with service_role access)
-- Replace UUIDs and emails to match what you create in Auth → Users.
-- If you create the Auth users via the Dashboard, copy the auto-generated UUIDs
-- and paste them in STEP 2 below.

-- STEP 2: Insert profiles (replace the UUIDs with real Auth user UUIDs)
-- Example — edit full_name, staff_id, email, role for each officer.
-- Role options: 'admin', 'user'

/*
insert into public.profiles (id, full_name, staff_id, email, role, is_active)
values
  ('<UUID_2>',  'Dr Muhammad Haziq',       'MO002', 'haziq@moh.gov.my',    'user',  true),
  ('<UUID_3>',  'Dr Nurul Ain',            'MO003', 'nurulain@moh.gov.my', 'user',  true),
  ('<UUID_4>',  'Dr Siti Norfadzilah',     'MO004', 'siti@moh.gov.my',     'user',  true),
  ('<UUID_5>',  'Dr Faizal Rahman',        'MO005', 'faizal@moh.gov.my',   'user',  true),
  ('<UUID_6>',  'Dr Aisyah Zakaria',       'MO006', 'aisyahz2@moh.gov.my', 'user',  true),
  ('<UUID_7>',  'Dr Khairul Hisham',       'MO007', 'khairul@moh.gov.my',  'user',  true),
  ('<UUID_8>',  'Dr Rosmah Idrus',         'MO008', 'rosmah@moh.gov.my',   'admin', true),
  ('<UUID_9>',  'Dr Zulaikha Mustaffa',    'MO009', 'zulaikha@moh.gov.my', 'user',  true),
  ('<UUID_10>', 'Dr Hafizuddin Nordin',    'MO010', 'hafiz@moh.gov.my',    'user',  true);
*/

-- STEP 3: Seed leave balances for the current year
/*
insert into public.leave_balances (officer_id, year, total_days, used_days, pending_days)
select id, extract(year from now())::int, 25, 0, 0
from public.profiles
where id not in (select officer_id from public.leave_balances where year = extract(year from now())::int);
*/

-- NOTE: Once you fill in the real UUIDs, remove the /* */ comment markers and run.
-- ─────────────────────────────────────────────────────────────────────────────
