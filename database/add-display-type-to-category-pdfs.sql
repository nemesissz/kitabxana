-- Add display_type column to category_pdfs table (if not exists)
-- Check if column exists first
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'category_pdfs' 
  AND COLUMN_NAME = 'display_type';

-- Add column only if it doesn't exist
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `category_pdfs` ADD COLUMN `display_type` ENUM(''tax-journal'', ''other-books'') DEFAULT ''tax-journal'' AFTER `name`',
  'SELECT ''Column display_type already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing categories to have default display_type (if column was just added or values are NULL)
UPDATE `category_pdfs` SET `display_type` = 'tax-journal' WHERE `display_type` IS NULL;

