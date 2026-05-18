-- İstifadəçilərin oxuduğu PDF-lərin izlənməsi
CREATE TABLE IF NOT EXISTS user_pdf_reads (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  pdf_id     INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_pdf_read (user_id, pdf_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pdf_id)  REFERENCES pdfs(id)  ON DELETE CASCADE
);

-- İstifadəçilərin yüklədiyinin izlənməsi
CREATE TABLE IF NOT EXISTS user_pdf_downloads (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  pdf_id     INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_pdf_download (user_id, pdf_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pdf_id)  REFERENCES pdfs(id)  ON DELETE CASCADE
);
