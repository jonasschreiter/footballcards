-- Add value tracking fields for each card
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS purchase_price numeric(10,2),
ADD COLUMN IF NOT EXISTS current_value numeric(10,2);

ALTER TABLE cards
DROP CONSTRAINT IF EXISTS cards_purchase_price_non_negative,
DROP CONSTRAINT IF EXISTS cards_current_value_non_negative;

ALTER TABLE cards
ADD CONSTRAINT cards_purchase_price_non_negative CHECK (purchase_price IS NULL OR purchase_price >= 0),
ADD CONSTRAINT cards_current_value_non_negative CHECK (current_value IS NULL OR current_value >= 0);
