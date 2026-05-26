-- PDF Types arxitekturası miqrasiyası
-- Addım 1: pdfs_types cədvəlini yarat
CREATE TABLE IF NOT EXISTS pdfs_types (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Addım 2: 3 sabit tipi əlavə et
INSERT IGNORE INTO pdfs_types (name) VALUES
  ('kitab-elektron'),
  ('kitab-fiziki'),
  ('kitab-hər ikisi');

-- Addım 3: pdfs cədvəlinə pdf_type_id sütunu əlavə et
ALTER TABLE pdfs
  ADD COLUMN IF NOT EXISTS pdf_type_id INT NULL
  AFTER category_id;

ALTER TABLE pdfs
  ADD CONSTRAINT fk_pdf_pdf_type
  FOREIGN KEY (pdf_type_id) REFERENCES pdfs_types(id);

-- Addım 4: Mövcud kitabları köçür (category → type)
UPDATE pdfs p
JOIN category_pdfs cp ON p.category_id = cp.id
JOIN pdfs_types    pt ON pt.name = cp.name
SET p.pdf_type_id = pt.id,
    p.category_id = NULL
WHERE cp.name IN ('kitab-elektron', 'kitab-fiziki', 'kitab-hər ikisi');

-- Addım 5: "kitab-*" kateqoriyalarını sil
DELETE FROM category_pdfs
WHERE name IN ('kitab-elektron', 'kitab-fiziki', 'kitab-hər ikisi');
