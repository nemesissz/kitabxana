ALTER TABLE users
  ADD COLUMN IF NOT EXISTS worker_type ENUM('elektron', 'fiziki') NULL DEFAULT NULL
  AFTER upload_permission;
