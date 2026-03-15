-- This script assigns all "Ownerless" records (where admin_id is NULL) 
-- to the SuperAdmin account so they reappear in your Dashboard.

DO $$ 
DECLARE 
    sa_id UUID;
BEGIN 
    -- 1. Find the SuperAdmin's actual ID from the profiles table
    SELECT id INTO sa_id FROM public.profiles WHERE username = 'superadmin' LIMIT 1;
    
    IF sa_id IS NOT NULL THEN
        -- 2. Update Rooms
        UPDATE public.rooms SET admin_id = sa_id WHERE admin_id IS NULL;
        
        -- 3. Update Boarders
        UPDATE public.boarders SET admin_id = sa_id WHERE admin_id IS NULL;
        
        -- 4. Update Payments
        -- We only update if the boarder belongs to the sa_id or if admin_id is null
        -- But for simplicity, we own all orphaned payments
        UPDATE public.payments SET admin_id = sa_id WHERE admin_id IS NULL;
        
        -- 5. Update Maintenance Requests
        UPDATE public.maintenance_requests SET admin_id = sa_id WHERE admin_id IS NULL;
        
        -- 6. Update Expenses
        UPDATE public.expenses SET admin_id = sa_id WHERE admin_id IS NULL;
        
        -- 7. Update Audit Logs
        UPDATE public.audit_logs SET admin_id = sa_id WHERE admin_id IS NULL;
        
        -- 8. Update Settings (ensure the 'global' one is owned by sa)
        UPDATE public.settings SET admin_id = sa_id WHERE admin_id IS NULL;

        RAISE NOTICE 'Ownership of orphaned records transferred to SuperAdmin (%)', sa_id;
    ELSE
        RAISE NOTICE 'SuperAdmin account not found in profiles. Please create one first.';
    END IF;
END $$;
