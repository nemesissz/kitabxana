-- PDF kateqoriya tipini əlavə et (kitab, emr, serecam)
ALTER TABLE category_pdfs
  ADD COLUMN IF NOT EXISTS pdf_type ENUM('kitab', 'emr', 'serecam') NOT NULL DEFAULT 'emr';

-- PDF-lərə müəllif sahəsi əlavə et
ALTER TABLE pdfs
  ADD COLUMN IF NOT EXISTS author VARCHAR(255) NULL AFTER order_number;
