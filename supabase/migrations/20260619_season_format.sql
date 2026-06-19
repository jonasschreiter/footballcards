-- Change year column to text for season format (e.g., "18/19", "19/20")
-- First, convert existing integer years to season format, then change type and add constraint

-- Update existing data: convert year integers to season format (e.g., 2018 -> "18/19")
UPDATE cards 
SET year = LPAD((CAST(year AS INTEGER) % 100)::text, 2, '0') || '/' || 
           LPAD((CAST(year AS INTEGER) % 100 + 1)::text, 2, '0')
WHERE year ~ '^\d{4}$';  -- Only update rows that look like years (4 digits)

-- Drop old check constraint
ALTER TABLE cards DROP CONSTRAINT "cards_year_check";

-- Change column type to text
ALTER TABLE cards ALTER COLUMN year TYPE text;

-- Add new constraint for season format
ALTER TABLE cards ADD CONSTRAINT "cards_year_check" CHECK (year ~ '^\d{2}/\d{2}$');
