-- Müəssisələr cədvəli
CREATE TABLE IF NOT EXISTS institutions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_path VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- users cədvəlinə institution_id sütunu əlavə et
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS institution_id INT NULL AFTER role;

ALTER TABLE users
  ADD CONSTRAINT fk_user_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL;
