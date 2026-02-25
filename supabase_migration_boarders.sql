-- MIGRATION: Add missing columns to boarders table
-- Run this in the Supabase SQL Editor if your boarders table is missing these columns.

ALTER TABLE boarders
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS profile_photo TEXT;
