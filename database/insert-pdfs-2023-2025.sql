-- 2023, 2024, 2025 illərinin bütün ayları üçün PDF kayıtları əlavə edir
-- Cəmi 36 PDF kaydı (3 il × 12 ay)

USE vergi_db;

-- Kategori yoxlayırıq və əgər yoxdursa yaradırıq
-- Əvvəlcə mövcud kategoriləri yoxlayırıq
SET @category_id = (SELECT id FROM category_pdfs LIMIT 1);

-- Əgər kategori yoxdursa, yeni bir kategori yaradırıq
-- category_pdfs tablosunda sadece name sütunu var
INSERT IGNORE INTO category_pdfs (name) 
VALUES ('Vergi ve Muhasibatliq Jurnallari');

-- Kategori ID-sini alırıq (yeni yaradılan və ya mövcud olan)
SET @category_id = (SELECT id FROM category_pdfs WHERE name = 'Vergi ve Muhasibatliq Jurnallari' LIMIT 1);

-- Əgər hələ də kategori yoxdursa, ilk mövcud kategori ID-sini istifadə edirik
SET @category_id = COALESCE(@category_id, (SELECT id FROM category_pdfs LIMIT 1));

-- Əgər heç bir kategori yoxdursa, xəta mesajı göstəririk
SELECT IF(@category_id IS NOT NULL, CONCAT('Kategori tapildi, ID: ', @category_id), 'XETA: Hec bir kategori yoxdur!') AS kategori_status;

-- 2023 ilinin ayları (3'erli gruplar)
INSERT INTO pdfs (title, description, language, file_path, cover_image_path, price, downloads, category_id, created_at, updated_at) VALUES
('Yanvar 2023', 'Yanvar 2023 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2023-01-01 00:00:00', NOW()),
('Fevral 2023', 'Fevral 2023 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2023-02-01 00:00:00', NOW()),
('Mart 2023', 'Mart 2023 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2023-03-01 00:00:00', NOW());

INSERT INTO pdfs (title, description, language, file_path, cover_image_path, price, downloads, category_id, created_at, updated_at) VALUES
('Aprel 2023', 'Aprel 2023 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2023-04-01 00:00:00', NOW()),
('May 2023', 'May 2023 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2023-05-01 00:00:00', NOW()),
('Iyun 2023', 'Iyun 2023 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2023-06-01 00:00:00', NOW());

INSERT INTO pdfs (title, description, language, file_path, cover_image_path, price, downloads, category_id, created_at, updated_at) VALUES
('Iyul 2023', 'Iyul 2023 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2023-07-01 00:00:00', NOW()),
('Avqust 2023', 'Avqust 2023 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2023-08-01 00:00:00', NOW()),
('Sentyabr 2023', 'Sentyabr 2023 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2023-09-01 00:00:00', NOW());

INSERT INTO pdfs (title, description, language, file_path, cover_image_path, price, downloads, category_id, created_at, updated_at) VALUES
('Oktyabr 2023', 'Oktyabr 2023 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2023-10-01 00:00:00', NOW()),
('Noyabr 2023', 'Noyabr 2023 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2023-11-01 00:00:00', NOW()),
('Dekabr 2023', 'Dekabr 2023 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2023-12-01 00:00:00', NOW());

-- 2024 ilinin ayları (3'erli gruplar)
INSERT INTO pdfs (title, description, language, file_path, cover_image_path, price, downloads, category_id, created_at, updated_at) VALUES
('Yanvar 2024', 'Yanvar 2024 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2024-01-01 00:00:00', NOW()),
('Fevral 2024', 'Fevral 2024 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2024-02-01 00:00:00', NOW()),
('Mart 2024', 'Mart 2024 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2024-03-01 00:00:00', NOW());

INSERT INTO pdfs (title, description, language, file_path, cover_image_path, price, downloads, category_id, created_at, updated_at) VALUES
('Aprel 2024', 'Aprel 2024 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2024-04-01 00:00:00', NOW()),
('May 2024', 'May 2024 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2024-05-01 00:00:00', NOW()),
('Iyun 2024', 'Iyun 2024 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2024-06-01 00:00:00', NOW());

INSERT INTO pdfs (title, description, language, file_path, cover_image_path, price, downloads, category_id, created_at, updated_at) VALUES
('Iyul 2024', 'Iyul 2024 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2024-07-01 00:00:00', NOW()),
('Avqust 2024', 'Avqust 2024 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2024-08-01 00:00:00', NOW()),
('Sentyabr 2024', 'Sentyabr 2024 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2024-09-01 00:00:00', NOW());

INSERT INTO pdfs (title, description, language, file_path, cover_image_path, price, downloads, category_id, created_at, updated_at) VALUES
('Oktyabr 2024', 'Oktyabr 2024 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2024-10-01 00:00:00', NOW()),
('Noyabr 2024', 'Noyabr 2024 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2024-11-01 00:00:00', NOW()),
('Dekabr 2024', 'Dekabr 2024 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2024-12-01 00:00:00', NOW());

-- 2025 ilinin ayları (3'erli gruplar)
INSERT INTO pdfs (title, description, language, file_path, cover_image_path, price, downloads, category_id, created_at, updated_at) VALUES
('Yanvar 2025', 'Yanvar 2025 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2025-01-01 00:00:00', NOW()),
('Fevral 2025', 'Fevral 2025 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2025-02-01 00:00:00', NOW()),
('Mart 2025', 'Mart 2025 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2025-03-01 00:00:00', NOW());

INSERT INTO pdfs (title, description, language, file_path, cover_image_path, price, downloads, category_id, created_at, updated_at) VALUES
('Aprel 2025', 'Aprel 2025 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2025-04-01 00:00:00', NOW()),
('May 2025', 'May 2025 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2025-05-01 00:00:00', NOW()),
('Iyun 2025', 'Iyun 2025 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2025-06-01 00:00:00', NOW());

INSERT INTO pdfs (title, description, language, file_path, cover_image_path, price, downloads, category_id, created_at, updated_at) VALUES
('Iyul 2025', 'Iyul 2025 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2025-07-01 00:00:00', NOW()),
('Avqust 2025', 'Avqust 2025 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2025-08-01 00:00:00', NOW()),
('Sentyabr 2025', 'Sentyabr 2025 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2025-09-01 00:00:00', NOW());

INSERT INTO pdfs (title, description, language, file_path, cover_image_path, price, downloads, category_id, created_at, updated_at) VALUES
('Oktyabr 2025', 'Oktyabr 2025 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2025-10-01 00:00:00', NOW()),
('Noyabr 2025', 'Noyabr 2025 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2025-11-01 00:00:00', NOW()),
('Dekabr 2025', 'Dekabr 2025 ayi ucun vergi ve muhasibatliq jurnali', 'az', '/uploads/pdfs/placeholder.pdf', NULL, 0.00, 0, @category_id, '2025-12-01 00:00:00', NOW());

-- Nəticəni yoxlayın
SELECT 
    YEAR(created_at) AS il,
    MONTH(created_at) AS ay,
    COUNT(*) AS pdf_sayi,
    GROUP_CONCAT(title ORDER BY created_at SEPARATOR ', ') AS pdfler
FROM pdfs
WHERE YEAR(created_at) IN (2023, 2024, 2025)
GROUP BY YEAR(created_at), MONTH(created_at)
ORDER BY YEAR(created_at), MONTH(created_at);

-- Cəmi sayı
SELECT 
    YEAR(created_at) AS il,
    COUNT(*) AS cemi_pdf_sayi
FROM pdfs
WHERE YEAR(created_at) IN (2023, 2024, 2025)
GROUP BY YEAR(created_at)
ORDER BY YEAR(created_at);

SELECT '36 PDF kaydi ugurla elave edildi!' AS mesaj;
