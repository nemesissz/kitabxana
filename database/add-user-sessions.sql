CREATE TABLE IF NOT EXISTS user_sessions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  session_id    VARCHAR(64)  NOT NULL,
  user_id       INT          NULL,
  total_seconds INT          NOT NULL DEFAULT 0,
  last_seen     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_id (session_id),
  INDEX idx_user_id    (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
