-- SUPABASE DATABASE SETUP FOR BOARDHUB
-- Copy and run this in the Supabase SQL Editor

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Rooms Table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  monthly_rate DECIMAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available',
  floor INTEGER,
  amenities TEXT[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Beds Table
CREATE TABLE beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available',
  boarder_id UUID, -- Will be set once boarders table is created
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Boarders Table
CREATE TABLE boarders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  contact_number TEXT,
  email TEXT,
  address TEXT,
  emergency_contact TEXT,
  assigned_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  assigned_bed_id UUID REFERENCES beds(id) ON DELETE SET NULL,
  move_in_date DATE DEFAULT CURRENT_DATE,
  move_out_date DATE,
  advance_amount DECIMAL DEFAULT 0,
  deposit_amount DECIMAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active',
  profile_photo TEXT,
  occupation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update beds table to link boarder_id
ALTER TABLE beds ADD CONSTRAINT fk_bed_boarder FOREIGN KEY (boarder_id) REFERENCES boarders(id) ON DELETE SET NULL;

-- 5. Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boarder_id UUID REFERENCES boarders(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  month TEXT,
  date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'Pending',
  method TEXT,
  received_by TEXT,
  late_fee DECIMAL DEFAULT 0,
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT,
  performed_by TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Maintenance Requests
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  boarder_id UUID REFERENCES boarders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 8. Expenses Table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  paid_by TEXT,
  receipt_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Announcements Table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 10. Settings Table (Single row)
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT NOT NULL DEFAULT 'BHaws Residences',
  address TEXT,
  contact TEXT,
  email TEXT,
  website TEXT,
  tax_id TEXT,
  owner_name TEXT,
  currency TEXT DEFAULT 'PHP',
  late_fee_enabled BOOLEAN DEFAULT TRUE,
  late_fee_amount DECIMAL DEFAULT 0,
  grace_period_days INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- 11. Profiles (System Users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Boarder',
  boarder_id UUID REFERENCES boarders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Row Level Security (RLS) - Basic Setup (You can refine this later)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE boarders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Creating a simple bypass for now (Authenticated users can do everything)
-- In production, you would create specific policies for Admin/Staff/Boarder roles.
CREATE POLICY "Enable all for authenticated users" ON rooms FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON beds FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON boarders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON audit_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON maintenance_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON announcements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON profiles FOR ALL USING (auth.role() = 'authenticated');

-- 13. Initial Settings Data
INSERT INTO settings (id, name, currency) VALUES (1, 'BHaws Residences', 'PHP') ON CONFLICT (id) DO NOTHING;
