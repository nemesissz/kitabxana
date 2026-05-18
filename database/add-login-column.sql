-- login (istifadəçi adı) sütunu əlavə et
ALTER TABLE users ADD COLUMN IF NOT EXISTS login VARCHAR(100) NULL UNIQUE AFTER id;

-- Mövcud istifadəçilər üçün login-i email-dən al (@ işarəsindən əvvəlki hissə)
UPDATE users SET login = SUBSTRING_INDEX(email, '@', 1) WHERE login IS NULL;

-- login sütununu məcburi et
ALTER TABLE users MODIFY COLUMN login VARCHAR(100) NOT NULL UNIQUE;

-- email-i nullable et (artıq auth üçün istifadə edilmir)
ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL DEFAULT NULL;
