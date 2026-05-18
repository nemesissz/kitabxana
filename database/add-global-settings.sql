-- Qlobal parametrlər cədvəli
CREATE TABLE IF NOT EXISTS global_settings (
  setting_key   VARCHAR(100) PRIMARY KEY,
  setting_value VARCHAR(500) NOT NULL DEFAULT '',
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Töhfəçilər üçün standart günlük yükləmə limiti (say). 0 = limitsiz.
INSERT INTO global_settings (setting_key, setting_value)
VALUES ('contributor_daily_upload_limit', '5')
ON DUPLICATE KEY UPDATE setting_value = setting_value;
kit