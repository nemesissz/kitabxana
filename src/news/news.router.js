import express from 'express';
import {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews
} from './news.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';
import upload from '../utils/imageUpload.js';

const router = express.Router();

/**
 * @swagger
 * /news:
 * get:
 * tags:
 * - News
 * summary: Bütün xəbərləri əldə etmək
 * parameters:
 * - in: query
 * name: page
 * schema:
 * type: integer
 * description: Səhifə nömrəsi
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * description: Hər səhifədəki xəbər sayı
 * responses:
 * 200:
 * description: Xəbərlər uğurla əldə edildi
 */
router.get('/', getAllNews);

/**
 * @swagger
 * /news/{id}:
 * get:
 * tags:
 * - News
 * summary: Xəbər məlumatlarını ID-yə görə əldə etmək
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Xəbər məlumatları uğurla əldə edildi
 * 404:
 * description: Xəbər tapılmadı
 */
router.get('/:id', getNewsById);

/**
 * @swagger
 * /news:
 * post:
 * tags:
 * - News
 * summary: Yeni xəbər yaratmaq
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
 * - content
 * - language
 * - categoryId
 * properties:
 * title:
 * type: string
 * content:
 * type: string
 * language:
 * type: string
 * enum: [az, ru, en]
 * categoryId:
 * type: integer
 * image:
 * type: string
 * format: binary
 * responses:
 * 201:
 * description: Xəbər uğurla yaradıldı
 * 400:
 * description: Yanlış məlumat
 */
router.post(
  '/',
  authMiddleware,
  roleCheck(2),
  upload.single('image'),
  createNews
);/**
 * @swagger
 * /news/{id}:
 * put:
 * tags:
 * - News
 * summary: Xəbər məlumatlarını yeniləmək
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * properties:
 * title:
 * type: string
 * content:
 * type: string
 * image:
 * type: string
 * format: binary
 * responses:
 * 200:
 * description: Xəbər uğurla yeniləndi
 * 404:
 * description: Xəbər tapılmadı
 */
router.put(
  '/:id', 
  authMiddleware, 
  roleCheck(2), 
  upload.single('image'),
  updateNews
);

/**
 * @swagger
 * /news/{id}:
 * delete:
 * tags:
 * - News
 * summary: Xəbəri silmək
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
 * description: Xəbər uğurla silindi
 * 404:
 * description: Xəbər tapılmadı
 */
router.delete('/:id', authMiddleware, roleCheck(2), deleteNews);

export default router;