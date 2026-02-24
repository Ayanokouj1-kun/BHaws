-- SUPABASE SEED DATA FOR BHAWS (BHMS)
-- Run AFTER `supabase_setup.sql`.
-- Optional: run `supabase_default_accounts.sql` too (this seed already inserts profiles/boarders).
--
-- Notes:
-- - This seed is idempotent (safe to run multiple times).
-- - For demo login, the app expects password == username (lowercase).
-- - We drop the FK from `profiles.id -> auth.users(id)` so you can seed demo profiles without Supabase Auth users.

BEGIN;

-- Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Allow seeding demo profiles without auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- ─────────────────────────────────────────────────────────────────────────────
-- SETTINGS (single row)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO settings (id, name, address, contact, email, owner_name, currency, late_fee_enabled, late_fee_amount, grace_period_days)
VALUES (1, 'BHaws Residences', '123 Mabini St, Santa Cruz, Manila, Philippines', '+63 912 345 6789', 'admin@bhaws.com', 'Administrator', 'PHP', TRUE, 200, 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  contact = EXCLUDED.contact,
  email = EXCLUDED.email,
  owner_name = EXCLUDED.owner_name,
  currency = EXCLUDED.currency,
  late_fee_enabled = EXCLUDED.late_fee_enabled,
  late_fee_amount = EXCLUDED.late_fee_amount,
  grace_period_days = EXCLUDED.grace_period_days,
  updated_at = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- ROOMS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO rooms (id, name, capacity, monthly_rate, status, floor, amenities, description)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Room 101', 4, 3500, 'Partial', 1, ARRAY['WiFi','Fan'], 'Near entrance, good ventilation.'),
  ('11111111-1111-1111-1111-111111111102', 'Room 102', 3, 3200, 'Available', 1, ARRAY['WiFi'], 'Quiet side, great for students.'),
  ('11111111-1111-1111-1111-111111111201', 'Room 201', 4, 3800, 'Partial', 2, ARRAY['WiFi','Fan','Study Table'], 'Second floor, premium beds.'),
  ('11111111-1111-1111-1111-111111111301', 'Room 301', 2, 4500, 'Under Maintenance', 3, ARRAY['WiFi','Aircon'], 'Temporarily under maintenance.')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- BEDS (insert as Available first to avoid cycles; we will occupy some later)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO beds (id, room_id, name, status, boarder_id)
VALUES
  -- Room 101 (4)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0101', '11111111-1111-1111-1111-111111111101', 'Bed 1', 'Available', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0102', '11111111-1111-1111-1111-111111111101', 'Bed 2', 'Available', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0103', '11111111-1111-1111-1111-111111111101', 'Bed 3', 'Available', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0104', '11111111-1111-1111-1111-111111111101', 'Bed 4', 'Available', NULL),

  -- Room 102 (3)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0201', '11111111-1111-1111-1111-111111111102', 'Bed 1', 'Available', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0202', '11111111-1111-1111-1111-111111111102', 'Bed 2', 'Available', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0203', '11111111-1111-1111-1111-111111111102', 'Bed 3', 'Available', NULL),

  -- Room 201 (4)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0301', '11111111-1111-1111-1111-111111111201', 'Bed 1', 'Available', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0302', '11111111-1111-1111-1111-111111111201', 'Bed 2', 'Available', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0303', '11111111-1111-1111-1111-111111111201', 'Bed 3', 'Available', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0304', '11111111-1111-1111-1111-111111111201', 'Bed 4', 'Available', NULL),

  -- Room 301 (2)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0401', '11111111-1111-1111-1111-111111111301', 'Bed 1', 'Available', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0402', '11111111-1111-1111-1111-111111111301', 'Bed 2', 'Available', NULL)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- BOARDERS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO boarders (
  id, full_name, contact_number, email, address, emergency_contact,
  assigned_room_id, assigned_bed_id, move_in_date, move_out_date,
  advance_amount, deposit_amount, status, profile_photo, occupation, created_at
)
VALUES
  -- Default boarder used by some demos (also created by supabase_default_accounts.sql)
  ('74889c6d-55e1-4c6d-8b65-6435c43d7c81', 'Default Boarder', '09123456789', 'default@bhaws.com', 'Manila', '—',
   NULL, NULL, CURRENT_DATE - INTERVAL '45 days', NULL, 0, 0, 'Active', NULL, '—', NOW()),

  ('22222222-2222-2222-2222-222222222201', 'Maria Santos', '09170000001', 'maria@bhaws.com', 'Quezon City', 'Rosa Santos - 09170000999',
   '11111111-1111-1111-1111-111111111101', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0101', CURRENT_DATE - INTERVAL '80 days', NULL,
   3500, 2000, 'Active', NULL, 'Student', NOW()),

  ('22222222-2222-2222-2222-222222222202', 'John Reyes', '09170000002', 'john@bhaws.com', 'Manila', 'Carlos Reyes - 09170000888',
   '11111111-1111-1111-1111-111111111101', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0102', CURRENT_DATE - INTERVAL '20 days', NULL,
   3500, 1500, 'Active', NULL, 'Working Professional', NOW()),

  ('22222222-2222-2222-2222-222222222203', 'Ana Cruz', '09170000003', 'ana@bhaws.com', 'Caloocan', 'Liza Cruz - 09170000777',
   '11111111-1111-1111-1111-111111111201', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0301', CURRENT_DATE - INTERVAL '10 days', NULL,
   3800, 2000, 'Active', NULL, 'Freelancer', NOW())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  contact_number = EXCLUDED.contact_number,
  email = EXCLUDED.email,
  address = EXCLUDED.address,
  emergency_contact = EXCLUDED.emergency_contact,
  assigned_room_id = EXCLUDED.assigned_room_id,
  assigned_bed_id = EXCLUDED.assigned_bed_id,
  move_in_date = EXCLUDED.move_in_date,
  move_out_date = EXCLUDED.move_out_date,
  advance_amount = EXCLUDED.advance_amount,
  deposit_amount = EXCLUDED.deposit_amount,
  status = EXCLUDED.status,
  profile_photo = EXCLUDED.profile_photo,
  occupation = EXCLUDED.occupation;

-- Occupy beds for the seeded boarders
UPDATE beds SET status = 'Occupied', boarder_id = '22222222-2222-2222-2222-222222222201'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0101';

UPDATE beds SET status = 'Occupied', boarder_id = '22222222-2222-2222-2222-222222222202'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0102';

UPDATE beds SET status = 'Occupied', boarder_id = '22222222-2222-2222-2222-222222222203'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0301';

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES (DEMO LOGIN ACCOUNTS)
-- password == username (lowercase) in your app logic
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO profiles (id, username, full_name, role, boarder_id, created_at)
VALUES
  (uuid_generate_v4(), 'admin', 'House Administrator', 'Admin', NULL, NOW()),
  (uuid_generate_v4(), 'staff', 'System Caretaker', 'Staff', NULL, NOW()),
  (uuid_generate_v4(), 'boarder', 'Resident Boarder', 'Boarder', '74889c6d-55e1-4c6d-8b65-6435c43d7c81', NOW()),
  (uuid_generate_v4(), 'maria', 'Maria Santos', 'Boarder', '22222222-2222-2222-2222-222222222201', NOW()),
  (uuid_generate_v4(), 'john', 'John Reyes', 'Boarder', '22222222-2222-2222-2222-222222222202', NOW()),
  (uuid_generate_v4(), 'ana', 'Ana Cruz', 'Boarder', '22222222-2222-2222-2222-222222222203', NOW())
ON CONFLICT (username) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  boarder_id = EXCLUDED.boarder_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO payments (id, boarder_id, type, amount, month, date, due_date, paid_date, status, method, received_by, receipt_number, notes, created_at)
VALUES
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 'Monthly Rent', 3500, 'Jan 2026', CURRENT_DATE - INTERVAL '55 days', CURRENT_DATE - INTERVAL '55 days', CURRENT_DATE - INTERVAL '54 days', 'Paid', 'Cash', 'House Admin', 'OR-000101', 'On-time payment', NOW()),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', 'Utility', 450, 'Jan 2026', CURRENT_DATE - INTERVAL '52 days', CURRENT_DATE - INTERVAL '50 days', CURRENT_DATE - INTERVAL '49 days', 'Paid', 'GCash', 'House Admin', 'OR-000102', 'Electricity share', NOW()),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222202', 'Monthly Rent', 3500, 'Feb 2026', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '10 days', NULL, 'Pending', 'GCash', NULL, NULL, 'Due soon', NOW()),
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222202', 'Utility', 390, 'Feb 2026', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '8 days', NULL, 'Pending', NULL, NULL, NULL, NULL, NOW()),
  ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222203', 'Monthly Rent', 3800, 'Feb 2026', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '2 days', NULL, 'Overdue', NULL, NULL, NULL, 'Overdue rent', NOW()),
  ('33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222203', 'Deposit', 2000, NULL, CURRENT_DATE - INTERVAL '10 days', NULL, CURRENT_DATE - INTERVAL '10 days', 'Paid', 'Cash', 'Staff', 'OR-000103', 'Security deposit', NOW())
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- MAINTENANCE REQUESTS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO maintenance_requests (id, room_id, boarder_id, title, description, priority, status, created_at, resolved_at)
VALUES
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 'Leaking faucet', 'Bathroom faucet is leaking continuously.', 'Medium', 'In Progress', NOW() - INTERVAL '7 days', NULL),
  ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111201', '22222222-2222-2222-2222-222222222203', 'Broken light', 'Ceiling light flickers at night.', 'Low', 'Open', NOW() - INTERVAL '2 days', NULL),
  ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111301', NULL, 'Maintenance check', 'General room maintenance for Room 301.', 'Urgent', 'Open', NOW() - INTERVAL '1 days', NULL)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- EXPENSES
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO expenses (id, category, description, amount, date, paid_by, receipt_ref, created_at)
VALUES
  ('55555555-5555-5555-5555-555555555501', 'Utilities', 'Water bill', 2800, CURRENT_DATE - INTERVAL '25 days', 'Admin', 'WB-2026-01', NOW()),
  ('55555555-5555-5555-5555-555555555502', 'Supplies', 'Cleaning supplies', 750, CURRENT_DATE - INTERVAL '12 days', 'Staff', 'CS-2026-02', NOW()),
  ('55555555-5555-5555-5555-555555555503', 'Maintenance', 'Faucet replacement parts', 320, CURRENT_DATE - INTERVAL '4 days', 'Staff', 'MT-2026-03', NOW())
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- ANNOUNCEMENTS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO announcements (id, title, message, priority, created_at, expires_at)
VALUES
  ('66666666-6666-6666-6666-666666666601', 'WiFi Maintenance', 'WiFi will be restarted tonight at 11PM for maintenance.', 'Important', NOW() - INTERVAL '1 days', NOW() + INTERVAL '5 days'),
  ('66666666-6666-6666-6666-666666666602', 'House Rules Reminder', 'Please keep common areas clean and observe quiet hours after 10PM.', 'Normal', NOW() - INTERVAL '6 days', NULL),
  ('66666666-6666-6666-6666-666666666603', 'Safety Notice', 'Report any electrical issues to staff immediately.', 'Urgent', NOW() - INTERVAL '2 days', NOW() + INTERVAL '14 days')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO audit_logs (id, action, entity, entity_id, details, performed_by, timestamp)
VALUES
  ('77777777-7777-7777-7777-777777777701', 'Boarder Added', 'Boarder', '22222222-2222-2222-2222-222222222201', 'Maria Santos registered.', 'House Admin', NOW() - INTERVAL '80 days'),
  ('77777777-7777-7777-7777-777777777702', 'Payment Recorded', 'Payment', '33333333-3333-3333-3333-333333333301', 'Rent payment recorded for Jan 2026.', 'House Admin', NOW() - INTERVAL '54 days'),
  ('77777777-7777-7777-7777-777777777703', 'Maintenance Added', 'Maintenance', '44444444-4444-4444-4444-444444444401', 'Leaking faucet request submitted.', 'Maria Santos', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;


