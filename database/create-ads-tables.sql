-- Reklam alanları tablosu
CREATE TABLE IF NOT EXISTS `ad_spaces` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT 'Alan adı (örn: header-top)',
  `position` VARCHAR(100) NOT NULL COMMENT 'Pozisyon kodu',
  `description` TEXT DEFAULT NULL COMMENT 'Alan açıklaması',
  `width` INT(11) DEFAULT NULL COMMENT 'Genişlik (px)',
  `height` INT(11) DEFAULT NULL COMMENT 'Yükseklik (px)',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT 'Aktif mi?',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_position` (`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reklamlar tablosu
CREATE TABLE IF NOT EXISTS `ads` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `ad_space_id` INT(11) NOT NULL COMMENT 'Hangi alanda gösterilecek',
  `title` VARCHAR(255) NOT NULL COMMENT 'Reklam başlığı',
  `type` ENUM('banner', 'video') NOT NULL DEFAULT 'banner' COMMENT 'Reklam tipi',
  `content` TEXT NOT NULL COMMENT 'Resim URL (banner) veya video embed kodu (video)',
  `link_url` VARCHAR(500) DEFAULT NULL COMMENT 'Tıklanınca gidecek URL',
  `start_date` DATETIME DEFAULT NULL COMMENT 'Başlangıç tarihi',
  `end_date` DATETIME DEFAULT NULL COMMENT 'Bitiş tarihi',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT 'Aktif mi?',
  `click_count` INT(11) DEFAULT 0 COMMENT 'Tıklama sayısı',
  `view_count` INT(11) DEFAULT 0 COMMENT 'Görüntülenme sayısı',
  `priority` INT(11) DEFAULT 0 COMMENT 'Öncelik sırası (yüksek sayı = öncelikli)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ad_space_id` (`ad_space_id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_dates` (`start_date`, `end_date`),
  KEY `idx_priority` (`priority`),
  CONSTRAINT `fk_ads_ad_space` FOREIGN KEY (`ad_space_id`) REFERENCES `ad_spaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan reklam alanlarını ekle
INSERT INTO `ad_spaces` (`name`, `position`, `description`, `width`, `height`, `is_active`) VALUES
('Header Üstü', 'header-top', 'Header bileşeninin üstünde gösterilir', NULL, NULL, 1),
('Header Altı', 'header-bottom', 'Header bileşeninin altında gösterilir', NULL, NULL, 1),
('Sidebar Üstü', 'sidebar-top', 'Sidebar bileşeninin üstünde gösterilir', NULL, NULL, 1),
('Sidebar Ortası', 'sidebar-middle', 'Sidebar bileşeninin ortasında gösterilir', NULL, NULL, 1),
('Sidebar Altı', 'sidebar-bottom', 'Sidebar bileşeninin altında gösterilir', NULL, NULL, 1),
('Footer Üstü', 'footer-top', 'Footer bileşeninin üstünde gösterilir', NULL, NULL, 1),
('Footer Altı', 'footer-bottom', 'Footer bileşeninin altında gösterilir', NULL, NULL, 1),
('Ana Sayfa Hero Altı', 'home-hero-bottom', 'Ana sayfa hero bölümünün altında gösterilir', NULL, NULL, 1),
('Ana Sayfa Haberler Altı', 'home-news-bottom', 'Ana sayfa haberler bölümünün altında gösterilir', NULL, NULL, 1),
('Ana Sayfa Kütüphane Altı', 'home-library-bottom', 'Ana sayfa kütüphane bölümünün altında gösterilir', NULL, NULL, 1),
('İçerik Arası', 'content-between', 'Liste sayfalarında içerik arasında gösterilir', NULL, NULL, 1),
('Detay Sayfası Sidebar', 'detail-sidebar', 'Detay sayfalarının sidebar bölümünde gösterilir', NULL, NULL, 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `description`=VALUES(`description`);

