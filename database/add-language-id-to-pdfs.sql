-- 1. languages cədvəlindəki əsas dillərin mövcudluğunu təmin et
INSERT IGNORE INTO languages (code, name, flag) VALUES
  ('az', 'Azərbaycan dili', 'az'),
  ('ru', 'Rus dili',        'ru'),
  ('en', 'İngilis dili',    'gb');

-- 2. pdfs cədvəlinə language_id sütunu əlavə et
ALTER TABLE pdfs ADD COLUMN language_id INT NULL AFTER language;

-- 3. Mövcud dil kodlarından language_id-ni doldur
UPDATE pdfs p
JOIN languages l ON p.language = l.code
SET p.language_id = l.id;

-- 4. İndeks əlavə et
ALTER TABLE pdfs ADD INDEX idx_language_id (language_id);

-- 5. Foreign key (ON DELETE SET NULL — dil silinsə PDF-lər qalmağa davam edər)
ALTER TABLE pdfs ADD CONSTRAINT fk_pdf_language
  FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE SET NULL;

-- 6. Köhnə language sütununu sil
ALTER TABLE pdfs DROP INDEX idx_language;
ALTER TABLE pdfs DROP COLUMN language;