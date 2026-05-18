ALTER TABLE pdfs
  ADD COLUMN IF NOT EXISTS publication_year INT(4) NULL AFTER author,
  ADD COLUMN IF NOT EXISTS publisher_location VARCHAR(255) NULL AFTER publication_year,
  ADD COLUMN IF NOT EXISTS allow_download TINYINT(1) NOT NULL DEFAULT 1 AFTER publisher_location;
