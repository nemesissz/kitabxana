CREATE TABLE IF NOT EXISTS languages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  flag VARCHAR(10) NULL COMMENT 'ISO 3166-1 alpha-2 country code (flag-icons library ucun)',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO languages (code, name, flag) VALUES
  ('az', 'Azarbaycan dili', 'az'),
  ('ru', 'Rus dili',        'ru'),
  ('en', 'Ingilis dili',    'gb')
ON DUPLICATE KEY UPDATE name = VALUES(name), flag = VALUES(flag);

-- Movcut emoji deyerlerini olke koduna yenile
UPDATE languages SET flag = 'az' WHERE code = 'az';
UPDATE languages SET flag = 'ru' WHERE code = 'ru';
UPDATE languages SET flag = 'gb' WHERE code = 'en';
