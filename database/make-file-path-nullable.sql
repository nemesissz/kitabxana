-- PDF faylı olmayan kitablar üçün (kitab-fiziki kateqoriyası)
ALTER TABLE pdfs MODIFY COLUMN file_path VARCHAR(500) NULL DEFAULT NULL;
