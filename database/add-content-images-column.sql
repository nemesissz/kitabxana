-- Add content_images_paths column to pdfs table
-- This column will store JSON array of content image paths

-- Add the column (without AFTER clause to avoid errors)
ALTER TABLE `pdfs` 
ADD COLUMN `content_images_paths` TEXT NULL COMMENT 'JSON array of content image paths';

-- If you want to update existing records to have empty array:
-- UPDATE `pdfs` SET `content_images_paths` = '[]' WHERE `content_images_paths` IS NULL;

