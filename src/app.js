import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Routes
import authRoutes from './auth/auth.router.js';
import userRoutes from './users/user.router.js';
import subscriptionRoutes from './subscriptions/subscription.router.js';
import paymentRoutes from './payments/payment.router.js';
import pdfRoutes from './pdfs/pdf.router.js';
import adminRoutes from './admin/admin.router.js';
import categoryRoutes from './categories/category.router.js';
import newsRoutes from './news/news.router.js';

config(); // Load .env variables

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middlewares
app.use(cors());

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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/payments', paymentRoutes);
app.use('/pdfs', pdfRoutes);
app.use('/admin', adminRoutes);
app.use('/categories', categoryRoutes);
app.use('/news', newsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
});

export default app;
