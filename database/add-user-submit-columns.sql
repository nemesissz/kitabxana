-- İstifadəçi PDF yükləmə xüsusiyyəti üçün migration

-- 1. category_id nullable et (istifadəçilər kateqoriya seçmir)
ALTER TABLE pdfs MODIFY COLUMN category_id INT(11) NULL;

-- 2. language nullable et, default az
ALTER TABLE pdfs MODIFY COLUMN language ENUM('az','ru','az-ru') NULL DEFAULT 'az';

-- 3. Əmr № sütunu
ALTER TABLE pdfs ADD COLUMN IF NOT EXISTS order_number VARCHAR(100) NULL COMMENT 'Əmr №' AFTER description;

-- 4. Yükləyən istifadəçi sütunu
ALTER TABLE pdfs ADD COLUMN IF NOT EXISTS uploaded_by INT NULL COMMENT 'Yükləyən istifadəçi ID' AFTER order_number;

-- 5. Foreign key
ALTER TABLE pdfs ADD CONSTRAINT fk_pdfs_uploaded_by
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

-- 6. FULLTEXT axtarış indeksi (30,000+ PDF üçün vacibdir)
ALTER TABLE pdfs ADD FULLTEXT INDEX ft_pdfs_search (title, description, order_number);

-- 7. uploaded_by üzrə indeks
ALTER TABLE pdfs ADD INDEX idx_pdfs_uploaded_by (uploaded_by);
