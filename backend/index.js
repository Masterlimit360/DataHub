const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRouter = require('./routes/api');
const { seedAdminIfEmpty } = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for frontend requests
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('CORS Policy restriction: Origin not allowed.'), false);
  },
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

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
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
