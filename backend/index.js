const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRouter = require('./routes/api');
const db = require('./db');
const { seedAdminIfEmpty } = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for frontend requests
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: true, // Dynamically allows the requesting origin and supports credentials
  credentials: true
}));

// Configure JSON body parser to capture the raw body (required for Paystack signature verification)
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/payments/webhook')) {
      req.rawBody = buf.toString();
    }
  }
}));

app.use(express.urlencoded({ extended: true }));

// Healthcheck (includes DB connectivity when DATABASE_URL is set)
app.get('/health', async (req, res) => {
  const health = { status: 'UP', timestamp: new Date(), services: {} };

  if (!process.env.DATABASE_URL) {
    health.services.database = 'not_configured';
  } else {
    try {
      await db.query('SELECT 1');
      health.services.database = 'connected';
    } catch (error) {
      health.status = 'DEGRADED';
      health.services.database = 'error';
      health.services.database_error = error.message;
    }
  }

  health.services.wholesale_provider = process.env.WHOLESALE_PROVIDER || 'mock';
  health.services.sms_provider = process.env.SMS_PROVIDER || 'giantsms';

  res.json(health);
});

// Register API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error Handler]:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected server error occurred.'
  });
});

// Boot Database Seeding & Launch Server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`[JB-DataHub Backend] Running in ${process.env.NODE_ENV || 'development'} mode.`);
    console.log(`[JB-DataHub Backend] Server listening on port ${PORT}`);
    
    // Bootstrap Admin user if table is empty
    await seedAdminIfEmpty();
  });
} else {
  // Direct seed in serverless env on load (or via DB script)
  seedAdminIfEmpty().catch(console.error);
}

module.exports = app;
