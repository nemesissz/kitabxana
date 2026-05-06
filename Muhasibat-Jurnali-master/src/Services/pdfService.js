import axios from 'axios';
import Base_Url_Server from '../Constants/baseUrl';

/**
 * PDF'e erişim iznini kontrol eder
 * @param {string} pdfId - PDF ID
 * @param {string} token - Bearer token
 * @returns {Promise} API yanıtı {hasAccess: boolean}
 */
export const checkPdfAccess = async (pdfId, token) => {
  try {
    const response = await axios.get(
      `${Base_Url_Server}pdfs/${pdfId}/check-access`,
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

/**
 * PDF dosyasını indirir
 * @param {string} pdfId - PDF ID
 * @param {string} token - Bearer token
 * @returns {Promise} API yanıtı
 */
export const downloadPdf = async (pdfId, token) => {
  try {
    const response = await axios.get(
      `${Base_Url_Server}pdfs/${pdfId}/download`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Kullanıcının erişebilir olduğu PDF'leri getirir
 * @param {string} token - Bearer token
 * @returns {Promise} API yanıtı
 */
export const getMyAccessiblePdfs = async (token) => {
  try {
    const response = await axios.get(
      `${Base_Url_Server}pdfs/my-accessible`,
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

