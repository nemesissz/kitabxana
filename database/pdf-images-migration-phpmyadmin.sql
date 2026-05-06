UPDATE `pdfs` 
SET `image_paths` = CAST(CONCAT('["', REPLACE(`cover_image_path`, '\\', '\\\\'), '"]') AS JSON)
WHERE `cover_image_path` IS NOT NULL 
  AND `cover_image_path` != '' 
  AND (`image_paths` IS NULL);

SELECT `id`, `title`, `cover_image_path`, `image_paths` 
FROM `pdfs` 
LIMIT 10;

