CREATE TABLE IF NOT EXISTS institution_join_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  institution_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by INT NULL,
  CONSTRAINT fk_ijr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ijr_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  INDEX idx_ijr_inst_status (institution_id, status),
  INDEX idx_ijr_user (user_id)
);
