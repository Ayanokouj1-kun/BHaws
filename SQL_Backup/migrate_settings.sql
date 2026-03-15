-- 1. Remove the restrictive check and primary key on ID 1
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS settings_id_check;
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS settings_pkey;

-- 2. Ensure admin_id column exists
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS admin_id UUID;

-- 3. Make admin_id UNIQUE so we can use it for upserts
-- Note: SuperAdmin settings will have admin_id = NULL (Global) or their own ID.
-- To allow one global setting where admin_id is NULL, we can use a unique index.
CREATE UNIQUE INDEX IF NOT EXISTS settings_admin_id_idx ON public.settings (admin_id) WHERE admin_id IS NOT NULL;
-- If you want only one record where admin_id is NULL:
CREATE UNIQUE INDEX IF NOT EXISTS settings_global_idx ON public.settings ((1)) WHERE admin_id IS NULL;

-- 4. New Primary Key
ALTER TABLE public.settings ADD PRIMARY KEY (id);
-- If ID was SERIAL, it's fine. If not, we might want to make it auto-increment or use UUID.

-- 5. Link the existing record (id=1) to the actual SuperAdmin if possible
-- (Assuming we want to avoid orphans)
UPDATE public.settings SET admin_id = (SELECT id FROM profiles WHERE username = 'superadmin' LIMIT 1) WHERE id = 1;
