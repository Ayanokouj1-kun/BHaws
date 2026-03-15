-- 1. DROP the specific "single_row" constraint that is blocking new admins
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS single_row;

-- 2. Drop the ID=1 check constraint
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS settings_id_check;

-- 3. Make the 'id' column auto-incrementing if it isn't already
CREATE SEQUENCE IF NOT EXISTS settings_id_seq;
SELECT setval('settings_id_seq', COALESCE((SELECT MAX(id) FROM public.settings), 1));
ALTER TABLE public.settings ALTER COLUMN id SET DEFAULT nextval('settings_id_seq');

-- 4. Ensure admin_id column exists
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS admin_id UUID;

-- 5. Create a unique constraint on admin_id so each admin has exactly one row
-- and upsert (onConflict) will work correctly in future code.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_admin_id_unique') THEN
        ALTER TABLE public.settings ADD CONSTRAINT settings_admin_id_unique UNIQUE (admin_id);
    END IF;
END $$;

-- 6. Clean up: Link existing row 1 to the superadmin if it's currently NULL
UPDATE public.settings 
SET admin_id = (SELECT id FROM profiles WHERE username = 'superadmin' LIMIT 1) 
WHERE id = 1 AND admin_id IS NULL;

-- 7. If there's a trigger preventing inserts, drop it too
DROP TRIGGER IF EXISTS ensure_single_settings_row ON public.settings;
DROP FUNCTION IF EXISTS public.restrict_settings_to_one_row();
