-- DEFAULT SYSTEM USERS FOR BHAWS
-- Fixed: Removed foreign key constraint to auth.users for demo purposes

-- 1. Remove the strict link to Supabase Auth so we can create demo profiles manually
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Insert Profiles (System Users) - No default boarder needed

-- House Admin (admin/admin)
INSERT INTO profiles (id, username, full_name, role, created_at)
VALUES (uuid_generate_v4(), 'admin', 'House Administrator', 'Admin', NOW())
ON CONFLICT (username) DO NOTHING;

-- Care Taker / Staff (staff/staff)
INSERT INTO profiles (id, username, full_name, role, created_at)
VALUES (uuid_generate_v4(), 'staff', 'System Caretaker', 'Staff', NOW())
ON CONFLICT (username) DO NOTHING;
