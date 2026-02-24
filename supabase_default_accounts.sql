-- DEFAULT SYSTEM USERS FOR BOARDHUB
-- Fixed: Removed foreign key constraint to auth.users for demo purposes

-- 1. Remove the strict link to Supabase Auth so we can create demo profiles manually
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Create default boarder for the boarder role
INSERT INTO boarders (id, full_name, contact_number, status, created_at)
VALUES ('74889c6d-55e1-4c6d-8b65-6435c43d7c81', 'Default Boarder', '09123456789', 'Active', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Profiles (System Users)

-- House Admin (admin/admin)
INSERT INTO profiles (id, username, full_name, role, created_at)
VALUES (uuid_generate_v4(), 'admin', 'House Administrator', 'Admin', NOW())
ON CONFLICT (username) DO NOTHING;

-- Care Taker / Staff (staff/staff)
INSERT INTO profiles (id, username, full_name, role, created_at)
VALUES (uuid_generate_v4(), 'staff', 'System Caretaker', 'Staff', NOW())
ON CONFLICT (username) DO NOTHING;

-- Resident / Boarder (boarder/boarder)
INSERT INTO profiles (id, username, full_name, role, boarder_id, created_at)
VALUES (uuid_generate_v4(), 'boarder', 'Resident Boarder', 'Boarder', '74889c6d-55e1-4c6d-8b65-6435c43d7c81', NOW())
ON CONFLICT (username) DO NOTHING;
