require('dotenv').config(); // Load environment variables FIRST

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const logger = require('../src/config/logger');

// Validate environment variables before anything else
const { validateEnv } = require('../src/config/env-validator');
validateEnv();

// Import security middleware
const {
  apiLimiter,
  authLimiter,
  bookingLimiter,
  configureCORS,
  configureHelmet,
  enforceHTTPS,
  sanitizeError,
  securityLogger
} = require('../src/middleware/security');

// Import Swagger
// const swaggerSpec = require('../src/config/swagger');
// const swaggerUi = require('swagger-ui-express');

const app = express();

// ===== Core Middleware =====
app.use(express.json());
app.use(cookieParser());
app.use(cors(configureCORS()));
app.use(configureHelmet());
app.use(enforceHTTPS);
app.use(securityLogger);

// Apply general API rate limiter to all /api/ routes
app.use('/api/', apiLimiter);

// ===== Swagger API Documentation =====
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
//   customCss: '.swagger-ui .topbar { display: none }',
//   customSiteTitle: 'Alracare Clinic API Documentation'
// }));

// Import routes from src folder
const authRoutes = require('../src/routes/auth');
const bookingRoutes = require('../src/routes/bookings');
const serviceRoutes = require('../src/routes/services');
const galleryRoutes = require('../src/routes/gallery');
const settingsRoutes = require('../src/routes/settings');
const notificationRoutes = require('../src/routes/notifications');

// ===== API ROUTES - Define BEFORE static file serving =====
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);

app.use('/api/bookings', bookingLimiter);
app.use('/api/bookings', bookingRoutes);

app.use('/api/services', serviceRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);

// ===== STATIC FILES - Serve AFTER API routes =====
app.use(express.static(path.join(__dirname, '..')));

// Serve HTML files with specific routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-panel.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-login.html'));
});

app.get('/public-site', (req, res) => {
  res.sendFile(path.join(__dirname, '../public-site.html'));
});

// Fallback for any HTML routes
app.get(/\.html?$/, (req, res, next) => {
  const filePath = path.join(__dirname, '..', req.path);
  res.sendFile(filePath, (err) => {
    if (err) next();
  });
});

app.get(/^\/(?!api\/)/, (req, res, next) => {
  // If requesting root path, serve index.html
  if (req.path === '/' || !req.path.includes('.')) {
    res.sendFile(path.join(__dirname, '../index.html'), (err) => {
      if (err) next();
    });
  } else {
    next();
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ===== Error handling middleware (sanitized) =====
app.use(sanitizeError);

const PORT = process.env.PORT || 3000;

// For production (Vercel serverless) - export app
if (process.env.NODE_ENV === 'production') {
  module.exports = app;
} else {
  // For development - listen to port
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Portal: http://localhost:${PORT}`);
    logger.info(`Public Site: http://localhost:${PORT}/public-site.html`);
    logger.info(`Admin Login: http://localhost:${PORT}/admin-login.html`);
  });
}