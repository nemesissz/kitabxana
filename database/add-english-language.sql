-- Dil ENUM-unu yenilə: az-ru sil, en əlavə et
ALTER TABLE pdfs MODIFY COLUMN language ENUM('az','ru','en') NULL DEFAULT 'az';
