-- Add explicit rookie flag to cards
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS rookie_card boolean NOT NULL DEFAULT false;