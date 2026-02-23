-- Migration: Add contact info columns to lost_items and found_items tables
-- This is needed for sending notifications to guest users

-- Add contact_email and contact_phone columns to lost_items
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add contact_email and contact_phone columns to found_items
ALTER TABLE found_items ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE found_items ADD COLUMN IF NOT EXISTS contact_phone TEXT;
