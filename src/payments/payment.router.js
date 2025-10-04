import express from 'express';
import {
  createPayment,
  getPaymentById,
  getUserPayments,
  handleWebhook
} from './payment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
// checkRole middleware'i bu dosyada kullanılmadığı için import satırını siliyoruz.

const router = express.Router();

/**
 * @swagger
 * /payments/checkout:
 * post:
 * tags:
 * - Payments
 * summary: Ödəniş başlatmaq
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - type
 * - amount
 * properties:
 * type:
 * type: string
 * enum: [subscription, single-pdf]
 * amount:
 * type: number
 * pdfId:
 * type: integer
 */
router.post('/checkout', authMiddleware, createPayment);

/**
 * @swagger
 * /payments/{id}:
 * get:
 * tags:
 * - Payments
 * summary: Ödəniş məlumatlarını almaq
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 */
router.get('/:id', authMiddleware, getPaymentById);

/**
 * @swagger
 * /payments/my:
 * get:
 * tags:
 * - Payments
 * summary: İstifadəçinin ödənişlərini almaq
 * security:
 * - BearerAuth: []
 */
router.get('/my', authMiddleware, getUserPayments);

/**
 * @swagger
 * /payments/webhook:
 * post:
 * tags:
 * - Payments
 * summary: Ödəniş webhook
 */
router.post('/webhook', handleWebhook);

export default router;