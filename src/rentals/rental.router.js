import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import roleCheck from '../middlewares/roleCheck.middleware.js';
import { createRental, getMyRentals, getRentals, approveRental, rejectRental, markReturned } from './rental.controller.js';

const router = express.Router();

router.post('/', authMiddleware, createRental);
router.get('/my', authMiddleware, getMyRentals);
router.get('/', authMiddleware, roleCheck(2), getRentals);
router.patch('/:id/approve', authMiddleware, roleCheck(2), approveRental);
router.patch('/:id/reject', authMiddleware, roleCheck(2), rejectRental);
router.patch('/:id/return', authMiddleware, roleCheck(2), markReturned);

export default router;
