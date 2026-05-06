import crypto from 'crypto';
import epointConfig from '../config/epoint.config.js';

/**
 * E-point Mock Service - Real API key-ləri olmadan test etmək üçün
 * Test mode: EPOINT_MOCK_MODE=true
 */
class EpointMockService {
  /**
   * Mock ödəniş yaradır (real API-yə getmir)
   */
  async createPayment(paymentData) {
    console.log('🧪 MOCK MODE: E-point test ödənişi yaradılır...');
    console.log('📝 Payment Data:', paymentData);

    // 2 saniyə gözlə (real API kimi)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock transaction ID
    const mockTransactionId = 'MOCK_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');

    // Environment'dan base URL al - öncelik environment variable'dır
    let baseUrl = process.env.BASE_URL;
    
    // Eğer BASE_URL set edilmemişse, NODE_ENV kontrolü yap
    if (!baseUrl) {
      const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod';
      baseUrl = isProd ? 'https://api.muhasibatjurnal.az' : 'http://localhost:3000';
    }
    
    console.log('🔧 Mock Service Base URL:', { 
      BASE_URL_env: process.env.BASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      final_baseUrl: baseUrl
    });
    
    // Mock response
    const mockResponse = {
      success: true,
      paymentUrl: `${baseUrl}/payment/mock-checkout?transaction_id=${mockTransactionId}&order_id=${paymentData.orderId}`,
      transactionId: mockTransactionId,
      orderId: paymentData.orderId,
      status: 'pending'
    };

    console.log('✅ MOCK Payment Created:', mockResponse);
    console.log('🔧 Mock Service Config:', {
      isDevelopment: epointConfig.isDevelopment,
      baseUrl: baseUrl,
      paymentUrl: mockResponse.paymentUrl
    });

    return mockResponse;
  }

  /**
   * Mock status yoxlama
   */
  async checkPaymentStatus(transactionId) {
    console.log('🧪 MOCK MODE: Payment status yoxlanılır:', transactionId);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Random success/failed
    const isSuccess = Math.random() > 0.3; // 70% success

    return {
      success: true,
      status: isSuccess ? 'approved' : 'declined',
      transactionId: transactionId,
      amount: '10.00',
      currency: 'AZN',
      orderId: transactionId.split('_')[1] || 'unknown',
      cardMask: '****1234',
      message: isSuccess ? 'Ödəniş uğurla tamamlandı' : 'Ödəniş rədd edildi'
    };
  }

  /**
   * Mock callback verify
   */
  verifyCallback(data, signature) {
    console.log('🧪 MOCK MODE: Callback verify edilir');

    // Decode data to get actual order_id
    try {
      const decodedData = this.decodeData(data);
      console.log('🧪 MOCK Decoded Data:', decodedData);

      return {
        success: true,
        status: decodedData.status || 'approved',
        transactionId: decodedData.transaction_id,
        orderId: decodedData.order_id,
        amount: decodedData.amount,
        currency: decodedData.currency || 'AZN',
        cardMask: decodedData.card_mask || '****1234',
        message: decodedData.message || 'Test ödənişi uğurlu',
        rawData: decodedData
      };
    } catch (error) {
      console.error('🧪 MOCK Decode Error:', error);
      // Fallback
      return {
        success: true,
        status: 'approved',
        transactionId: 'MOCK_' + Date.now(),
        orderId: 'TEST_ORDER',
        amount: '10.00',
        currency: 'AZN',
        cardMask: '****1234',
        message: 'Test ödənişi uğurlu',
        rawData: {}
      };
    }
  }

  /**
   * Status parsing (real service ilə eyni)
   */
  parsePaymentStatus(status) {
    const statusMap = {
      'approved': {
        code: 'approved',
        message: 'Ödəniş uğurla tamamlandı',
        success: true
      },
      'declined': {
        code: 'declined',
        message: 'Ödəniş rədd edildi',
        success: false
      },
      'pending': {
        code: 'pending',
        message: 'Ödəniş gözlənilir',
        success: false
      },
      'error': {
        code: 'error',
        message: 'Ödəniş zamanı xəta baş verdi',
        success: false
      }
    };

    return statusMap[status] || {
      code: 'unknown',
      message: 'Naməlum status',
      success: false
    };
  }

  // Helper methodlar (real service ilə uyğunluq üçün)
  generateSignature(data) {
    return 'mock_signature_' + crypto.randomBytes(8).toString('hex');
  }

  encodeData(jsonData) {
    return Buffer.from(JSON.stringify(jsonData), 'utf-8').toString('base64');
  }

  decodeData(encodedData) {
    const jsonString = Buffer.from(encodedData, 'base64').toString('utf-8');
    return JSON.parse(jsonString);
  }
}

export default new EpointMockService();
