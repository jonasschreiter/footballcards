
-- Change year column to text for season format (e.g., "18/19", "19/20")

-- Drop old check constraint first
ALTER TABLE cards DROP CONSTRAINT "cards_year_check";

-- Change column type to text (allows storing integers as text temporarily)
ALTER TABLE cards ALTER COLUMN year TYPE text USING 
    LPAD(((year::integer % 100)::integer)::text, 2, '0') || '/' || 
    LPAD((((year::integer % 100)::integer + 1) % 100)::text, 2, '0');

-- Add new constraint for season format
ALTER TABLE cards ADD CONSTRAINT "cards_year_check" CHECK (year ~ '^\d{2}/\d{2}$');
