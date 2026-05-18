ALTER TABLE pdfs ADD COLUMN IF NOT EXISTS table_of_contents TEXT NULL AFTER description;
