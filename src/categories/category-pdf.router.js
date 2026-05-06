import express from 'express';
import categoryPdfController from './category-pdf.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PDF Categories
 *   description: PDF Categories management endpoints
 */

/**
 * @swagger
 * /api/categories/pdfs:
 *   get:
 *     summary: Get all PDF categories
 *     tags: [PDF Categories]
 *     responses:
 *       200:
 *         description: List of PDF categories retrieved successfully
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: integer
 */
router.get('/', categoryPdfController.getAllCategories);

/**
 * @swagger
 * /api/categories/pdfs/with-counts:
 *   get:
 *     summary: Get all PDF categories with PDF counts
 *     tags: [PDF Categories]
 *     responses:
 *       200:
 *         description: List of PDF categories with PDF counts retrieved successfully
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           pdf_count:
 *                             type: integer
 *                     count:
 *                       type: integer
 */
router.get('/with-counts', categoryPdfController.getCategoriesWithPdfCount);

/**
 * @swagger
 * /api/categories/pdfs/{id}:
 *   get:
 *     summary: Get PDF category by ID
 *     tags: [PDF Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: PDF Category ID
 *     responses:
 *       200:
 *         description: PDF Category retrieved successfully
 *       404:
 *         description: PDF Category not found
 */
router.get('/:id', categoryPdfController.getCategoryById);

/**
 * @swagger
 * /api/categories/pdfs:
 *   post:
 *     summary: Create new PDF category (Admin only)
 *     tags: [PDF Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Vergi Haqqında"
 *               description:
 *                 type: string
 *                 example: "PDF category description"
 *     responses:
 *       201:
 *         description: PDF Category created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', authMiddleware, roleCheck(2), categoryPdfController.createCategory);

/**
 * @swagger
 * /api/categories/pdfs/{id}:
 *   put:
 *     summary: Update PDF category (Admin only)
 *     tags: [PDF Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: PDF Category ID
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
 *     responses:
 *       200:
 *         description: PDF Category updated successfully
 *       404:
 *         description: PDF Category not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/:id', authMiddleware, roleCheck(2), categoryPdfController.updateCategory);

/**
 * @swagger
 * /api/categories/pdfs/{id}:
 *   delete:
 *     summary: Delete PDF category (Admin only)
 *     tags: [PDF Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: PDF Category ID
 *     responses:
 *       200:
 *         description: PDF Category deleted successfully
 *       400:
 *         description: Cannot delete category that is in use
 *       404:
 *         description: PDF Category not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', authMiddleware, roleCheck(2), categoryPdfController.deleteCategory);

export default router;