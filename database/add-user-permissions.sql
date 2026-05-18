-- İstifadəçi icazə sütunları
ALTER TABLE users
  ADD COLUMN category_permission ENUM('direct', 'request', 'none') NOT NULL DEFAULT 'request',
  ADD COLUMN language_permission ENUM('direct', 'request', 'none') NOT NULL DEFAULT 'request',
  ADD COLUMN pdf_review_permission ENUM('allowed', 'none') NOT NULL DEFAULT 'none';

-- upload_permission sütununa 'none' dəyərini əlavə et
ALTER TABLE users
  MODIFY COLUMN upload_permission ENUM('free', 'pending', 'none') NOT NULL DEFAULT 'pending';

-- Main müəssisə işçiləri və müdirləri (role 2-3) tam icazə alır
UPDATE users u
INNER JOIN institutions i ON u.institution_id = i.id
SET
  u.category_permission    = 'direct',
  u.language_permission    = 'direct',
  u.pdf_review_permission  = 'allowed',
  u.upload_permission      = 'free'
WHERE i.is_main = 1
  AND u.role BETWEEN 2 AND 3;

-- Superadminlər (role >= 4) tam icazə alır
UPDATE users
SET
  category_permission    = 'direct',
  language_permission    = 'direct',
  pdf_review_permission  = 'allowed',
  upload_permission      = 'free'
WHERE role >= 4;
