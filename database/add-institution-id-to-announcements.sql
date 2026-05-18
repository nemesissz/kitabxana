-- announcements cədvəlinə institution_id sütunu əlavə et
-- NULL = ümumi (bütün istifadəçilərə görünür)
-- Dəyər varsa = yalnız həmin müəssisənin üzvlərinə görünür

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS institution_id INT NULL AFTER is_active;

ALTER TABLE announcements
  ADD CONSTRAINT fk_announcement_institution
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ann_institution ON announcements (institution_id);
