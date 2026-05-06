-- Create CVs table
CREATE TABLE IF NOT EXISTS `cvs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(100) DEFAULT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` INT DEFAULT 0 COMMENT 'File size in KB',
  `downloads` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_downloads` (`downloads`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

