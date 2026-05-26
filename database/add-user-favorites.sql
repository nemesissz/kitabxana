-- User favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  pdf_id     INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_pdf (user_id, pdf_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pdf_id)  REFERENCES pdfs(id)  ON DELETE CASCADE,
  INDEX idx_fav_user (user_id)
);
