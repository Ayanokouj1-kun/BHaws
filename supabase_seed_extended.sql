-- Dynamic Historical Seed Script for BoardHub
-- Creates boarders with staggered move-in dates and generates historical monthly payments.
-- This will populate the income charts across several different months!

DO $$
DECLARE
    v_bed_id UUID;
    v_room_id UUID;
    v_boarder_id UUID;
    v_room_rate DECIMAL;
    v_receipt TEXT;
    
    v_random_days INT;
    v_move_in_date DATE;
    v_current_payment_date DATE;
    v_month_label TEXT;
    
    b_record JSONB;
    v_boarders_arr JSONB := '
    [
        {"name": "Leo Torres", "gender": "Male", "phone": "09112223333"},
        {"name": "Sofia Reyes", "gender": "Female", "phone": "09123334444"},
        {"name": "Miguel Cruz", "gender": "Male", "phone": "09134445555"},
        {"name": "Chloe Lim", "gender": "Female", "phone": "09145556666"},
        {"name": "Gabriel Santos", "gender": "Male", "phone": "09156667777"},
        {"name": "Isabella Tan", "gender": "Female", "phone": "09167778888"},
        {"name": "Elias Mendoza", "gender": "Male", "phone": "09178889999"},
        {"name": "Maya Garcia", "gender": "Female", "phone": "09189990000"},
        {"name": "Rafael Bautista", "gender": "Male", "phone": "09190001111"},
        {"name": "Julia Villanueva", "gender": "Female", "phone": "09201112222"},
        {"name": "Lucas Ramos", "gender": "Male", "phone": "09212223333"},
        {"name": "Camila Flores", "gender": "Female", "phone": "09223334444"},
        {"name": "Sebastian Perez", "gender": "Male", "phone": "09234445555"},
        {"name": "Bianca Rivera", "gender": "Female", "phone": "09245556666"},
        {"name": "Nico Gonzales", "gender": "Male", "phone": "09256667777"}
    ]';
BEGIN

    ---------------------------------------------------------------------------
    -- 1. CLEANUP PREVIOUS SEED (Optional, uncomment if you want to reset first)
    ---------------------------------------------------------------------------
    -- DELETE FROM payments;
    -- DELETE FROM maintenance_requests;
    -- UPDATE beds SET status = 'Available', boarder_id = NULL;
    -- DELETE FROM boarders;

    ---------------------------------------------------------------------------
    -- 2. ADD BOARDERS & HISTORICAL PAYMENTS
    ---------------------------------------------------------------------------
    FOR b_record IN SELECT * FROM jsonb_array_elements(v_boarders_arr)
    LOOP
        -- Find an available bed and get its room rate
        v_bed_id := NULL;
        SELECT b.id, b.room_id, r.monthly_rate INTO v_bed_id, v_room_id, v_room_rate 
        FROM beds b
        JOIN rooms r ON b.room_id = r.id
        WHERE b.status = 'Available' LIMIT 1;

        -- If we found a bed, insert the boarder!
        IF v_bed_id IS NOT NULL THEN
            
            -- Generate a random move-in date between 1 and 6 months ago
            v_random_days := floor(random() * 150) + 30;
            v_move_in_date := CURRENT_DATE - v_random_days::int;

            -- Insert Boarder
            INSERT INTO boarders (
                full_name, gender, contact_number, email, address, emergency_contact, 
                assigned_room_id, assigned_bed_id, move_in_date, advance_amount, deposit_amount, status, profile_photo
            )
            VALUES (
                b_record->>'name', b_record->>'gender', b_record->>'phone', 
                LOWER(REPLACE(b_record->>'name', ' ', '.')) || '@email.com', 
                'Metro Manila', 'Contact - ' || (b_record->>'phone'), 
                v_room_id, v_bed_id, v_move_in_date, 
                0, v_room_rate, 'Active', 'https://api.dicebear.com/7.x/notionists/svg?seed=' || REPLACE(b_record->>'name', ' ', '')
            )
            RETURNING id INTO v_boarder_id;

            -- Mark Bed as Occupied
            UPDATE beds SET status = 'Occupied', boarder_id = v_boarder_id WHERE id = v_bed_id;

            -- 1st Payment: DEPOSIT (Paid on Move-in Date)
            v_receipt := 'BH-' || TO_CHAR(v_move_in_date, 'YYYYMMDD') || '-' || LPAD(floor(random() * 999999)::text, 6, '0');
            INSERT INTO payments (boarder_id, type, amount, month, date, paid_date, status, method, receipt_number)
            VALUES (v_boarder_id, 'Deposit', v_room_rate, TO_CHAR(v_move_in_date, 'FMMonth YYYY'), v_move_in_date, v_move_in_date, 'Paid', 'Cash', v_receipt);

            -- Generate Monthly Rent & Utility Payments for EACH MONTH since move-in
            v_current_payment_date := v_move_in_date;
            
            WHILE v_current_payment_date <= CURRENT_DATE LOOP
                v_month_label := TO_CHAR(v_current_payment_date, 'FMMonth YYYY');
                v_receipt := 'BH-' || TO_CHAR(v_current_payment_date, 'YYYYMMDD') || '-' || LPAD(floor(random() * 999999)::text, 6, '0');
                
                -- Randomize if the current month is still pending/overdue, but past months are paid
                IF v_current_payment_date + interval '1 month' > CURRENT_DATE AND random() > 0.6 THEN
                    -- Leave this month unpaid/pending to show Receivables data!
                    INSERT INTO payments (boarder_id, type, amount, month, date, status, receipt_number)
                    VALUES (v_boarder_id, 'Monthly Rent', v_room_rate, v_month_label, v_current_payment_date, CASE WHEN random() > 0.5 THEN 'Pending' ELSE 'Overdue' END, NULL);
                ELSE
                    -- Paid historic rent
                    INSERT INTO payments (boarder_id, type, amount, month, date, paid_date, status, method, receipt_number)
                    VALUES (v_boarder_id, 'Monthly Rent', v_room_rate, v_month_label, v_current_payment_date, v_current_payment_date + (floor(random() * 5) || ' days')::interval, 'Paid', 'GCash', v_receipt);
                END IF;

                -- Randomly add some utility bills across the months to boost revenue diversity
                IF random() > 0.4 THEN
                    v_receipt := 'BH-UTIL-' || TO_CHAR(v_current_payment_date, 'YYYYMMDD') || '-' || LPAD(floor(random() * 999)::text, 3, '0');
                    INSERT INTO payments (boarder_id, type, amount, month, date, paid_date, status, method, receipt_number)
                    VALUES (v_boarder_id, 'Utility', 350 + floor(random() * 400), v_month_label, v_current_payment_date, v_current_payment_date + interval '2 days', 'Paid', 'Cash', v_receipt);
                END IF;

                -- Advance to next month
                v_current_payment_date := v_current_payment_date + interval '1 month';
            END LOOP;

        END IF;
    END LOOP;

    ---------------------------------------------------------------------------
    -- 3. HISTORICAL MAINTENANCE REQUESTS
    ---------------------------------------------------------------------------
    INSERT INTO maintenance_requests (room_id, boarder_id, title, description, priority, status, created_at)
    SELECT assigned_room_id, id, 'Leaking Faucet in Bathroom', 'The sink faucet is continuously dripping, needs a washer replacement.', 'Medium', 'Open', CURRENT_DATE - INTERVAL '1 day'
    FROM boarders WHERE assigned_room_id IS NOT NULL LIMIT 1 OFFSET 0;

    INSERT INTO maintenance_requests (room_id, boarder_id, title, description, priority, status, created_at)
    SELECT assigned_room_id, id, 'Aircon not cooling properly', 'The AC unit turns on but the air is not cold. Might need cleaning or freon.', 'High', 'In Progress', CURRENT_DATE - INTERVAL '3 days'
    FROM boarders WHERE assigned_room_id IS NOT NULL LIMIT 1 OFFSET 1;

    INSERT INTO maintenance_requests (room_id, boarder_id, title, description, priority, status, created_at, resolved_at)
    SELECT assigned_room_id, id, 'Busted light bulb near bed', 'Ceiling light bulb burned out and needs replacement.', 'Low', 'Resolved', CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '32 days'
    FROM boarders WHERE assigned_room_id IS NOT NULL LIMIT 1 OFFSET 2;

    ---------------------------------------------------------------------------
    -- 4. HISTORICAL ANNOUNCEMENTS
    ---------------------------------------------------------------------------
    INSERT INTO announcements (title, message, priority, created_at, expires_at)
    VALUES 
    ('Routine Water Tank Cleaning', 'Please be advised that we will have scheduled water interruptions tomorrow from 1:00 PM to 4:00 PM for the quarterly tank cleaning.', 'Important', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days'),
    ('Internet Upgrade Completed', 'Great news! We have successfully upgraded the main fiber internet line. Both WiFi networks should now be significantly faster.', 'Normal', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '35 days'),
    ('Quarterly Pest Control', 'Please secure your food items. General pest control will be conducted this coming weekend across all floors.', 'Normal', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE - INTERVAL '85 days');

END $$;
