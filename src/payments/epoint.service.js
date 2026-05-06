import crypto from 'crypto';
import epointConfig from '../config/epoint.config.js';
import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * E-point ödəniş sistemi service class
 * API Dokumentasiyası: https://epoint.az/api
 */
class EpointService {
  /**
   * Signature yaratmaq üçün helper method
   * Formula: base64_encode(sha1(private_key + data + private_key, true))
   * 
   * @param {string} data - base64 encoded json string
   * @returns {string} signature
   */
  generateSignature(data) {
    const { privateKey } = epointConfig;
    
    // sha1(private_key + data + private_key, true) - true parametri binary output verir
    const hash = crypto
      .createHash('sha1')
      .update(privateKey + data + privateKey)
      .digest(); // binary output
    
    // Base64 encode
    const signature = Buffer.from(hash).toString('base64');
    
    return signature;
  }

  /**
   * JSON obyektini base64-encoded string-ə çevirir
   * 
   * @param {Object} jsonData - encode ediləcək data
   * @returns {string} base64 encoded string
   */
  encodeData(jsonData) {
    const jsonString = JSON.stringify(jsonData);
    return Buffer.from(jsonString, 'utf-8').toString('base64');
  }

  /**
   * Base64-encoded data-nı decode edir
   * 
   * @param {string} encodedData - decode ediləcək base64 string
   * @returns {Object} decoded JSON object
   */
  decodeData(encodedData) {
    const jsonString = Buffer.from(encodedData, 'base64').toString('utf-8');
    return JSON.parse(jsonString);
  }

  /**
   * Ödəniş sorğusu yaradır və E-point-ə göndərir
   * 
   * @param {Object} paymentData - ödəniş məlumatları
   * @param {number} paymentData.amount - ödəniş məbləği
   * @param {string} paymentData.orderId - unikal order ID
   * @param {string} paymentData.description - ödəniş təsviri
   * @param {string} paymentData.language - dil (az, en, ru)
   * @returns {Object} E-point cavabı (payment URL və transaction ID)
   */
  async createPayment(paymentData) {
    const { publicKey, currency, successRedirectUrl, errorRedirectUrl } = epointConfig;
    
    // API parametrlərini hazırlayırıq
    const jsonData = {
      public_key: publicKey,
      amount: parseFloat(paymentData.amount).toFixed(2),
      currency: currency,
      language: paymentData.language || 'az',
      order_id: paymentData.orderId,
      description: paymentData.description || 'Ödəniş',
      success_redirect_url: successRedirectUrl,
      error_redirect_url: errorRedirectUrl
    };

    // Data-nı base64 encode edirik
    const encodedData = this.encodeData(jsonData);

    // Signature yaradırıq
    const signature = this.generateSignature(encodedData);

    logger.payment('CREATE_REQUEST', {
      order_id: paymentData.orderId,
      amount: jsonData.amount,
      currency: currency,
      description: paymentData.description
    });

    try {
      console.log('📤 E-point API Request:', {
        url: epointConfig.apiUrl,
        data: encodedData.substring(0, 100) + '...',
        signature: signature.substring(0, 30) + '...',
        publicKey: epointConfig.publicKey ? 'SET' : 'NOT SET',
        privateKey: epointConfig.privateKey ? 'SET' : 'NOT SET'
      });

      // E-point API-ə POST sorğusu göndəririk
      const response = await axios.post(epointConfig.apiUrl, {
        data: encodedData,
        signature: signature
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 E-point API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      // Cavabı decode edirik (iki formatı dəstəklə)
      // 1) Legacy/encoded format: { data: base64 }
      if (response.data && response.data.data) {
        const decodedResponse = this.decodeData(response.data.data);

        logger.payment('CREATE_SUCCESS', {
          transaction_id: decodedResponse.transaction_id,
          order_id: paymentData.orderId,
          status: decodedResponse.status
        });

        return {
          success: true,
          paymentUrl: `${epointConfig.checkoutUrl}?order_id=${decodedResponse.transaction_id || paymentData.orderId}`,
          transactionId: decodedResponse.transaction_id,
          orderId: paymentData.orderId,
          status: decodedResponse.status
        };
      }

      // 2) Yeni/flat format: { status, redirect_url, transaction }
      if (response.data && response.data.redirect_url) {
        logger.payment('CREATE_SUCCESS', {
          transaction_id: response.data.transaction,
          order_id: paymentData.orderId,
          status: response.data.status
        });

        return {
          success: true,
          paymentUrl: response.data.redirect_url,
          transactionId: response.data.transaction || response.data.order_id || paymentData.orderId,
          orderId: paymentData.orderId,
          status: response.data.status || 'pending'
        };
      }

      console.log('⚠️ E-point API cavabında data yoxdur:', response.data);
      throw new Error('Invalid response from E-point API');

    } catch (error) {
      // Daha ətraflı log
      console.error('❌ E-point API Error Details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });

      logger.payment('CREATE_FAILED', {
        order_id: paymentData.orderId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // E-point key-lərinin mövcudluğunu yoxlayaq
      if (!epointConfig.publicKey || !epointConfig.privateKey || 
          epointConfig.publicKey === 'your_epoint_public_key_here' ||
          epointConfig.privateKey === 'your_epoint_private_key_here') {
        throw new Error('E-point API key-ləri konfiqurasiya olunmayıb. Zəhmət olmasa .env faylında EPOINT_PUBLIC_KEY və EPOINT_PRIVATE_KEY əlavə edin.');
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message ||
        'E-point ödəniş yaradılarkən xəta baş verdi'
      );
    }
  }

  /**
   * Ödəniş statusunu yoxlayır
   * 
   * @param {string} transactionId - E-point transaction ID
   * @returns {Object} ödəniş statusu
   */
  async checkPaymentStatus(transactionId) {
    const { publicKey } = epointConfig;

    // Status yoxlama üçün data hazırlayırıq
    const jsonData = {
      public_key: publicKey,
      transaction_id: transactionId
    };

    const encodedData = this.encodeData(jsonData);
    const signature = this.generateSignature(encodedData);

    try {
      const response = await axios.post(epointConfig.apiUrl, {
        data: encodedData,
        signature: signature
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.data) {
        const decodedResponse = this.decodeData(response.data.data);
        
        console.log('📊 Payment status:', decodedResponse);

        return {
          success: true,
          status: decodedResponse.status,
          transactionId: decodedResponse.transaction_id,
          amount: decodedResponse.amount,
          currency: decodedResponse.currency,
          orderId: decodedResponse.order_id,
          cardMask: decodedResponse.card_mask,
          message: decodedResponse.message
        };
      }

      throw new Error('Invalid response from E-point API');

    } catch (error) {
      console.error('❌ E-point status check error:', error.response?.data || error.message);
      
      throw new Error('Ödəniş statusu yoxlanılarkən xəta baş verdi');
    }
  }

  /**
   * Callback-dən gələn data-nı verify edir
   * 
   * @param {string} data - callback-dən gələn base64 encoded data
   * @param {string} signature - callback-dən gələn signature
   * @returns {Object} decoded və verified data
   */
  verifyCallback(data, signature) {
    // Signature-ı yoxlayırıq
    const expectedSignature = this.generateSignature(data);
    
    if (signature !== expectedSignature) {
      console.error('❌ Invalid callback signature');
      throw new Error('Invalid signature - callback verification failed');
    }

    // Data-nı decode edirik
    const decodedData = this.decodeData(data);

    // Fərqli sahə adlarını normallaşdır
    const normalized = {
      status: (decodedData.status || decodedData.payment_status || decodedData.result || decodedData.state || '').toString().toLowerCase(),
      transactionId: decodedData.transaction_id || decodedData.transaction || decodedData.trans_id || decodedData.id,
      orderId: decodedData.order_id || decodedData.order || decodedData.orderid,
      amount: decodedData.amount || decodedData.total_amount,
      currency: decodedData.currency || decodedData.ccy,
      cardMask: decodedData.card_mask || decodedData.cardMask || decodedData.card,
      message: decodedData.message || decodedData.description || ''
    };

    console.log('✅ Callback verified (normalized):', normalized);

    return {
      success: true,
      status: normalized.status,
      transactionId: normalized.transactionId,
      orderId: normalized.orderId,
      amount: normalized.amount,
      currency: normalized.currency,
      cardMask: normalized.cardMask,
      message: normalized.message,
      rawData: decodedData
    };
  }

  /**
   * Ödəniş statusunu təhlil edir və mətn qaytarır
   * 
   * @param {string} status - E-point status kodu
   * @returns {Object} status məlumatı
   */
  parsePaymentStatus(status) {
    const s = (status || '').toString().toLowerCase();

    // Uğurlu statuslar
    const successSet = new Set(['approved', 'success', 'paid', 'ok']);
    if (successSet.has(s)) {
      return { code: s, message: 'Ödəniş uğurla tamamlandı', success: true };
    }

    // Uğursuz statuslar
    const failedSet = new Set(['declined', 'failed', 'fail', 'error', 'canceled', 'cancelled']);
    if (failedSet.has(s)) {
      return { code: s, message: 'Ödəniş rədd edildi', success: false };
    }

    // Gözləmədə olan statuslar
    const pendingSet = new Set(['pending', 'processing', 'init']);
    if (pendingSet.has(s)) {
      return { code: s, message: 'Ödəniş gözlənilir', success: false };
    }

    return { code: 'unknown', message: 'Naməlum status', success: false };
  }
}

export default new EpointService();

