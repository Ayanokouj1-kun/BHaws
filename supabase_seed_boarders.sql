-- Seed Script: Add Sample Boarders into EXISTING Rooms/Beds
-- Run this script in your Supabase SQL Editor.
-- It automatically finds an 'Available' bed, assigns a boarder to it, and updates the bed's status.

DO $$
DECLARE
    v_bed_id UUID;
    v_room_id UUID;
    v_boarder_id UUID;
BEGIN
    ---------------------------------------------------------------------------
    -- BOARDER 1: Juan Dela Cruz
    ---------------------------------------------------------------------------
    SELECT id, room_id INTO v_bed_id, v_room_id FROM beds WHERE status = 'Available' LIMIT 1;
    IF v_bed_id IS NOT NULL THEN
        -- Create Boarder
        INSERT INTO boarders (full_name, gender, contact_number, email, address, emergency_contact, assigned_room_id, assigned_bed_id, move_in_date, advance_amount, deposit_amount, status, profile_photo)
        VALUES ('Juan Dela Cruz', 'Male', '09171234567', 'juan.cruz@email.com', 'Quezon City', 'Maria Cruz - 09181234567', v_room_id, v_bed_id, CURRENT_DATE - INTERVAL '15 days', 0, 3000, 'Active', 'https://api.dicebear.com/7.x/notionists/svg?seed=juan')
        RETURNING id INTO v_boarder_id;

        -- Update Bed to Occupied
        UPDATE beds SET status = 'Occupied', boarder_id = v_boarder_id WHERE id = v_bed_id;
    END IF;

    ---------------------------------------------------------------------------
    -- BOARDER 2: Ana Santos
    ---------------------------------------------------------------------------
    SELECT id, room_id INTO v_bed_id, v_room_id FROM beds WHERE status = 'Available' LIMIT 1;
    IF v_bed_id IS NOT NULL THEN
        INSERT INTO boarders (full_name, gender, contact_number, email, address, emergency_contact, assigned_room_id, assigned_bed_id, move_in_date, advance_amount, deposit_amount, status, profile_photo)
        VALUES ('Ana Santos', 'Female', '09228765432', 'ana.santos@email.com', 'Makati City', 'Jose Santos - 09198765432', v_room_id, v_bed_id, CURRENT_DATE - INTERVAL '30 days', 0, 3500, 'Active', 'https://api.dicebear.com/7.x/notionists/svg?seed=ana')
        RETURNING id INTO v_boarder_id;

        UPDATE beds SET status = 'Occupied', boarder_id = v_boarder_id WHERE id = v_bed_id;
    END IF;

    ---------------------------------------------------------------------------
    -- BOARDER 3: Mark Reyes
    ---------------------------------------------------------------------------
    SELECT id, room_id INTO v_bed_id, v_room_id FROM beds WHERE status = 'Available' LIMIT 1;
    IF v_bed_id IS NOT NULL THEN
        INSERT INTO boarders (full_name, gender, contact_number, email, address, emergency_contact, assigned_room_id, assigned_bed_id, move_in_date, advance_amount, deposit_amount, status, profile_photo)
        VALUES ('Mark Reyes', 'Male', '09991239876', 'mark.reyes@email.com', 'Pasig City', 'Lily Reyes - 09171239876', v_room_id, v_bed_id, CURRENT_DATE - INTERVAL '7 days', 1500, 3000, 'Active', 'https://api.dicebear.com/7.x/notionists/svg?seed=mark')
        RETURNING id INTO v_boarder_id;

        UPDATE beds SET status = 'Occupied', boarder_id = v_boarder_id WHERE id = v_bed_id;
    END IF;

    ---------------------------------------------------------------------------
    -- BOARDER 4: Elena Gomez
    ---------------------------------------------------------------------------
    SELECT id, room_id INTO v_bed_id, v_room_id FROM beds WHERE status = 'Available' LIMIT 1;
    IF v_bed_id IS NOT NULL THEN
        INSERT INTO boarders (full_name, gender, contact_number, email, address, emergency_contact, assigned_room_id, assigned_bed_id, move_in_date, advance_amount, deposit_amount, status, profile_photo)
        VALUES ('Elena Gomez', 'Female', '09156784321', 'elena.g@email.com', 'Taguig City', 'Carlos Gomez - 09206784321', v_room_id, v_bed_id, CURRENT_DATE - INTERVAL '60 days', 0, 4000, 'Active', 'https://api.dicebear.com/7.x/notionists/svg?seed=elena')
        RETURNING id INTO v_boarder_id;

        UPDATE beds SET status = 'Occupied', boarder_id = v_boarder_id WHERE id = v_bed_id;
    END IF;

    ---------------------------------------------------------------------------
    -- BOARDER 5: David Garcia
    ---------------------------------------------------------------------------
    SELECT id, room_id INTO v_bed_id, v_room_id FROM beds WHERE status = 'Available' LIMIT 1;
    IF v_bed_id IS NOT NULL THEN
        INSERT INTO boarders (full_name, gender, contact_number, email, address, emergency_contact, assigned_room_id, assigned_bed_id, move_in_date, advance_amount, deposit_amount, status, profile_photo)
        VALUES ('David Garcia', 'Male', '09334561234', 'david.g@email.com', 'Manila', 'Sarah Garcia - 09184561234', v_room_id, v_bed_id, CURRENT_DATE - INTERVAL '120 days', 2000, 3000, 'Active', 'https://api.dicebear.com/7.x/notionists/svg?seed=david')
        RETURNING id INTO v_boarder_id;

        UPDATE beds SET status = 'Occupied', boarder_id = v_boarder_id WHERE id = v_bed_id;
    END IF;

END $$;
