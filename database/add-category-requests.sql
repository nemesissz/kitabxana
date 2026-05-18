-- Category requests table: non-main institution admins submit requests
-- for adding or editing categories; global admins approve/reject them.
CREATE TABLE IF NOT EXISTS category_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('add', 'edit') NOT NULL,
  requested_by INT NOT NULL,
  category_id INT NULL,
  name VARCHAR(255) NOT NULL,
  pdf_type ENUM('kitab', 'emr', 'serecam') NOT NULL DEFAULT 'emr',
  display_type VARCHAR(50) NOT NULL DEFAULT 'tax-journal',
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  requester_institution_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by INT NULL
);
