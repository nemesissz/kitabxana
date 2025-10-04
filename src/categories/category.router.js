import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from './category.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /categories:
 * get:
 * tags:
 * - Categories
 * summary: Bütün kateqoriyaları əldə etmək
 * responses:
 * 200:
 * description: Kateqoriyalar uğurla əldə edildi
 */
router.get('/', getAllCategories);

/**
 * @swagger
 * /categories/{id}:
 * get:
 * tags:
 * - Categories
 * summary: Kateqoriya məlumatlarını ID-yə görə əldə etmək
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Kateqoriya məlumatları uğurla əldə edildi
 * 404:
 * description: Kateqoriya tapılmadı
 */
router.get('/:id', getCategoryById);

/**
 * @swagger
 * /categories:
 * post:
 * tags:
 * - Categories
 * summary: Yeni kateqoriya yaratmaq
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - name
 * properties:
 * name:
 * type: string
 * responses:
 * 201:
 * description: Kateqoriya uğurla yaradıldı
 * 400:
 * description: Yanlış məlumat və ya kateqoriya artıq mövcuddur
 */
router.post('/', authMiddleware, roleCheck(2), createCategory);

/**
 * @swagger
 * /categories/{id}:
 * put:
 * tags:
 * - Categories
 * summary: Kateqoriya məlumatlarını yeniləmək
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
 * application/json:
 * schema:
 * type: object
 * required:
 * - name
 * properties:
 * name:
 * type: string
 * responses:
 * 200:
 * description: Kateqoriya uğurla yeniləndi
 * 404:
 * description: Kateqoriya tapılmadı
 */
router.put('/:id', authMiddleware, roleCheck(2), updateCategory);

/**
 * @swagger
 * /categories/{id}:
 * delete:
 * tags:
 * - Categories
 * summary: Kateqoriyanı silmək
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
 * description: Kateqoriya uğurla silindi
 * 400:
 * description: Kateqoriyada PDF-lər var
 * 404:
 * description: Kateqoriya tapılmadı
 */
router.delete('/:id', authMiddleware, roleCheck(2), deleteCategory);

export default router;