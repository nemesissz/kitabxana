import express from 'express';
import {
  createPayment,
  getPaymentById,
  getUserPayments,
  handleWebhook,
  handleEpointCallback
} from './payment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { deviceLimiter } from '../middlewares/deviceLimiter.middleware.js';
import { rateLimitByAction } from '../middlewares/rateLimiter.middleware.js';

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
router.post(
  '/checkout',
  authMiddleware,
  deviceLimiter(2),
  rateLimitByAction({ action: 'purchase_checkout', windowSeconds: 60 * 60, maxCount: process.env.NODE_ENV === 'development' ? 50 : 5 }),
  createPayment
);

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
 * /payments/epoint/callback:
 * post:
 * tags:
 * - Payments
 * summary: E-point ödəniş callback
 * description: E-point-dən gələn ödəniş nəticəsini qəbul edir
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * data:
 * type: string
 * signature:
 * type: string
 */
router.post('/epoint/callback', handleEpointCallback);

// Test üçün GET endpoint əlavə edirik
router.get('/epoint/callback', (req, res) => {
  res.json({
    status: 'success',
    message: 'E-point callback endpoint is working',
    method: 'GET',
    note: 'Bu endpoint yalnız test üçündür. E-point POST request göndərəcək.'
  });
});

/**
 * @swagger
 * /payments/webhook:
 * post:
 * tags:
 * - Payments
 * summary: Ödəniş webhook (legacy)
 */
router.post('/webhook', handleWebhook);

export default router;