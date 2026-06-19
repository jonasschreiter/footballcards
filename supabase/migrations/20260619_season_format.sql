-- Change year column to text for season format (e.g., "18/19", "19/20")
-- Drop old check constraint first, then change type, then add new constraint
ALTER TABLE cards DROP CONSTRAINT "cards_year_check";
ALTER TABLE cards ALTER COLUMN year TYPE text;
ALTER TABLE cards ADD CONSTRAINT "cards_year_check" CHECK (year ~ '^\d{2}/\d{2}$');
