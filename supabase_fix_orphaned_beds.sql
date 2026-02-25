-- Fix: Reset all beds that are Occupied but have no matching boarder (orphaned)
-- Run this in Supabase SQL Editor to clean up stale data

UPDATE beds
SET status = 'Available',
    boarder_id = NULL
WHERE status = 'Occupied'
  AND (
    boarder_id IS NULL
    OR boarder_id NOT IN (SELECT id FROM boarders)
  );
