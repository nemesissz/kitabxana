-- ⚠️ XƏBƏRDARLIQ: Bu script BÜTÜN PDF-LƏRİ silir!
-- ⚠️ İlişkili ödəniş kayıtlarını da silir!
-- ⚠️ GERİ ALINMAZ! Öncə backup alın!

-- 1. Safe update mode-u geçici olaraq söndürürük
SET SQL_SAFE_UPDATES = 0;

-- 2. PDF-lərə aid ödəniş kayıtlarını silirik (əgər foreign key constraint yoxdursa)
-- Əgər foreign key constraint varsa, əvvəlcə onu yoxlamalısınız
DELETE FROM payments WHERE pdf_id IS NOT NULL;

-- 3. Bütün PDF-ləri silirik
DELETE FROM pdfs;

-- 4. Safe update mode-u yenidən açırıq
SET SQL_SAFE_UPDATES = 1;

-- 5. Nəticəni yoxlayırıq
SELECT COUNT(*) AS remaining_pdfs FROM pdfs;
SELECT COUNT(*) AS remaining_payments_with_pdf FROM payments WHERE pdf_id IS NOT NULL;

-- ✅ Script tamamlandı!

