-- Kitab kateqoriyaları üçün ön söz sütunu
ALTER TABLE pdfs ADD COLUMN foreword TEXT NULL DEFAULT NULL;
