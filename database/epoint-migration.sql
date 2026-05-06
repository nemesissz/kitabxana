-- E-point ödəniş sistemi üçün payments cədvəlinə yeni sütunlar əlavə edirik

-- Əvvəlcə payments cədvəlinin mövcud olub-olmadığını yoxlayırıq
USE vergi_db;

-- E-point spesifik sütunları əlavə edirik
-- Əvvəlcə sütunların mövcud olub-olmadığını yoxlayırıq və əlavə edirik

-- epoint_transaction_id
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE table_schema = DATABASE() AND table_name = 'payments' 
                   AND column_name = 'epoint_transaction_id');
SET @query = IF(@col_exists = 0, 
                'ALTER TABLE payments ADD COLUMN epoint_transaction_id VARCHAR(255) NULL COMMENT "E-point transaction ID"',
                'SELECT "Column epoint_transaction_id already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- epoint_order_id
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE table_schema = DATABASE() AND table_name = 'payments' 
                   AND column_name = 'epoint_order_id');
SET @query = IF(@col_exists = 0, 
                'ALTER TABLE payments ADD COLUMN epoint_order_id VARCHAR(255) NULL COMMENT "Bizim yaratdığımız unique order ID"',
                'SELECT "Column epoint_order_id already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- payment_url
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE table_schema = DATABASE() AND table_name = 'payments' 
                   AND column_name = 'payment_url');
SET @query = IF(@col_exists = 0, 
                'ALTER TABLE payments ADD COLUMN payment_url TEXT NULL COMMENT "E-point checkout URL"',
                'SELECT "Column payment_url already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- payment_method
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE table_schema = DATABASE() AND table_name = 'payments' 
                   AND column_name = 'payment_method');
SET @query = IF(@col_exists = 0, 
                'ALTER TABLE payments ADD COLUMN payment_method VARCHAR(50) DEFAULT "epoint" COMMENT "Ödəniş metodu"',
                'SELECT "Column payment_method already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- card_mask
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE table_schema = DATABASE() AND table_name = 'payments' 
                   AND column_name = 'card_mask');
SET @query = IF(@col_exists = 0, 
                'ALTER TABLE payments ADD COLUMN card_mask VARCHAR(50) NULL COMMENT "Kart maskası (son 4 rəqəm)"',
                'SELECT "Column card_mask already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- payment_response
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE table_schema = DATABASE() AND table_name = 'payments' 
                   AND column_name = 'payment_response');
SET @query = IF(@col_exists = 0, 
                'ALTER TABLE payments ADD COLUMN payment_response JSON NULL COMMENT "E-point-dən gələn tam cavab"',
                'SELECT "Column payment_response already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index əlavə etmək (əgər yoxdursa)
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                     WHERE table_schema = DATABASE() AND table_name = 'payments' 
                     AND index_name = 'idx_epoint_transaction');
SET @query = IF(@index_exists = 0, 
                'ALTER TABLE payments ADD INDEX idx_epoint_transaction (epoint_transaction_id)',
                'SELECT "Index idx_epoint_transaction already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                     WHERE table_schema = DATABASE() AND table_name = 'payments' 
                     AND index_name = 'idx_epoint_order');
SET @query = IF(@index_exists = 0, 
                'ALTER TABLE payments ADD INDEX idx_epoint_order (epoint_order_id)',
                'SELECT "Index idx_epoint_order already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mövcud status enum-una yeni statuslar əlavə edə bilərik (əgər lazım olarsa)
-- ALTER TABLE payments MODIFY COLUMN status ENUM('pending', 'processing', 'success', 'failed', 'cancelled', 'refunded') DEFAULT 'pending';

-- Subscription planları üçün qiymətlər cədvəli (optional - əgər yoxdursa)
CREATE TABLE IF NOT EXISTS subscription_prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_code VARCHAR(10) UNIQUE NOT NULL COMMENT 'Plan kodu: 1m, 3m, 6m',
  plan_name VARCHAR(100) NOT NULL COMMENT 'Plan adı',
  price DECIMAL(10, 2) NOT NULL COMMENT 'Qiymət (AZN)',
  duration_months INT NOT NULL COMMENT 'Müddət (ay)',
  description TEXT NULL COMMENT 'Təsvir',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default subscription planlarını əlavə edirik
INSERT INTO subscription_prices (plan_code, plan_name, price, duration_months, description) 
VALUES 
  ('1m', '1 Aylıq Abunəlik', 9.99, 1, 'Bütün PDF-lərə 1 ay ərzində giriş'),
  ('3m', '3 Aylıq Abunəlik', 24.99, 3, 'Bütün PDF-lərə 3 ay ərzində giriş'),
  ('6m', '6 Aylıq Abunəlik', 39.99, 6, 'Bütün PDF-lərə 6 ay ərzində giriş')
ON DUPLICATE KEY UPDATE 
  plan_name = VALUES(plan_name),
  price = VALUES(price),
  duration_months = VALUES(duration_months),
  description = VALUES(description);

-- PDF-lər üçün price sütunu artıq var, amma əmin olmaq üçün:
-- ALTER TABLE pdfs ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0 COMMENT 'PDF qiyməti (AZN)';

SELECT '✅ E-point migration tamamlandı!' AS message;

