-- ============================================================
-- STEP 1: Seed O&G locations (run this FIRST)
-- ============================================================
insert into public.locations (name, code, min_staff, max_staff, is_active, display_order)
values
  ('Labour Unit',              'LDU',    2, 4, true,  1),
  ('PAC 3',                    'PAC3',   1, 2, true,  2),
  ('PAC 4',                    'PAC4',   1, 2, true,  3),
  ('EPAU/ED',                  'EPAU',   1, 2, true,  4),
  ('Ward 8A',                  'W8A',    1, 2, true,  5),
  ('Ward 8B',                  'W8B',    1, 2, true,  6),
  ('Maternity OT',             'MOT',    2, 3, true,  7),
  ('General OT',               'GOT',    1, 2, true,  8),
  ('Clinic',                   'CLIN',   1, 2, true,  9),
  ('Periphery/Emergency GOT',  'PEGOT',  1, 2, true, 10)
on conflict (name) do nothing;


-- ============================================================
-- STEP 2: Create 28 dummy officers
-- Run each block separately in Supabase SQL Editor
-- (Auth users must be created via Dashboard or API —
--  the INSERT below only creates the profile rows.
--  Use the Add Officer form in the app for real users.)
-- ============================================================
-- Paste this into Supabase SQL Editor → Run
-- Replace the UUIDs with real ones after creating auth users,
-- OR use the Add Officer form in the app (Officers tab) which
-- handles both auth + profile in one step.

-- If you want to bulk-insert dummy profiles for testing
-- (they won't be able to log in without auth users),
-- use these UUIDs — they are random and won't clash:

insert into public.profiles (id, email, full_name, staff_id, role, is_active)
values
  ('00000001-0000-0000-0000-000000000001', 'mo1@test.local',  'Dr Amirah Binti Hassan',     'MO001', 'user', true),
  ('00000001-0000-0000-0000-000000000002', 'mo2@test.local',  'Dr Farhana Binti Malik',     'MO002', 'user', true),
  ('00000001-0000-0000-0000-000000000003', 'mo3@test.local',  'Dr Nurul Ain Binti Zulkifli','MO003', 'user', true),
  ('00000001-0000-0000-0000-000000000004', 'mo4@test.local',  'Dr Syahirah Binti Roslan',   'MO004', 'user', true),
  ('00000001-0000-0000-0000-000000000005', 'mo5@test.local',  'Dr Hafizah Binti Ismail',    'MO005', 'user', true),
  ('00000001-0000-0000-0000-000000000006', 'mo6@test.local',  'Dr Izzati Binti Kamarudin',  'MO006', 'user', true),
  ('00000001-0000-0000-0000-000000000007', 'mo7@test.local',  'Dr Nabilah Binti Ahmad',     'MO007', 'user', true),
  ('00000001-0000-0000-0000-000000000008', 'mo8@test.local',  'Dr Suraya Binti Othman',     'MO008', 'user', true),
  ('00000001-0000-0000-0000-000000000009', 'mo9@test.local',  'Dr Wardah Binti Yusof',      'MO009', 'user', true),
  ('00000001-0000-0000-0000-000000000010', 'mo10@test.local', 'Dr Liyana Binti Zainal',     'MO010', 'user', true),
  ('00000001-0000-0000-0000-000000000011', 'mo11@test.local', 'Dr Hanis Binti Ramli',       'MO011', 'user', true),
  ('00000001-0000-0000-0000-000000000012', 'mo12@test.local', 'Dr Siti Khadijah Binti Aziz','MO012', 'user', true),
  ('00000001-0000-0000-0000-000000000013', 'mo13@test.local', 'Dr Zulaikha Binti Hamid',    'MO013', 'user', true),
  ('00000001-0000-0000-0000-000000000014', 'mo14@test.local', 'Dr Aishah Binti Nordin',     'MO014', 'user', true),
  ('00000001-0000-0000-0000-000000000015', 'mo15@test.local', 'Dr Rasyidah Binti Saad',     'MO015', 'user', true),
  ('00000001-0000-0000-0000-000000000016', 'mo16@test.local', 'Dr Farah Ain Binti Ghazali', 'MO016', 'user', true),
  ('00000001-0000-0000-0000-000000000017', 'mo17@test.local', 'Dr Nik Hana Binti Nik Soh',  'MO017', 'user', true),
  ('00000001-0000-0000-0000-000000000018', 'mo18@test.local', 'Dr Nur Sabrina Binti Yusof', 'MO018', 'user', true),
  ('00000001-0000-0000-0000-000000000019', 'mo19@test.local', 'Dr Khairunnisa Binti Razak', 'MO019', 'user', true),
  ('00000001-0000-0000-0000-000000000020', 'mo20@test.local', 'Dr Suhailah Binti Mohd',     'MO020', 'user', true),
  ('00000001-0000-0000-0000-000000000021', 'mo21@test.local', 'Dr Azhar Bin Abdullah',      'MO021', 'user', true),
  ('00000001-0000-0000-0000-000000000022', 'mo22@test.local', 'Dr Hafiz Bin Jamaludin',     'MO022', 'user', true),
  ('00000001-0000-0000-0000-000000000023', 'mo23@test.local', 'Dr Ridhwan Bin Mohd Noor',   'MO023', 'user', true),
  ('00000001-0000-0000-0000-000000000024', 'mo24@test.local', 'Dr Izzuddin Bin Hamdan',     'MO024', 'user', true),
  ('00000001-0000-0000-0000-000000000025', 'mo25@test.local', 'Dr Mukhriz Bin Zahari',      'MO025', 'user', true),
  ('00000001-0000-0000-0000-000000000026', 'mo26@test.local', 'Dr Haziq Bin Ruslan',        'MO026', 'user', true),
  ('00000001-0000-0000-0000-000000000027', 'mo27@test.local', 'Dr Syafiq Bin Baharom',      'MO027', 'user', true),
  ('00000001-0000-0000-0000-000000000028', 'mo28@test.local', 'Dr Hazwan Bin Idris',        'MO028', 'user', true)
on conflict (id) do nothing;


-- ============================================================
-- STEP 3: Seed some roster entries so the grid shows data
-- (uses the dummy UUIDs above + your real superadmin UUID)
-- Replace 'YOUR-SUPERADMIN-UUID' with your actual UUID from
-- Supabase Dashboard → Authentication → Users
-- ============================================================

-- Get location IDs first (run this to check):
-- select id, name from public.locations order by display_order;

-- Example: seed this week's roster with a spread of officers
-- Edit the entry_date values to match the current Mon–Fri

do $$
declare
  ldu_id   int; pac3_id  int; pac4_id  int;
  epau_id  int; w8a_id   int; w8b_id   int;
  mot_id   int; got_id   int; clin_id  int;
  mon text := to_char(date_trunc('week', current_date), 'YYYY-MM-DD');
  tue text := to_char(date_trunc('week', current_date) + interval '1 day', 'YYYY-MM-DD');
  wed text := to_char(date_trunc('week', current_date) + interval '2 days', 'YYYY-MM-DD');
  thu text := to_char(date_trunc('week', current_date) + interval '3 days', 'YYYY-MM-DD');
  fri text := to_char(date_trunc('week', current_date) + interval '4 days', 'YYYY-MM-DD');
begin
  select id into ldu_id  from public.locations where name = 'Labour Unit';
  select id into pac3_id from public.locations where name = 'PAC 3';
  select id into pac4_id from public.locations where name = 'PAC 4';
  select id into epau_id from public.locations where name = 'EPAU/ED';
  select id into w8a_id  from public.locations where name = 'Ward 8A';
  select id into w8b_id  from public.locations where name = 'Ward 8B';
  select id into mot_id  from public.locations where name = 'Maternity OT';
  select id into got_id  from public.locations where name = 'General OT';
  select id into clin_id from public.locations where name = 'Clinic';

  insert into public.roster_entries (officer_id, entry_date, shift, location_id)
  values
    -- Monday
    ('00000001-0000-0000-0000-000000000001', mon, 'regular',  ldu_id),
    ('00000001-0000-0000-0000-000000000002', mon, 'regular',  ldu_id),
    ('00000001-0000-0000-0000-000000000003', mon, 'regular',  pac3_id),
    ('00000001-0000-0000-0000-000000000004', mon, 'regular',  pac4_id),
    ('00000001-0000-0000-0000-000000000005', mon, 'oncall',   ldu_id),
    ('00000001-0000-0000-0000-000000000006', mon, 'regular',  epau_id),
    ('00000001-0000-0000-0000-000000000007', mon, 'regular',  w8a_id),
    ('00000001-0000-0000-0000-000000000008', mon, 'regular',  w8b_id),
    ('00000001-0000-0000-0000-000000000009', mon, 'regular',  mot_id),
    ('00000001-0000-0000-0000-000000000010', mon, 'regular',  clin_id),
    -- Tuesday
    ('00000001-0000-0000-0000-000000000011', tue, 'regular',  ldu_id),
    ('00000001-0000-0000-0000-000000000012', tue, 'regular',  ldu_id),
    ('00000001-0000-0000-0000-000000000013', tue, 'regular',  pac3_id),
    ('00000001-0000-0000-0000-000000000014', tue, 'regular',  pac4_id),
    ('00000001-0000-0000-0000-000000000015', tue, 'oncall',   ldu_id),
    ('00000001-0000-0000-0000-000000000016', tue, 'regular',  epau_id),
    ('00000001-0000-0000-0000-000000000017', tue, 'regular',  w8a_id),
    ('00000001-0000-0000-0000-000000000018', tue, 'regular',  w8b_id),
    ('00000001-0000-0000-0000-000000000019', tue, 'postcall', ldu_id),
    ('00000001-0000-0000-0000-000000000020', tue, 'regular',  clin_id),
    -- Wednesday
    ('00000001-0000-0000-0000-000000000021', wed, 'regular',  ldu_id),
    ('00000001-0000-0000-0000-000000000022', wed, 'regular',  pac3_id),
    ('00000001-0000-0000-0000-000000000023', wed, 'regular',  pac4_id),
    ('00000001-0000-0000-0000-000000000024', wed, 'oncall',   ldu_id),
    ('00000001-0000-0000-0000-000000000025', wed, 'regular',  epau_id),
    ('00000001-0000-0000-0000-000000000026', wed, 'regular',  w8a_id),
    ('00000001-0000-0000-0000-000000000027', wed, 'regular',  w8b_id),
    ('00000001-0000-0000-0000-000000000028', wed, 'regular',  mot_id),
    -- Thursday
    ('00000001-0000-0000-0000-000000000001', thu, 'postcall', ldu_id),
    ('00000001-0000-0000-0000-000000000002', thu, 'regular',  ldu_id),
    ('00000001-0000-0000-0000-000000000003', thu, 'regular',  pac3_id),
    ('00000001-0000-0000-0000-000000000004', thu, 'regular',  pac4_id),
    ('00000001-0000-0000-0000-000000000005', thu, 'oncall',   w8a_id),
    ('00000001-0000-0000-0000-000000000006', thu, 'regular',  epau_id),
    ('00000001-0000-0000-0000-000000000007', thu, 'regular',  w8a_id),
    ('00000001-0000-0000-0000-000000000008', thu, 'regular',  clin_id),
    -- Friday
    ('00000001-0000-0000-0000-000000000009', fri, 'regular',  ldu_id),
    ('00000001-0000-0000-0000-000000000010', fri, 'regular',  ldu_id),
    ('00000001-0000-0000-0000-000000000011', fri, 'oncall',   ldu_id),
    ('00000001-0000-0000-0000-000000000012', fri, 'regular',  pac3_id),
    ('00000001-0000-0000-0000-000000000013', fri, 'regular',  w8a_id),
    ('00000001-0000-0000-0000-000000000014', fri, 'regular',  w8b_id),
    ('00000001-0000-0000-0000-000000000015', fri, 'postcall', epau_id)
  on conflict (entry_date, officer_id) do nothing;
end $$;
