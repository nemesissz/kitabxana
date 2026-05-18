-- 1. pdfs cədvəlinə institution_id əlavə et (fiziki kitabın yerləşdiyi müəssisə)
ALTER TABLE pdfs
  ADD COLUMN IF NOT EXISTS institution_id INT NULL AFTER category_id;

ALTER TABLE pdfs
  ADD CONSTRAINT fk_pdf_institution FOREIGN KEY (institution_id)
    REFERENCES institutions(id) ON DELETE SET NULL;

-- 2. Kirayə sorğuları cədvəli
CREATE TABLE IF NOT EXISTS book_rentals (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  pdf_id         INT NOT NULL,
  user_id        INT NOT NULL,
  institution_id INT NOT NULL,
  duration_days  INT NOT NULL,
  status         ENUM('pending','approved','rejected','returned') NOT NULL DEFAULT 'pending',
  start_date     DATE NULL,
  end_date       DATE NULL,
  reviewed_by    INT NULL,
  reviewed_at    TIMESTAMP NULL,
  notes          TEXT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pdf_id)         REFERENCES pdfs(id)         ON DELETE CASCADE,
  FOREIGN KEY (user_id)        REFERENCES users(id)        ON DELETE CASCADE,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by)    REFERENCES users(id)        ON DELETE SET NULL,
  INDEX idx_rental_inst_status (institution_id, status),
  INDEX idx_rental_user        (user_id)
);
