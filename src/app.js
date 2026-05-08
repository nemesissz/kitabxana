import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Middlewares
import requestLogger from './middlewares/requestLogger.middleware.js';
import errorLogger from './middlewares/errorLogger.middleware.js';

// Routes
import authRoutes from './auth/auth.router.js';
import userRoutes from './users/user.router.js';
import subscriptionRoutes from './subscriptions/subscription.router.js';
import paymentRoutes from './payments/payment.router.js';
import pdfRoutes from './pdfs/pdf.router.js';
import adminRoutes from './admin/admin.router.js';
import categoryRoutes from './categories/category.router.js';
import categoryPdfRoutes from './categories/category-pdf.router.js';
import newsRoutes from './news/news.router.js';
import serviceRoutes from './services/service.router.js';
import cvRoutes from './cvs/cv.router.js';
import adRoutes from './ads/ad.router.js';
import activityLogRoutes from './activity-logs/activity-log.router.js';

config(); // Load .env variables

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middlewares
app.use(cors());

// Request logger
app.use(requestLogger);

// JSON parsing middleware with error handling
app.use((req, res, next) => {
  express.json()(req, res, (err) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({
        status: 'error',
        message: 'Yanlış JSON formatı göndərildi'
      });
    }
    next(err);
  });
});

app.use(express.urlencoded({ extended: true }));

// Swagger setup
const swaggerDocument = YAML.load(join(dirname(__dirname), 'swagger.yaml'));

// Simple and reliable approach: Check if running on production domain
const isProduction = process.env.NODE_ENV === 'production' || 
                     process.env.SWAGGER_SERVER === 'production';

if (isProduction) {
  // Force production server for all swagger requests
  swaggerDocument.servers = [
    {
      url: 'https://api.muhasibatjurnal.az',
      description: 'Production API Server'
    }
  ];
  console.log('📚 Swagger configured for PRODUCTION server');
} else {
  // Development environment
  swaggerDocument.servers = [
    {
      url: `http://localhost:${process.env.PORT || 3000}`,
      description: 'Development API Server'
    }
  ];
  console.log('📚 Swagger configured for DEVELOPMENT server');
}

// Add cache busting options for fresh documentation
const swaggerUiOptions = {
  swaggerOptions: {
    url: `/swagger.yaml?v=${Date.now()}`, // Cache busting timestamp
    validatorUrl: null
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerUiOptions));
app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

// Static files for payment pages
app.use(express.static(join(__dirname, '..', 'public')));

// Payment success və error səhifələri - React frontend-ə redirect
app.get('/payment/success', (req, res) => {
  // Environment variable'dan frontend URL al
  const frontendUrl = process.env.FRONTEND_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://muhasibatjurnal.az' 
      : 'http://localhost:5173'); // <-- Bu hissə
  
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  console.log('🔄 Payment Success Redirect Debug:');
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  isDevelopment:', isDevelopment);
  console.log('  FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('  frontendUrl:', frontendUrl);
  
  // Query parametrlərini saxlayaraq frontend-ə yönləndir
  const queryString = Object.keys(req.query).length > 0 
    ? '?' + new URLSearchParams(req.query).toString()
    : '';
  
  const redirectUrl = `${frontendUrl}/payment/success${queryString}`;
  console.log('  redirectUrl:', redirectUrl);
  
  res.redirect(redirectUrl);
});

app.get('/payment/error', (req, res) => {
  // Environment variable'dan frontend URL al
  const frontendUrl = process.env.FRONTEND_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://muhasibatjurnal.az' 
      : 'http://localhost:5173');
  
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Query parametrlərini saxlayaraq frontend-ə yönləndir
  const queryString = Object.keys(req.query).length > 0 
    ? '?' + new URLSearchParams(req.query).toString()
    : '';
  
  res.redirect(`${frontendUrl}/payment/error${queryString}`);
});

// Mock checkout səhifəsi (test mode üçün - hələ də HTML olaraq saxlanılır)
app.get('/payment/mock-checkout', (req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'payment', 'mock-checkout.html'));
});

// Add direct YAML endpoint with no-cache headers
app.get('/swagger.yaml', (req, res) => {
    res.setHeader('Content-Type', 'application/x-yaml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(join(dirname(__dirname), 'swagger.yaml'));
});

// Test endpoint - URL'leri kontrol etmek için
app.get('/test-config', (req, res) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const frontendUrl = process.env.FRONTEND_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://muhasibatjurnal.az' 
      : 'http://localhost:5173');
    
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    isDevelopment: isDevelopment,
    BASE_URL: process.env.BASE_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    frontendUrl: frontendUrl,
    EPOINT_SUCCESS_URL: process.env.EPOINT_SUCCESS_URL,
    EPOINT_ERROR_URL: process.env.EPOINT_ERROR_URL,
    EPOINT_RESULT_URL: process.env.EPOINT_RESULT_URL,
    EPOINT_MOCK_MODE: process.env.EPOINT_MOCK_MODE,
    // Debug info
    env_BASE_URL: process.env.BASE_URL,
    env_NODE_ENV: process.env.NODE_ENV,
    server_origin: req.get('host'),
    server_protocol: req.protocol
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/payments', paymentRoutes);
app.use('/pdfs', pdfRoutes);
app.use('/admin', adminRoutes);
app.use('/categories/pdfs', categoryPdfRoutes);
app.use('/categories', categoryRoutes);
app.use('/news', newsRoutes);
app.use('/services', serviceRoutes);
app.use('/cvs', cvRoutes);
app.use('/ads', adRoutes);
app.use('/activity-logs', activityLogRoutes);

// Error logging middleware
app.use(errorLogger);

// Error handling middleware
app.use((err, req, res, next) => {
  // Console'a detaylı hata logları yazdır
  console.error('\n❌ ========== ERROR OCCURRED ==========');
  console.error('❌ Method:', req.method);
  console.error('❌ Path:', req.path);
  console.error('❌ Error Message:', err.message);
  console.error('❌ Error Name:', err.name);
  console.error('❌ Error Code:', err.code);
  console.error('❌ Stack:', err.stack);
  
  if (req.body) {
    console.error('❌ Request Body:', JSON.stringify(req.body, null, 2));
  }
  
  if (req.files) {
    console.error('❌ Request Files:', Object.keys(req.files));
  }
  
  console.error('❌ ====================================\n');
  
  // Detailed error response
  const errorResponse = {
    status: 'error',
    message: err.message || 'Something went wrong!'
  };

  // Add more details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details || null;
    errorResponse.name = err.name;
    errorResponse.code = err.code;
  }

  // Send appropriate status code
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json(errorResponse);
});

export default app;
