import dotenv from 'dotenv';
dotenv.config();

// Development və Production URL'lərini müəyyən et
const isDevelopment = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'prod';

// URL'leri environment variable'lardan al, yoxsa default değerleri kullan
const baseUrl = process.env.BASE_URL || (isDevelopment ? 'http://localhost:3000' : 'https://api.muhasibatjurnal.az');
const callbackBaseUrl = process.env.CALLBACK_BASE_URL || baseUrl;

// E-point ödəniş sisteminin konfiqurasiyası
export const epointConfig = {
  // API URLs
  apiUrl: process.env.EPOINT_API_URL || 'https://epoint.az/api/1/request',
  checkoutUrl: process.env.EPOINT_CHECKOUT_URL || 'https://epoint.az/api/1/checkout',
  
  // Authentication
  publicKey: process.env.EPOINT_PUBLIC_KEY || '',
  privateKey: process.env.EPOINT_PRIVATE_KEY || '',
  
  // URLs - Development və Production üçün avtomatik seçim
  successRedirectUrl: process.env.EPOINT_SUCCESS_URL || `${baseUrl}/payment/success`,
  errorRedirectUrl: process.env.EPOINT_ERROR_URL || `${baseUrl}/payment/error`,
  resultUrl: process.env.EPOINT_RESULT_URL || `${callbackBaseUrl}/payments/epoint/callback`,
  
  // Defaults
  currency: 'AZN',
  language: 'az',
  
  // Test mode
  isTestMode: process.env.EPOINT_TEST_MODE === 'true' || false,
  
  // Environment info
  isDevelopment: isDevelopment
};

// Validation
if (!epointConfig.publicKey || !epointConfig.privateKey) {
  console.warn('⚠️ E-point credentials not configured! Please set EPOINT_PUBLIC_KEY and EPOINT_PRIVATE_KEY in .env file');
}

// Debug info
console.log('🔧 E-point Configuration:');
console.log('  Environment:', isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  isDevelopment:', isDevelopment);
console.log('  baseUrl:', baseUrl);
console.log('  callbackBaseUrl:', callbackBaseUrl);
console.log('  Success URL:', epointConfig.successRedirectUrl);
console.log('  Error URL:', epointConfig.errorRedirectUrl);
console.log('  Callback URL:', epointConfig.resultUrl);
console.log('  Test Mode:', epointConfig.isTestMode);

export default epointConfig;

