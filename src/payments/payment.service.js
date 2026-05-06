import { executeQuery, getOne, insert, update, transaction } from '../config/database.js';
import emailService from '../utils/email.js';
import subscriptionService from '../subscriptions/subscription.service.js';
import epointService from './epoint.service.js';
import epointMockService from './epoint.service.mock.js';
import fs from 'fs/promises';
import crypto from 'crypto';

// Mock mode check
const MOCK_MODE = process.env.EPOINT_MOCK_MODE === 'true';
const activeEpointService = MOCK_MODE ? epointMockService : epointService;

if (MOCK_MODE) {
  console.log('🧪 E-POINT MOCK MODE ACTIVE - Real API istifadə olunmur!');
}

class PaymentService {
  /**
   * Unikal order ID yaradır
   */
  generateOrderId(userId, type) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${type.toUpperCase()}_${userId}_${timestamp}_${random}`;
  }

  /**
   * Ödəniş yaradır və E-point-ə göndərir
   */
  async createPayment(userId, type, amount, pdfId = null, plan = null) {
    const user = await getOne(
      'SELECT id, email, edu_email FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new Error('User not found');
    }

    let finalAmount = amount;
    let description = 'Ödəniş';

    // Subscription ödənişi üçün qiyməti və təsviri müəyyənləşdiririk
    if (type === 'subscription' && plan) {
      const prices = await subscriptionService.getPlanPrices();
      if (!prices[plan]) {
        throw new Error('Invalid subscription plan');
      }
      finalAmount = prices[plan].price;
      description = `${prices[plan].plan_name} - Abunəlik`;
    }

    // PDF ödənişi üçün qiyməti və təsviri müəyyənləşdiririk
    if (type === 'single-pdf' && pdfId) {
      const pdf = await getOne('SELECT id, title, price FROM pdfs WHERE id = ?', [pdfId]);
      if (!pdf) {
        throw new Error('PDF not found');
      }
      if (!pdf.price || pdf.price <= 0) {
        throw new Error('PDF price not set');
      }
      finalAmount = pdf.price;
      description = `PDF: ${pdf.title}`;
      console.log('📄 PDF ödənişi:', { pdfId, originalPrice: pdf.price, userEmail: user.email });
    }

    // Tələbə endirimi (50%) - .edu və .edu.az email üçün
    const emailLower = user.email.toLowerCase();
    const isEduEmail = emailLower.endsWith('.edu') || emailLower.endsWith('.edu.az') || user.edu_email;
    console.log('🎓 Tələbə endirimi yoxlaması:', { 
      email: user.email, 
      emailLower, 
      edu_email: user.edu_email,
      isEduEmail,
      finalAmountBefore: finalAmount 
    });
    
    if (isEduEmail) {
      finalAmount = finalAmount * 0.5;
      description += ' (Tələbə endirimi)';
      console.log('✅ Tələbə endirimi tətbiq edildi:', { finalAmountAfter: finalAmount });
    }

    // Unikal order ID yaradırıq
    const orderId = this.generateOrderId(userId, type);

    // Database-ə payment record yaradırıq (pending status ilə)
    const paymentId = await insert('payments', {
      user_id: userId,
      type,
      amount: finalAmount,
      pdf_id: pdfId,
      status: 'pending',
      epoint_order_id: orderId,
      payment_method: 'epoint'
    });

    try {
      // E-point ödəniş sorğusu göndəririk (mock və ya real)
      const epointResponse = await activeEpointService.createPayment({
        amount: finalAmount,
        orderId: orderId,
        description: description,
        language: 'az'
      });

      // Payment URL-i və transaction ID-ni database-ə yazırıq
      await update('payments', paymentId, {
        payment_url: epointResponse.paymentUrl,
        epoint_transaction_id: epointResponse.transactionId,
        payment_response: JSON.stringify(epointResponse)
      });

      console.log('✅ Payment created successfully:', {
        paymentId,
        orderId,
        amount: finalAmount,
        transactionId: epointResponse.transactionId
      });

      // Updated payment məlumatını qaytarırıq
      const payment = await this.getPaymentById(paymentId);

      return {
        ...payment,
        paymentUrl: epointResponse.paymentUrl,
        shouldRedirect: true
      };

    } catch (error) {
      // E-point xətası olarsa, payment-i failed edirik
      await update('payments', paymentId, { 
        status: 'failed',
        payment_response: JSON.stringify({ error: error.message })
      });
      
      console.error('❌ E-point payment creation failed:', error);
      throw error;
    }
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

  /**
   * E-point callback/webhook handler
   */
  async handleEpointCallback(data, signature) {
    console.log('📥 E-point callback received');

    try {
      // Signature-ı verify edirik (mock və ya real)
      const verifiedData = activeEpointService.verifyCallback(data, signature);

      // Payment-i tapmaq üçün bir neçə açardan istifadə edirik
      let payment = null;

      // 1) order_id ilə
      if (verifiedData.orderId) {
        payment = await getOne(
          'SELECT * FROM payments WHERE epoint_order_id = ?',
          [verifiedData.orderId]
        );
      }

      // 2) tapılmadısa, transaction_id ilə yoxlayırıq
      if (!payment && verifiedData.transactionId) {
        payment = await getOne(
          'SELECT * FROM payments WHERE epoint_transaction_id = ?',
          [verifiedData.transactionId]
        );
      }

      // 3) bəzən callback raw datada fərqli açar ola bilər (məs: transaction)
      if (!payment && verifiedData.rawData?.transaction) {
        payment = await getOne(
          'SELECT * FROM payments WHERE epoint_transaction_id = ?',
          [verifiedData.rawData.transaction]
        );
      }

      if (!payment) {
        throw new Error('Payment not found');
      }

      console.log('💳 Processing payment callback:', {
        paymentId: payment.id,
        orderId: verifiedData.orderId,
        status: verifiedData.status,
        amount: verifiedData.amount
      });

      // Status-u parse edirik (mock və ya real)
      const statusInfo = activeEpointService.parsePaymentStatus(verifiedData.status);

      // Database-də payment-i yeniləyirik
      await update('payments', payment.id, {
        status: statusInfo.success ? 'success' : 'failed',
        epoint_transaction_id: verifiedData.transactionId,
        card_mask: verifiedData.cardMask,
        payment_response: JSON.stringify(verifiedData.rawData)
      });

      // Əgər ödəniş uğurludursa, subscription və ya PDF access veririk
      if (statusInfo.success) {
        const user = await getOne('SELECT id, email FROM users WHERE id = ?', [payment.user_id]);

        if (payment.type === 'subscription') {
          // Subscription planını təyin edirik (payment description-dan və ya amount-dan)
          const plan = this.determinePlanFromPayment(payment);
          await subscriptionService.createSubscription(payment.user_id, plan);
          console.log('✅ Subscription activated for user:', user.email);
        } else if (payment.type === 'single-pdf' && payment.pdf_id) {
          await this.grantPdfAccess(user.email, payment.pdf_id);
          console.log('✅ PDF access granted to user:', user.email);
        }

        // Email göndəririk
        await emailService.sendPaymentConfirmation(user.email, payment);
      } else {
        console.log('❌ Payment failed:', statusInfo.message);
      }

      return {
        success: true,
        status: statusInfo.success ? 'success' : 'failed',
        message: statusInfo.message
      };

    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      throw error;
    }
  }

  /**
   * Payment-dən plan müəyyənləşdirir
   */
  determinePlanFromPayment(payment) {
    // Amount-a görə plan təyin edirik
    const amount = parseFloat(payment.amount);
    
    if (amount >= 35 && amount <= 45) return '6m';
    if (amount >= 20 && amount <= 30) return '3m';
    return '1m';
  }

  /**
   * Köhnə webhook handler (legacy)
   */
  async handlePaymentWebhook(data) {
    console.log('⚠️ Legacy webhook received - use handleEpointCallback instead');
    
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