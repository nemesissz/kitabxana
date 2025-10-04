import app from './app.js';
import { testConnection } from './config/database.js';
import { config } from 'dotenv';

config();
const port = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await testConnection();

    app.listen(port, () => {
      console.log(`🚀 Server is running on http://localhost:${port}`);
      console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
