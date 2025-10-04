import { executeQuery, getOne, insert, update, transaction } from '../config/database.js';
import emailService from '../utils/email.js';
import subscriptionService from '../subscriptions/subscription.service.js';
import fs from 'fs/promises';

class PaymentService {
  async createPayment(userId, type, amount, pdfId = null, plan = null) {
    const user = await getOne(
      'SELECT id, email, edu_email FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new Error('User not found');
    }

    let finalAmount = amount;
    if (type === 'subscription' && plan) {
      const prices = await subscriptionService.getPlanPrices();
      finalAmount = prices[plan];
    }

    if (user.edu_email) {
      finalAmount = finalAmount * 0.5;
    }

    const paymentId = await insert('payments', {
      user_id: userId,
      type,
      amount: finalAmount,
      pdf_id: pdfId,
      status: 'pending'
    });

    const updatedPayment = await this.updatePaymentStatus(paymentId, 'success');
    
    if (updatedPayment.status === 'success') {
      if (type === 'subscription') {
        await this.activateSubscription(userId);
      } else if (type === 'single-pdf' && pdfId) {
        await this.grantPdfAccess(user.email, pdfId);
      }
      await emailService.sendPaymentConfirmation(user.email, updatedPayment);
    }

    return updatedPayment;
  }

  async updatePaymentStatus(paymentId, status) {
    await update('payments', paymentId, { status });
    return await this.getPaymentById(paymentId);
  }

  async getPaymentById(paymentId) {
    const payment = await getOne(
      'SELECT * FROM payments WHERE id = ?',
      [paymentId]
    );

    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  async getUserPayments(userId) {
    return await executeQuery(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }

  async activateSubscription(userId) {
    // Bu method subscription service-də olmalıdır
    return await subscriptionService.createSubscription(userId, 'monthly');
  }

  async grantPdfAccess(userEmail, pdfId) {
    const pdf = await getOne(
      'SELECT * FROM pdfs WHERE id = ?',
      [pdfId]
    );

    if (!pdf) {
      throw new Error('PDF not found');
    }

    try {
      const pdfPath = pdf.file_path || pdf.filePath;
      await emailService.sendPdfAsAttachment(userEmail, pdfPath);
    } catch (error) {
      console.error('Error sending PDF:', error);
      throw new Error('Failed to send PDF');
    }
  }

  async handlePaymentWebhook(data) {
    // Ödəniş xidməti webhook-unu işləmək üçün
    console.log('Payment webhook received:', data);
    
    try {
      const { paymentId, status } = data;
      await this.updatePaymentStatus(paymentId, status);
      
      return { success: true };
    } catch (error) {
      console.error('Webhook error:', error);
      throw new Error('Webhook processing failed');
    }
  }
}

export default new PaymentService();