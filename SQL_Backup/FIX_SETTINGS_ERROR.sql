-- 1. Remove the restrictive check that forces ID to be 1
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS settings_id_check;

-- 2. Make the 'id' column auto-incrementing so new rows get unique IDs
-- First, find the max ID or start from 2
CREATE SEQUENCE IF NOT EXISTS settings_id_seq;
SELECT setval('settings_id_seq', COALESCE((SELECT MAX(id) FROM public.settings), 1));
ALTER TABLE public.settings ALTER COLUMN id SET DEFAULT nextval('settings_id_seq');

-- 3. Ensure admin_id column exists
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS admin_id UUID;

-- 4. Create a unique constraint on admin_id so upsert works
-- This allows each admin to have exactly ONE settings row
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_admin_id_unique') THEN
        ALTER TABLE public.settings ADD CONSTRAINT settings_admin_id_unique UNIQUE (admin_id);
    END IF;
END $$;

-- 5. Clean up: Link existing row 1 to the superadmin if it's currently NULL
UPDATE public.settings 
SET admin_id = (SELECT id FROM profiles WHERE username = 'superadmin' LIMIT 1) 
WHERE id = 1 AND admin_id IS NULL;
