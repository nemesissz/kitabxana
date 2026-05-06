import express from 'express';
import {
  createPdf,
  getAllPdfs,
  getPdfById,
  updatePdf,
  deletePdf,
  downloadPdf,
  getPdfsPreview,
  getMyAccessiblePdfs,
  checkPdfAccess
} from './pdf.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { optionalAuthMiddleware } from '../middlewares/optionalAuth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';
import mixedUpload from '../utils/mixedUpload.js';
// limiter'lar çıxarıldı

const router = express.Router();

/**
 * @swagger
 * /pdfs:
 * get:
 * tags:
 * - PDFs
 * summary: Bütün PDF-ləri almaq
 * parameters:
 * - in: query
 * name: categoryId
 * schema:
 * type: integer
 * - in: query
 * name: language
 * schema:
 * type: string
 * enum: [az, ru, az-ru]
 * responses:
 * 200:
 * description: PDF-lər uğurla əldə edildi
 */
router.get('/', optionalAuthMiddleware, getAllPdfs);

/**
 * @swagger
 * /pdfs/preview:
 *   get:
 *     tags:
 *       - PDFs
 *     summary: Son əlavə edilmiş PDF-lərin önizləməsi
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Qaytarılacaq PDF sayı
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Kateqoriya filtri
 *     responses:
 *       200:
 *         description: Son PDF-lər uğurla əldə edildi
 */
router.get('/preview', optionalAuthMiddleware, getPdfsPreview);

/**
 * @swagger
 * /pdfs/my-accessible:
 * get:
 * tags:
 * - PDFs
 * summary: İstifadəçinin girişi olan bütün PDF-ləri əldə etmək
 * description: Subscription və ya tək-tək alınmış PDF-ləri qaytarır
 * security:
 * - BearerAuth: []
 * responses:
 * 200:
 * description: Giriş olan PDF-lər uğurla əldə edildi
 */
router.get('/my-accessible',
  authMiddleware,
  getMyAccessiblePdfs
);

/**
 * @swagger
 * /pdfs/{id}/check-access:
 * get:
 * tags:
 * - PDFs
 * summary: PDF-ə giriş imkanını yoxlamaq
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Giriş statusu uğurla yoxlandı
 */
router.get('/:id/check-access',
  authMiddleware,
  checkPdfAccess
);

/**
 * @swagger
 * /pdfs/{id}/download:
 * get:
 * tags:
 * - PDFs
 * summary: PDF-i yükləmək
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: PDF uğurla yükləndi
 * 403:
 * description: Giriş rədd edildi - ödəniş tələb olunur
 * 404:
 * description: PDF tapılmadı
 */
router.get('/:id/download', authMiddleware, downloadPdf);

/**
 * @swagger
 * /pdfs/{id}:
 * get:
 * tags:
 * - PDFs
 * summary: PDF məlumatlarını ID ilə almaq
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: PDF uğurla əldə edildi
 * 404:
 * description: PDF tapılmadı
 */
router.get('/:id', optionalAuthMiddleware, getPdfById);

/**
 * @swagger
 * /pdfs:
 * post:
 * tags:
 * - PDFs
 * summary: Yeni PDF əlavə etmək
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * required:
 * - title
 * - file
 * - categoryId
 * - price
 * - language
 * properties:
 * title:
 * type: string
 * description: PDF-in başlığı
 * file:
 * type: string
 * format: binary
 * description: PDF faylı (maksimum 10MB)
 * categoryId:
 * type: integer
 * description: Kateqoriya ID-si
 * price:
 * type: number
 * description: PDF-in qiyməti
 * language:
 * type: string
 * enum: [az, ru, az-ru]
 * description: PDF-in dili
 * responses:
 * 201:
 * description: PDF uğurla yaradıldı
 * 400:
 * description: Yanlış məlumatlar
 * 401:
 * description: Unauthorized
 * 403:
 * description: İcazə yoxdur
 */
router.post('/',
  authMiddleware,
  roleCheck(2),
  mixedUpload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
    { name: 'contentImages', maxCount: 20 }
  ]),
  createPdf
);

/**
 * @swagger
 * /pdfs/{id}:
 * put:
 * tags:
 * - PDFs
 * summary: PDF məlumatlarını yeniləmək
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * properties:
 * title:
 * type: string
 * file:
 * type: string
 * format: binary
 * categoryId:
 * type: integer
 * price:
 * type: number
 * language:
 * type: string
 * enum: [az, ru, az-ru]
 * responses:
 * 200:
 * description: PDF uğurla yeniləndi
 * 404:
 * description: PDF tapılmadı
 */
router.put('/:id',
  authMiddleware,
  roleCheck(2),
  mixedUpload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  updatePdf
);

/**
 * @swagger
 * /pdfs/{id}:
 * delete:
 * tags:
 * - PDFs
 * summary: PDF silmək
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: PDF uğurla silindi
 * 404:
 * description: PDF tapılmadı
 */
router.delete('/:id',
  authMiddleware,
  roleCheck(2),
  deletePdf
);

export default router;