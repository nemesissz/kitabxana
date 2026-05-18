CREATE TABLE IF NOT EXISTS upload_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scope_type ENUM('default', 'institution', 'user') NOT NULL,
  scope_id INT NULL,
  limit_mb DECIMAL(6,1) NOT NULL DEFAULT 20,
  updated_by INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_scope (scope_type, scope_id)
);

-- Standart default limit (20 MB)
INSERT INTO upload_limits (scope_type, scope_id, limit_mb)
VALUES ('default', NULL, 20)
ON DUPLICATE KEY UPDATE limit_mb = limit_mb;
