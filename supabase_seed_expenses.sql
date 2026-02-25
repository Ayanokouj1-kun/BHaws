-- Seed Script: Add 10 Realistic Expenses
-- Run this script in your Supabase SQL Editor.

INSERT INTO expenses (category, description, amount, date, paid_by, receipt_ref)
VALUES 
    -- Utilities
    ('Utilities', 'AKELCO Electricity Bill - Main Building', 12500.00, CURRENT_DATE - INTERVAL '5 days', 'Admin', 'AK-84920'),
    ('Utilities', 'Metro Kalibo Water District Bill', 3200.50, CURRENT_DATE - INTERVAL '12 days', 'Admin', 'MK-11234'),
    ('Utilities', 'PLDT Fiber Internet Bill (1 Gbps Plan)', 2899.00, CURRENT_DATE - INTERVAL '8 days', 'Admin', 'PL-77382'),
    
    -- Maintenance
    ('Maintenance', 'AC Freon Refill & Cleaning (Room C102)', 1500.00, CURRENT_DATE - INTERVAL '15 days', 'Admin', 'MC-101'),
    ('Maintenance', 'Plumbing Service - Fixed leaky faucet in common CR', 800.00, CURRENT_DATE - INTERVAL '22 days', 'Admin', 'MC-102'),
    ('Maintenance', 'Roof Sealant & Minor Repairs after heavy rain', 4500.00, CURRENT_DATE - INTERVAL '40 days', 'Admin', 'MC-103'),
    
    -- Supplies
    ('Supplies', 'Cleaning Materials (Bleach, Mop, Garbage Bags)', 1250.00, CURRENT_DATE - INTERVAL '3 days', 'Staff', 'SM-INV-882'),
    ('Supplies', 'Replacement LED Bulbs (10 units)', 950.00, CURRENT_DATE - INTERVAL '28 days', 'Staff', 'HW-INV-115'),
    
    -- Salary & Taxes
    ('Salary', 'Caretaker Monthly Salary (Half-month cutoff)', 7500.00, CURRENT_DATE - INTERVAL '1 day', 'Admin', 'PR-082'),
    ('Taxes', 'Barangay Business Permit Renewal Fee', 2500.00, CURRENT_DATE - INTERVAL '60 days', 'Admin', 'BP-2026')
;
