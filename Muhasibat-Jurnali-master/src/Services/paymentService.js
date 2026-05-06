import axios from 'axios';
import Base_Url_Server from '../Constants/baseUrl';

/**
 * Ödeme checkout işlemini başlatır
 * @param {Object} data - Ödeme verileri
 * @param {string} data.type - 'subscription' veya 'single-pdf'
 * @param {string} data.plan - Abonelik planı ('1m', '3m', '6m') - sadece subscription için
 * @param {string} data.pdfId - PDF ID - sadece single-pdf için
 * @param {number} data.amount - Tutar - sadece single-pdf için
 * @param {string} token - Bearer token
 * @returns {Promise} API yanıtı
 */
export const initiateCheckout = async (data, token) => {
  try {
    const response = await axios.post(
      `${Base_Url_Server}payments/checkout`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Aktif abonelik bilgilerini getirir
 * @param {string} token - Bearer token
 * @returns {Promise} API yanıtı
 */
export const getActiveSubscription = async (token) => {
  try {
    const response = await axios.get(
      `${Base_Url_Server}subscriptions/active`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

