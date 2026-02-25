-- Script to update all boarders' addresses to a random municipality in Aklan
-- Run this script in your Supabase SQL Editor.

UPDATE boarders
SET address = (
    ARRAY[
        'Altavas', 'Balete', 'Banga', 'Batan', 'Buruanga', 
        'Ibajay', 'Kalibo', 'Lezo', 'Libacao', 'Madalag', 
        'Makato', 'Malay', 'Malinao', 'Nabas', 'New Washington', 
        'Numancia', 'Tangalan'
    ]
)[floor(random() * 17 + 1)::int] || ', Aklan, Philippines';
