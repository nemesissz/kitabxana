-- Activity Logs cədvəli
CREATE TABLE IF NOT EXISTS activity_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  event_type  VARCHAR(50)  NOT NULL,
  actor_email VARCHAR(255) NULL,
  target_type VARCHAR(50)  NULL,
  target_id   INT          NULL,
  details     JSON         NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_logs_event   (event_type),
  INDEX idx_logs_created (created_at)
);
