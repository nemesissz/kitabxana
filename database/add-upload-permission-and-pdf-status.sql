-- İstifadəçi PDF yükləmə icazəsi
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS upload_permission ENUM('none','pending','free') NOT NULL DEFAULT 'none';

-- PDF statusu (pending = admin təsdiqi gözləyir, approved = yayımlanıb)
ALTER TABLE pdfs
  ADD COLUMN IF NOT EXISTS status ENUM('pending','approved') NOT NULL DEFAULT 'approved';

-- İndeks
ALTER TABLE pdfs ADD INDEX IF NOT EXISTS idx_pdfs_status (status);
