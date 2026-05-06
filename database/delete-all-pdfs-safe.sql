-- ⚠️ XƏBƏRDARLIQ: Bu script BÜTÜN PDF-LƏRİ silir!
-- ⚠️ GERİ ALINMAZ! Öncə backup alın!

-- Bu versiya WHERE koşulu ilə işləyir (safe mode açıq olsa belə)

-- 1. Əvvəlcə ilişkili ödəniş kayıtlarını silirik
DELETE FROM payments WHERE pdf_id IS NOT NULL AND pdf_id > 0;

-- 2. Bütün PDF-ləri silirik (WHERE koşulu ilə)
DELETE FROM pdfs WHERE id > 0;

-- 3. Nəticəni yoxlayırıq
SELECT COUNT(*) AS remaining_pdfs FROM pdfs;
SELECT COUNT(*) AS remaining_payments_with_pdf FROM payments WHERE pdf_id IS NOT NULL;

-- ✅ Script tamamlandı!

