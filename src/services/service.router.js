import express from 'express';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getActiveServices,
  getServicesPreview
} from './service.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Mühasibat xidmətləri idarəetməsi
 */

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Bütün xidmətləri əldə etmək
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Aktiv xidmətlər filtri
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum qiymət filtri
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maksimum qiymət filtri
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Ad və ya təsvirə görə axtarış
 *     responses:
 *       200:
 *         description: Xidmətlər uğurla əldə edildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           price:
 *                             type: number
 *                           currency:
 *                             type: string
 *                           category:
 *                             type: string
 *                           is_active:
 *                             type: boolean
 *                           image:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: integer
 */
router.get('/', getAllServices);

/**
 * @swagger
 * /api/services/preview:
 *   get:
 *     summary: Son əlavə edilmiş xidmətlərin önizləməsi
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Qaytarılacaq xidmət sayı
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Aktiv xidmətlər filtri
 *     responses:
 *       200:
 *         description: Son xidmətlər uğurla əldə edildi
 */
router.get('/preview', getServicesPreview);

/**
 * @swagger
 * /api/services/active:
 *   get:
 *     summary: Yalnız aktiv xidmətləri əldə etmək
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: Aktiv xidmətlər uğurla əldə edildi
 */
router.get('/active', getActiveServices);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Xidməti ID-yə görə əldə etmək
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Xidmət ID-si
 *     responses:
 *       200:
 *         description: Xidmət uğurla əldə edildi
 *       404:
 *         description: Xidmət tapılmadı
 */
router.get('/:id', getServiceById);

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Yeni xidmət yaratmaq (Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Vergi məsləhəti"
 *               description:
 *                 type: string
 *                 example: "Vergi məsələləri üzrə peşəkar məsləhət"
 *               price:
 *                 type: number
 *                 example: 100.50
 *               currency:
 *                 type: string
 *                 default: "AZN"
 *                 example: "AZN"
 *               category:
 *                 type: string
 *                 example: "vergi"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               image:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *     responses:
 *       201:
 *         description: Xidmət uğurla yaradıldı
 *       400:
 *         description: Yanlış məlumatlar
 *       401:
 *         description: Authorized
 *       403:
 *         description: Giriş qadağandır
 */
router.post('/', authMiddleware, roleCheck(2), createService);

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Xidməti yeniləmək (Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Xidmət ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               category:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xidmət uğurla yeniləndi
 *       404:
 *         description: Xidmət tapılmadı
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Giriş qadağandır
 */
router.put('/:id', authMiddleware, roleCheck(2), updateService);

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Xidməti silmək (Admin only)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Xidmət ID-si
 *     responses:
 *       200:
 *         description: Xidmət uğurla silindi
 *       404:
 *         description: Xidmət tapılmadı
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Giriş qadağandır
 */
router.delete('/:id', authMiddleware, roleCheck(2), deleteService);

export default router;