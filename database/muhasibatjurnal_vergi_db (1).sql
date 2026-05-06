-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Anamakine: localhost:3306
-- Üretim Zamanı: 04 Ara 2025, 10:23:50
-- Sunucu sürümü: 10.6.23-MariaDB-cll-lve
-- PHP Sürümü: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `muhasibatjurnal_vergi_db`
--

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `table_name` varchar(100) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `categories`
--

INSERT INTO `categories` (`id`, `name`, `created_at`) VALUES
(1, 'Vergi Qanunvericiliyi', '2025-10-04 13:12:04');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `category_pdfs`
--

CREATE TABLE `category_pdfs` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `category_pdfs`
--

INSERT INTO `category_pdfs` (`id`, `name`, `created_at`) VALUES
(15, 'Qanun və Vergi Jurnalı', '2025-11-15 13:33:46');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `news`
--

CREATE TABLE `news` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `image` varchar(500) DEFAULT NULL,
  `language` enum('az','ru','en') NOT NULL,
  `category_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('subscription','single-pdf') NOT NULL,
  `status` enum('pending','success','failed') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `epoint_transaction_id` varchar(255) DEFAULT NULL COMMENT 'E-point transaction ID',
  `epoint_order_id` varchar(255) DEFAULT NULL COMMENT 'Bizim yaratdığımız unique order ID',
  `payment_url` text DEFAULT NULL COMMENT 'E-point checkout URL',
  `payment_method` varchar(50) DEFAULT 'epoint' COMMENT 'Ödəniş metodu',
  `card_mask` varchar(50) DEFAULT NULL COMMENT 'Kart maskası (son 4 rəqəm)',
  `payment_response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'E-point-dən gələn tam cavab' CHECK (json_valid(`payment_response`)),
  `pdf_id` int(11) DEFAULT NULL COMMENT 'PDF ID (single-pdf ödənişləri üçün)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `payments`
--

INSERT INTO `payments` (`id`, `user_id`, `amount`, `type`, `status`, `created_at`, `epoint_transaction_id`, `epoint_order_id`, `payment_url`, `payment_method`, `card_mask`, `payment_response`, `pdf_id`) VALUES
(170, 28, 0.01, 'single-pdf', 'success', '2025-10-30 19:29:12', 'te010194884', 'SINGLE-PDF_28_1761852552125_8286d967', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=DDRwS8oR52dO1ZdOHNagxsD63Go%3D', 'epoint', '541124******9698', '{\"order_id\":\"SINGLE-PDF_28_1761852552125_8286d967\",\"status\":\"success\",\"code\":\"000\",\"message\":\"Təsdiq edildi\",\"transaction\":\"te010194884\",\"bank_transaction\":\"DDRwS8oR52dO1ZdOHNagxsD63Go=\",\"bank_response\":\"RESULT: OK\\nRESULT_CODE: 000\\n3DSECURE: AUTHENTICATED\\nRRN: 530323824395\\nAPPROVAL_CODE: 517603\\nCARD_NUMBER: 541124******9698\\nCARDNAME: Fikret sirinzade\",\"card_name\":\"Fikret sirinzade\",\"card_mask\":\"541124******9698\",\"card_expiry_date\":null,\"operation_code\":\"100\",\"rrn\":\"530323824395\",\"amount\":0.01,\"other_attr\":null}', 240),
(171, 28, 0.01, 'subscription', 'pending', '2025-10-30 19:36:47', 'te010195020', 'SUBSCRIPTION_28_1761853007654_94cf3d90', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=8pXYSE9NQwqRTeT23y4nLbXJfjc%3D', 'epoint', NULL, '{\"success\":true,\"paymentUrl\":\"https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=8pXYSE9NQwqRTeT23y4nLbXJfjc%3D\",\"transactionId\":\"te010195020\",\"orderId\":\"SUBSCRIPTION_28_1761853007654_94cf3d90\",\"status\":\"success\"}', NULL),
(172, 28, 1.00, 'single-pdf', 'pending', '2025-11-03 05:09:32', 'te010271840', 'SINGLE-PDF_28_1762146572162_eda50884', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=Uz1tD5C90CkWPoX3n9U1q1voZ9I%3D', 'epoint', NULL, '{\"success\":true,\"paymentUrl\":\"https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=Uz1tD5C90CkWPoX3n9U1q1voZ9I%3D\",\"transactionId\":\"te010271840\",\"orderId\":\"SINGLE-PDF_28_1762146572162_eda50884\",\"status\":\"success\"}', 244),
(173, 28, 20.00, 'single-pdf', 'pending', '2025-11-05 12:07:38', 'te010344878', 'SINGLE-PDF_28_1762344458316_f815f2e4', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=kwMEZbiPP2leluO9hfjMjOJSAIg%3D', 'epoint', NULL, '{\"success\":true,\"paymentUrl\":\"https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=kwMEZbiPP2leluO9hfjMjOJSAIg%3D\",\"transactionId\":\"te010344878\",\"orderId\":\"SINGLE-PDF_28_1762344458316_f815f2e4\",\"status\":\"success\"}', 246),
(174, 30, 0.03, 'single-pdf', 'success', '2025-11-05 17:43:12', 'te010356466', 'SINGLE-PDF_30_1762364592897_cf079102', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=ytV5sDOP4TqHSspC1ZRoQlT3Pr0%3D', 'epoint', '541124******9698', '{\"order_id\":\"SINGLE-PDF_30_1762364592897_cf079102\",\"status\":\"success\",\"code\":\"000\",\"message\":\"Təsdiq edildi\",\"transaction\":\"te010356466\",\"bank_transaction\":\"ytV5sDOP4TqHSspC1ZRoQlT3Pr0=\",\"bank_response\":\"RESULT: OK\\nRESULT_CODE: 000\\n3DSECURE: AUTHENTICATED\\nRRN: 530921422646\\nAPPROVAL_CODE: 074591\\nCARD_NUMBER: 541124******9698\\nCARDNAME: fikret\",\"card_name\":\"fikret\",\"card_mask\":\"541124******9698\",\"card_expiry_date\":null,\"operation_code\":\"100\",\"rrn\":\"530921422646\",\"amount\":0.03,\"other_attr\":null}', 248),
(175, 28, 0.05, 'single-pdf', 'success', '2025-11-05 17:47:45', 'te010356603', 'SINGLE-PDF_28_1762364865512_df40a887', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=0FocE3ua7T2HPzJMGGuYGSIj0Aw%3D', 'epoint', '541124******9698', '{\"order_id\":\"SINGLE-PDF_28_1762364865512_df40a887\",\"status\":\"success\",\"code\":\"000\",\"message\":\"Təsdiq edildi\",\"transaction\":\"te010356603\",\"bank_transaction\":\"0FocE3ua7T2HPzJMGGuYGSIj0Aw=\",\"bank_response\":\"RESULT: OK\\nRESULT_CODE: 000\\n3DSECURE: AUTHENTICATED\\nRRN: 530921463745\\nAPPROVAL_CODE: 120389\\nCARD_NUMBER: 541124******9698\\nCARDNAME: fikret\",\"card_name\":\"fikret\",\"card_mask\":\"541124******9698\",\"card_expiry_date\":null,\"operation_code\":\"100\",\"rrn\":\"530921463745\",\"amount\":0.05,\"other_attr\":null}', 248),
(176, 28, 0.01, 'single-pdf', 'success', '2025-11-05 17:50:45', 'te010356648', 'SINGLE-PDF_28_1762365045717_356ad38c', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=BKcNCvdHOFf1qz0bqlx3WLt6Gbw%3D', 'epoint', '541124******9698', '{\"order_id\":\"SINGLE-PDF_28_1762365045717_356ad38c\",\"status\":\"success\",\"code\":\"000\",\"message\":\"Təsdiq edildi\",\"transaction\":\"te010356648\",\"bank_transaction\":\"BKcNCvdHOFf1qz0bqlx3WLt6Gbw=\",\"bank_response\":\"RESULT: OK\\nRESULT_CODE: 000\\n3DSECURE: AUTHENTICATED\\nRRN: 530921491410\\nAPPROVAL_CODE: 687051\\nCARD_NUMBER: 541124******9698\\nCARDNAME: fikret\",\"card_name\":\"fikret\",\"card_mask\":\"541124******9698\",\"card_expiry_date\":null,\"operation_code\":\"100\",\"rrn\":\"530921491410\",\"amount\":0.01,\"other_attr\":null}', 247),
(177, 28, 0.01, 'single-pdf', 'success', '2025-11-05 17:59:22', 'te010356830', 'SINGLE-PDF_28_1762365562248_d499c9e8', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=7mFwsqRFEYhCgCCZzFE27gXI25A%3D', 'epoint', '541124******9698', '{\"order_id\":\"SINGLE-PDF_28_1762365562248_d499c9e8\",\"status\":\"success\",\"code\":\"000\",\"message\":\"Təsdiq edildi\",\"transaction\":\"te010356830\",\"bank_transaction\":\"7mFwsqRFEYhCgCCZzFE27gXI25A=\",\"bank_response\":\"RESULT: OK\\nRESULT_CODE: 000\\n3DSECURE: AUTHENTICATED\\nRRN: 530922557669\\nAPPROVAL_CODE: 655714\\nCARD_NUMBER: 541124******9698\\nCARDNAME: Fikret\",\"card_name\":\"Fikret\",\"card_mask\":\"541124******9698\",\"card_expiry_date\":null,\"operation_code\":\"100\",\"rrn\":\"530922557669\",\"amount\":0.01,\"other_attr\":null}', 246),
(178, 28, 0.01, 'single-pdf', 'success', '2025-11-05 18:03:58', 'te010356950', 'SINGLE-PDF_28_1762365838273_67c35977', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=FTnSn1olfI1eU6PzZvdslx1pVeo%3D', 'epoint', '541124******9698', '{\"order_id\":\"SINGLE-PDF_28_1762365838273_67c35977\",\"status\":\"success\",\"code\":\"000\",\"message\":\"Təsdiq edildi\",\"transaction\":\"te010356950\",\"bank_transaction\":\"FTnSn1olfI1eU6PzZvdslx1pVeo=\",\"bank_response\":\"RESULT: OK\\nRESULT_CODE: 000\\n3DSECURE: AUTHENTICATED\\nRRN: 530922590777\\nAPPROVAL_CODE: 905279\\nCARD_NUMBER: 541124******9698\\nCARDNAME: Fikret\",\"card_name\":\"Fikret\",\"card_mask\":\"541124******9698\",\"card_expiry_date\":null,\"operation_code\":\"100\",\"rrn\":\"530922590777\",\"amount\":0.01,\"other_attr\":null}', 245),
(181, 28, 16.00, 'single-pdf', 'pending', '2025-11-06 15:51:40', 'te010384544', 'SINGLE-PDF_28_1762444300054_e390b875', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=POdPmSSloo91AR8hDBC6nMsjBxQ%3D', 'epoint', NULL, '{\"success\":true,\"paymentUrl\":\"https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=POdPmSSloo91AR8hDBC6nMsjBxQ%3D\",\"transactionId\":\"te010384544\",\"orderId\":\"SINGLE-PDF_28_1762444300054_e390b875\",\"status\":\"success\"}', 250),
(182, 28, 5.00, 'single-pdf', 'success', '2025-11-06 15:52:41', 'te010384572', 'SINGLE-PDF_28_1762444361574_064a0361', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=6vNSreWJ06XdkLPmRyUOPtm5Avk%3D', 'epoint', '552209******1263', '{\"order_id\":\"SINGLE-PDF_28_1762444361574_064a0361\",\"status\":\"success\",\"code\":\"000\",\"message\":\"Təsdiq edildi\",\"transaction\":\"te010384572\",\"bank_transaction\":\"6vNSreWJ06XdkLPmRyUOPtm5Avk=\",\"bank_response\":\"RESULT: OK\\nRESULT_CODE: 000\\n3DSECURE: AUTHENTICATED\\nRRN: 531019322288\\nAPPROVAL_CODE: 625280\\nCARD_NUMBER: 552209******1263\\nCARDNAME: Muxtar\",\"card_name\":\"Muxtar\",\"card_mask\":\"552209******1263\",\"card_expiry_date\":null,\"operation_code\":\"100\",\"rrn\":\"531019322288\",\"amount\":5,\"other_attr\":null}', 250),
(183, 28, 0.01, 'subscription', 'success', '2025-11-06 16:12:07', 'te010385109', 'SUBSCRIPTION_28_1762445527241_4b6c4fe8', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=LewSoNN9GEqCFEEnSl10xSJfrAc%3D', 'epoint', '541124******9698', '{\"order_id\":\"SUBSCRIPTION_28_1762445527241_4b6c4fe8\",\"status\":\"success\",\"code\":\"000\",\"message\":\"Təsdiq edildi\",\"transaction\":\"te010385109\",\"bank_transaction\":\"LewSoNN9GEqCFEEnSl10xSJfrAc=\",\"bank_response\":\"RESULT: OK\\nRESULT_CODE: 000\\n3DSECURE: AUTHENTICATED\\nRRN: 531020557766\\nAPPROVAL_CODE: 643302\\nCARD_NUMBER: 541124******9698\\nCARDNAME: Terlan\",\"card_name\":\"Terlan\",\"card_mask\":\"541124******9698\",\"card_expiry_date\":null,\"operation_code\":\"100\",\"rrn\":\"531020557766\",\"amount\":0.01,\"other_attr\":null}', NULL),
(186, 28, 0.01, 'subscription', 'success', '2025-11-10 11:00:36', 'te010485740', 'SUBSCRIPTION_28_1762772436004_316611c0', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=hR8A2Xa6cQMte4E32LkVAdl7SUs%3D', 'epoint', '541124******9698', '{\"order_id\":\"SUBSCRIPTION_28_1762772436004_316611c0\",\"status\":\"success\",\"code\":\"000\",\"message\":\"Təsdiq edildi\",\"transaction\":\"te010485740\",\"bank_transaction\":\"hR8A2Xa6cQMte4E32LkVAdl7SUs=\",\"bank_response\":\"RESULT: OK\\nRESULT_CODE: 000\\n3DSECURE: AUTHENTICATED\\nRRN: 531415655280\\nAPPROVAL_CODE: 519691\\nCARD_NUMBER: 541124******9698\\nCARDNAME: Firet\",\"card_name\":\"Firet\",\"card_mask\":\"541124******9698\",\"card_expiry_date\":null,\"operation_code\":\"100\",\"rrn\":\"531415655280\",\"amount\":0.01,\"other_attr\":null}', NULL),
(187, 30, 0.01, 'single-pdf', 'pending', '2025-11-10 11:09:35', 'te010485995', 'SINGLE-PDF_30_1762772975069_70907b57', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=xLYgQhgTweSPq56bPXH39PZ71GI%3D', 'epoint', NULL, '{\"success\":true,\"paymentUrl\":\"https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=xLYgQhgTweSPq56bPXH39PZ71GI%3D\",\"transactionId\":\"te010485995\",\"orderId\":\"SINGLE-PDF_30_1762772975069_70907b57\",\"status\":\"success\"}', 246),
(188, 30, 0.01, 'subscription', 'pending', '2025-11-10 11:09:40', 'te010485997', 'SUBSCRIPTION_30_1762772980461_133f5507', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=8BV46JJd2lgUwRy9uXeaOSmq2yw%3D', 'epoint', NULL, '{\"success\":true,\"paymentUrl\":\"https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=8BV46JJd2lgUwRy9uXeaOSmq2yw%3D\",\"transactionId\":\"te010485997\",\"orderId\":\"SUBSCRIPTION_30_1762772980461_133f5507\",\"status\":\"success\"}', NULL),
(190, 34, 6.00, 'single-pdf', 'success', '2025-11-15 13:06:42', 'te010636781', 'SINGLE-PDF_34_1763212002894_9e360018', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=ALLsknpOIOAhFvZVLyJQ8HtIsS8%3D', 'epoint', '552209******1263', '{\"order_id\":\"SINGLE-PDF_34_1763212002894_9e360018\",\"status\":\"success\",\"code\":\"000\",\"message\":\"Təsdiq edildi\",\"transaction\":\"te010636781\",\"bank_transaction\":\"ALLsknpOIOAhFvZVLyJQ8HtIsS8=\",\"bank_response\":\"RESULT: OK\\nRESULT_CODE: 000\\n3DSECURE: AUTHENTICATED\\nRRN: 531917243891\\nAPPROVAL_CODE: 625870\\nCARD_NUMBER: 552209******1263\\nCARDNAME: MUXTAR ELIYEV\",\"card_name\":\"MUXTAR ELIYEV\",\"card_mask\":\"552209******1263\",\"card_expiry_date\":null,\"operation_code\":\"100\",\"rrn\":\"531917243891\",\"amount\":6,\"other_attr\":null}', 268),
(191, 28, 70.00, 'subscription', 'pending', '2025-11-15 13:30:39', 'te010637544', 'SUBSCRIPTION_28_1763213439065_413b52b6', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=Bv4xskLVna31aISUWT4pz57L1Xo%3D', 'epoint', NULL, '{\"success\":true,\"paymentUrl\":\"https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=Bv4xskLVna31aISUWT4pz57L1Xo%3D\",\"transactionId\":\"te010637544\",\"orderId\":\"SUBSCRIPTION_28_1763213439065_413b52b6\",\"status\":\"success\"}', NULL),
(192, 30, 0.01, 'single-pdf', 'success', '2025-11-23 13:07:43', 'te010869988', 'SINGLE-PDF_30_1763903263068_85c92520', 'https://ecomm.pashabank.az:443/ecomm2/ClientHandler?trans_id=fyrEepKnqfnCt3mc9PYpSeztYTY%3D', 'epoint', '541124******9698', '{\"order_id\":\"SINGLE-PDF_30_1763903263068_85c92520\",\"status\":\"success\",\"code\":\"000\",\"message\":\"Təsdiq edildi\",\"transaction\":\"te010869988\",\"bank_transaction\":\"fyrEepKnqfnCt3mc9PYpSeztYTY=\",\"bank_response\":\"RESULT: OK\\nRESULT_CODE: 000\\n3DSECURE: AUTHENTICATED\\nRRN: 532717471490\\nAPPROVAL_CODE: 926444\\nCARD_NUMBER: 541124******9698\\nCARDNAME: fikret\",\"card_name\":\"fikret\",\"card_mask\":\"541124******9698\",\"card_expiry_date\":null,\"operation_code\":\"100\",\"rrn\":\"532717471490\",\"amount\":0.01,\"other_attr\":null}', 270);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `pdfs`
--

CREATE TABLE `pdfs` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `language` enum('az','ru','az-ru') NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `cover_image_path` varchar(500) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `downloads` int(11) DEFAULT 0,
  `category_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `image_paths` varchar(500) DEFAULT NULL,
  `content_images_paths` text DEFAULT NULL COMMENT 'JSON array of content image paths'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `pdfs`
--

INSERT INTO `pdfs` (`id`, `title`, `description`, `language`, `file_path`, `cover_image_path`, `price`, `downloads`, `category_id`, `created_at`, `updated_at`, `image_paths`, `content_images_paths`) VALUES
(269, 'qv', 'Налоговый кодекс 2025', 'ru', '/home/muhasibatjurnal/backend-mmu/uploads/pdfs/1763571571061-439210158-Naloqoviy kodeks - 2025.pdf', '/home/muhasibatjurnal/backend-mmu/uploads/images/1763571571081-14330013-qanun JURNAL RUS.jpg', 15.00, 0, 15, '2025-10-31 21:00:00', '2025-11-19 16:59:31', NULL, '[\"/home/muhasibatjurnal/backend-mmu/uploads/images/1763571571084-74336932-mÃ¼hasibat p1-1.jpg\",\"/home/muhasibatjurnal/backend-mmu/uploads/images/1763571571088-434701025-mÃ¼hasibatlÄ±q 20-2.jpg\"]'),
(270, 'test', 'test', 'az', '/home/muhasibatjurnal/backend-mmu/uploads/pdfs/1763903153067-840435611-ÆliyevTÉrlanCv (1).pdf', NULL, 0.01, 0, 15, '2023-06-29 21:00:00', '2025-11-23 13:05:53', NULL, NULL);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) DEFAULT 'AZN',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `services`
--

INSERT INTO `services` (`id`, `name`, `description`, `price`, `currency`, `is_active`, `created_at`, `updated_at`) VALUES
(3, 'Audit xidməti', 'Müstəqil audit xidməti', 500.00, 'AZN', 1, '2025-10-10 07:54:25', '2025-11-06 16:30:54'),
(14, 'Sahibkarlara Xidmət', 'Sahibkarlarların rüblük hesabatlarının tərtib edilməsi və vergi orqanlarına təqdim edilməsi.Aşağıdaki qiymət aylıq xidmət üçün nəzərdə tutulub.Ətrafli məlumat üçün +994 55 210 85 97 nömrəsi ilə əlaqə saxlaya bilərsiniz', 100.00, 'AZN', 1, '2025-11-06 16:36:35', '2025-11-06 16:36:35'),
(15, 'Hüquqi şəxslərə xidmət', 'Huqui sexselere (sadelesdirilmi vergi,edv,menfeet vergisi) hesabatlarının tərtib edilməsi və vergi orqanlarına təqdim edilməsi.Aşağıdaki qiymət aylıq xidmət üçün nəzərdə tutulub.Ətrafli məlumat üçün +994 55 210 85 97 nömrəsi ilə əlaqə saxlaya bilərsiniz', 350.00, 'AZN', 1, '2025-11-06 16:39:03', '2025-11-06 16:39:03'),
(16, 'Vergi konsultasiyasi', 'Vergilere ve dsmf-e aid olan sualara cavab', 50.00, 'AZN', 1, '2025-11-06 16:40:00', '2025-11-06 16:40:00');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `plan` enum('1m','3m','6m') NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `start_date` timestamp NULL DEFAULT current_timestamp(),
  `end_date` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `status` enum('active','cancelled') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `subscription_prices`
--

CREATE TABLE `subscription_prices` (
  `id` int(11) NOT NULL,
  `plan_code` varchar(10) NOT NULL COMMENT 'Plan kodu: 1m, 3m, 6m',
  `plan_name` varchar(100) NOT NULL COMMENT 'Plan adı',
  `price` decimal(10,2) NOT NULL COMMENT 'Qiymət (AZN)',
  `duration_months` int(11) NOT NULL COMMENT 'Müddət (ay)',
  `description` text DEFAULT NULL COMMENT 'Təsvir',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `subscription_prices`
--

INSERT INTO `subscription_prices` (`id`, `plan_code`, `plan_name`, `price`, `duration_months`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '1m', '1 Aylıq Abunəlik', 40.00, 1, 'Bütün PDF-lərə 1 ay ərzində giriş', 1, '2025-10-21 13:22:43', '2025-11-15 13:31:45'),
(2, '3m', '3 Aylıq Abunəlik', 100.00, 3, 'Bütün PDF-lərə 3 ay ərzində giriş', 1, '2025-10-21 13:22:43', '2025-11-06 16:28:52'),
(3, '6m', '6 Aylıq Abunəlik', 150.00, 6, 'Bütün PDF-lərə 6 ay ərzində giriş', 1, '2025-10-21 13:22:43', '2025-11-06 16:28:22'),
(10, '12m', '12 ay', 280.00, 12, '12 ayliq abunelik', 1, '2025-10-30 17:20:46', '2025-11-06 16:28:13');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` tinyint(4) DEFAULT 1 COMMENT '1=User, 2=Admin, 3=Supadmin',
  `is_verified` tinyint(1) DEFAULT 0,
  `edu_email` tinyint(1) DEFAULT 0,
  `profile_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `role`, `is_verified`, `edu_email`, `profile_id`, `created_at`, `updated_at`) VALUES
(1, 'admin@vergi.az', '$2b$10$mv41j6S.LBvJjUuh6A32tO5M.6ctBJ/wzR6deryGSGUzGM1FpS84G', 3, 1, 0, 1, '2025-10-04 13:12:04', '2025-10-04 13:59:29'),
(28, '01terlaneliyev@gmail.com', '$2b$10$9g3nPL7QNDGkDSPUeNUW0OSsvpEwqriQhd8OxwwaURPBXC9.mN2ju', 1, 0, 0, NULL, '2025-10-30 16:48:27', '2025-10-30 16:48:27'),
(30, 'aliyev.tarlan.ilkin.2025@unec.edu.az', '$2b$10$K.s1sVD67Yp3QQv4x/9wV.L1KgX6GUXwzLnV98k69DCWv7RFPVhgS', 1, 0, 1, NULL, '2025-11-05 17:41:33', '2025-11-05 17:41:33'),
(34, 'm.aliyev@mail.ru', '$2b$10$/fTzc6/QyNEqwsW/pGBMzOvwvsgBqDDKxqpD1xwdlJk2J9XplO0g.', 1, 0, 0, NULL, '2025-11-15 13:06:12', '2025-11-15 13:06:12');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `user_activity_logs`
--

CREATE TABLE `user_activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(64) NOT NULL,
  `ref_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `user_activity_logs`
--

INSERT INTO `user_activity_logs` (`id`, `user_id`, `action`, `ref_id`, `created_at`) VALUES
(1, 30, 'purchase_checkout', NULL, '2025-11-05 17:43:12'),
(2, 28, 'purchase_checkout', NULL, '2025-11-05 17:47:45'),
(3, 28, 'purchase_checkout', NULL, '2025-11-05 17:50:45'),
(4, 28, 'purchase_checkout', NULL, '2025-11-05 17:59:22'),
(5, 28, 'purchase_checkout', NULL, '2025-11-05 18:03:58'),
(6, 31, 'purchase_checkout', NULL, '2025-11-06 08:44:04'),
(7, 31, 'purchase_checkout', NULL, '2025-11-06 08:44:11'),
(8, 28, 'purchase_checkout', NULL, '2025-11-06 15:51:40'),
(9, 28, 'purchase_checkout', NULL, '2025-11-06 15:52:41'),
(10, 28, 'purchase_checkout', NULL, '2025-11-06 16:12:07'),
(11, 32, 'purchase_checkout', NULL, '2025-11-09 16:11:12'),
(12, 32, 'purchase_checkout', NULL, '2025-11-09 16:15:20'),
(13, 28, 'purchase_checkout', NULL, '2025-11-10 11:00:36'),
(14, 30, 'purchase_checkout', NULL, '2025-11-10 11:09:35'),
(15, 30, 'purchase_checkout', NULL, '2025-11-10 11:09:40'),
(16, 33, 'purchase_checkout', NULL, '2025-11-10 20:54:46'),
(17, 34, 'purchase_checkout', NULL, '2025-11-15 13:06:42'),
(18, 28, 'purchase_checkout', NULL, '2025-11-15 13:30:39'),
(19, 30, 'purchase_checkout', NULL, '2025-11-23 13:07:43');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `user_devices`
--

CREATE TABLE `user_devices` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `device_fingerprint` varchar(128) NOT NULL,
  `user_agent` text DEFAULT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_seen` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `user_devices`
--

INSERT INTO `user_devices` (`id`, `user_id`, `device_fingerprint`, `user_agent`, `ip`, `created_at`, `last_seen`) VALUES
(1, 30, 'b1928b8f102d2ebae4192d575ab960d6e4ce296e11212d89f2ec04e993938733', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '5.44.34.194', '2025-11-05 17:43:12', '2025-11-05 17:43:12'),
(2, 28, 'b1928b8f102d2ebae4192d575ab960d6e4ce296e11212d89f2ec04e993938733', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '5.44.34.194', '2025-11-05 17:47:45', '2025-11-05 18:03:58'),
(6, 31, 'cc5f4aed6c548073579260242382bfb0fe87ac8661e095035de80c72bf1dcaaf', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '62.212.226.125', '2025-11-06 08:44:04', '2025-11-06 08:44:11'),
(8, 28, 'c757562e919899e12642d5d9c4c91a4a941a652119cc54bb754c37cc94b3bab2', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '46.32.191.197', '2025-11-06 15:51:40', '2025-11-15 13:30:39'),
(10, 28, '286eb5ff66298962bc0a5c0a55570e513f323baffa16c298bae0fd2f96c7d727', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '5.44.35.80', '2025-11-06 16:12:07', '2025-11-06 16:12:07'),
(11, 32, '163a39b782c229aab662de82a3e8b7469418f5da42b8beaeaef3570a679816f2', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_12 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6.1 Mobile/15E148 Safari/604.1', '188.253.220.38', '2025-11-09 16:11:12', '2025-11-09 16:15:20'),
(13, 28, '1a11d7d3488fab4261a64bb15e55ee49a484b476416fe3af3c0cd1f6cbf0dc22', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '46.22.232.157', '2025-11-10 11:00:35', '2025-11-10 11:00:35'),
(14, 30, '8250f989866d298814523e5fc98ec5671dc9502005024891cf1541bae3adff1f', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '46.22.234.102', '2025-11-10 11:09:35', '2025-11-10 11:09:40'),
(16, 33, '08c3a673cb99cb9dfb29b77c70c2d71a0a4b124e617bebc12e9701009646a885', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', '2a02:3032:203:de6a:2d2f:954a:a35e:3827', '2025-11-10 20:54:46', '2025-11-10 20:54:46'),
(17, 34, 'b6d40bda30768a9ee6b81e1013475cdd62e09847fbb0314078d5951f97fdceb8', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36', '5.44.34.199', '2025-11-15 13:06:42', '2025-11-15 13:06:42'),
(19, 30, 'b81ce96b98ff7bb2ba2088418e10dd558353fd3cab29d3443f53665e5a0f392a', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '37.61.121.98', '2025-11-23 13:07:43', '2025-11-23 13:07:43');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `user_profiles`
--

CREATE TABLE `user_profiles` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `user_profiles`
--

INSERT INTO `user_profiles` (`id`, `full_name`, `phone`, `company`, `position`, `created_at`, `updated_at`) VALUES
(1, 'System Admin', '+994501234567', 'Vergi.az', 'Super Administrator', '2025-10-04 13:12:04', '2025-10-04 13:12:04');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `user_subscriptions`
--

CREATE TABLE `user_subscriptions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subscription_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_table_name` (`table_name`);

--
-- Tablo için indeksler `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Tablo için indeksler `category_pdfs`
--
ALTER TABLE `category_pdfs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Tablo için indeksler `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_language` (`language`),
  ADD KEY `idx_category` (`category_id`);

--
-- Tablo için indeksler `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_epoint_transaction` (`epoint_transaction_id`),
  ADD KEY `idx_epoint_order` (`epoint_order_id`);

--
-- Tablo için indeksler `pdfs`
--
ALTER TABLE `pdfs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_language` (`language`),
  ADD KEY `idx_category` (`category_id`),
  ADD KEY `idx_price` (`price`);

--
-- Tablo için indeksler `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Tablo için indeksler `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_end_date` (`end_date`);

--
-- Tablo için indeksler `subscription_prices`
--
ALTER TABLE `subscription_prices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plan_code` (`plan_code`);

--
-- Tablo için indeksler `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `profile_id` (`profile_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- Tablo için indeksler `user_activity_logs`
--
ALTER TABLE `user_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_action_time` (`user_id`,`action`,`created_at`);

--
-- Tablo için indeksler `user_devices`
--
ALTER TABLE `user_devices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_user_device` (`user_id`,`device_fingerprint`);

--
-- Tablo için indeksler `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`id`);

--
-- Tablo için indeksler `user_subscriptions`
--
ALTER TABLE `user_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_subscription` (`user_id`,`subscription_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_subscription_id` (`subscription_id`);

--
-- Dökümü yapılmış tablolar için AUTO_INCREMENT değeri
--

--
-- Tablo için AUTO_INCREMENT değeri `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Tablo için AUTO_INCREMENT değeri `category_pdfs`
--
ALTER TABLE `category_pdfs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Tablo için AUTO_INCREMENT değeri `news`
--
ALTER TABLE `news`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Tablo için AUTO_INCREMENT değeri `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=193;

--
-- Tablo için AUTO_INCREMENT değeri `pdfs`
--
ALTER TABLE `pdfs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=271;

--
-- Tablo için AUTO_INCREMENT değeri `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Tablo için AUTO_INCREMENT değeri `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Tablo için AUTO_INCREMENT değeri `subscription_prices`
--
ALTER TABLE `subscription_prices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Tablo için AUTO_INCREMENT değeri `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- Tablo için AUTO_INCREMENT değeri `user_activity_logs`
--
ALTER TABLE `user_activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- Tablo için AUTO_INCREMENT değeri `user_devices`
--
ALTER TABLE `user_devices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- Tablo için AUTO_INCREMENT değeri `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Tablo için AUTO_INCREMENT değeri `user_subscriptions`
--
ALTER TABLE `user_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- Dökümü yapılmış tablolar için kısıtlamalar
--

--
-- Tablo kısıtlamaları `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Tablo kısıtlamaları `news`
--
ALTER TABLE `news`
  ADD CONSTRAINT `news_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `pdfs`
--
ALTER TABLE `pdfs`
  ADD CONSTRAINT `fk_pdfs_category_pdfs` FOREIGN KEY (`category_id`) REFERENCES `category_pdfs` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `user_profiles` (`id`) ON DELETE SET NULL;

--
-- Tablo kısıtlamaları `user_subscriptions`
--
ALTER TABLE `user_subscriptions`
  ADD CONSTRAINT `user_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_subscriptions_ibfk_2` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
