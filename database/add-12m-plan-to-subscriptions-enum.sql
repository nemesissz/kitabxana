-- subscriptions table-ının plan sütununa '12m' enum dəyərini əlavə etmək
-- PHPMyAdmin-də bu SQL-i icra edin

ALTER TABLE `subscriptions` 
MODIFY COLUMN `plan` ENUM('1m','3m','6m','12m') NOT NULL;

-- Yoxlamaq üçün:
-- SELECT DISTINCT plan FROM subscriptions;

