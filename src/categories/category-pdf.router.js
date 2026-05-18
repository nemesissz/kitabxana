import express from 'express';
import categoryPdfController from './category-pdf.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';

const router = express.Router();

// Public
router.get('/', categoryPdfController.getAllCategories);
router.get('/with-counts', categoryPdfController.getCategoriesWithPdfCount);

// Request routes (before /:id to avoid route conflict)
router.post('/requests', authMiddleware, roleCheck(2), categoryPdfController.submitRequest);
router.get('/requests', authMiddleware, roleCheck(2), categoryPdfController.getRequests);
router.patch('/requests/:id/approve', authMiddleware, roleCheck(2), categoryPdfController.approveRequest);
router.patch('/requests/:id/reject', authMiddleware, roleCheck(2), categoryPdfController.rejectRequest);

// By ID
router.get('/:id', categoryPdfController.getCategoryById);
router.post('/', authMiddleware, roleCheck(2), categoryPdfController.createCategory);
router.put('/:id', authMiddleware, roleCheck(2), categoryPdfController.updateCategory);
router.delete('/:id', authMiddleware, roleCheck(2), categoryPdfController.deleteCategory);

export default router;
