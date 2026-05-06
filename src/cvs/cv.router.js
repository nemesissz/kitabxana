import express from 'express';
import {
  createCv,
  getAllCvs,
  getCvById,
  updateCv,
  deleteCv,
  downloadCv,
  getCvsPreview,
  getCategories
} from './cv.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';
import upload from '../utils/upload.js';

const router = express.Router();

/**
 * @swagger
 * /cvs:
 *   get:
 *     tags:
 *       - CVs
 *     summary: Get all CV samples
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: CVs retrieved successfully
 */
router.get('/', getAllCvs);

/**
 * @swagger
 * /cvs/preview:
 *   get:
 *     tags:
 *       - CVs
 *     summary: Get CV samples preview
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of CVs to return
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: CVs preview retrieved successfully
 */
router.get('/preview', getCvsPreview);

/**
 * @swagger
 * /cvs/categories:
 *   get:
 *     tags:
 *       - CVs
 *     summary: Get all CV categories
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/categories', getCategories);

/**
 * @swagger
 * /cvs/{id}:
 *   get:
 *     tags:
 *       - CVs
 *     summary: Get CV sample by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: CV retrieved successfully
 *       404:
 *         description: CV not found
 */
router.get('/:id', getCvById);

/**
 * @swagger
 * /cvs/{id}/download:
 *   get:
 *     tags:
 *       - CVs
 *     summary: Download CV sample
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: CV downloaded successfully
 *       404:
 *         description: CV not found
 */
router.get('/:id/download', downloadCv);

/**
 * @swagger
 * /cvs:
 *   post:
 *     tags:
 *       - CVs
 *     summary: Create new CV sample (Admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: CV created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/',
  authMiddleware,
  roleCheck(2),
  upload.single('file'),
  createCv
);

/**
 * @swagger
 * /cvs/{id}:
 *   put:
 *     tags:
 *       - CVs
 *     summary: Update CV sample (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: CV updated successfully
 *       404:
 *         description: CV not found
 */
router.put('/:id',
  authMiddleware,
  roleCheck(2),
  upload.single('file'),
  updateCv
);

/**
 * @swagger
 * /cvs/{id}:
 *   delete:
 *     tags:
 *       - CVs
 *     summary: Delete CV sample (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: CV deleted successfully
 *       404:
 *         description: CV not found
 */
router.delete('/:id',
  authMiddleware,
  roleCheck(2),
  deleteCv
);

export default router;

