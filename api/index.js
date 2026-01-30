// Vercel Serverless Function Entry Point - Unified API Handler
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { apiLimiter, configureCORS, securityLogger, sanitizeError } = require('./middleware/security');

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Security middleware
app.use(securityLogger);

// CORS configuration
app.use(cors(configureCORS()));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply rate limiting to all API routes
app.use(apiLimiter);

// Import routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const serviceRoutes = require('./routes/services');
const galleryRoutes = require('./routes/gallery');
const settingsRoutes = require('./routes/settings');
const notificationRoutes = require('./routes/notifications');

// Mount routes (without /api prefix since Vercel handles that)
app.use('/auth', authRoutes);
app.use('/bookings', bookingRoutes);
app.use('/services', serviceRoutes);
app.use('/gallery', galleryRoutes);
app.use('/settings', settingsRoutes);
app.use('/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '3.0.0',
    platform: 'Vercel Serverless'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Alra Care Clinic API',
    version: '3.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      bookings: '/api/bookings',
      services: '/api/services',
      gallery: '/api/gallery',
      settings: '/api/settings',
      notifications: '/api/notifications'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint tidak ditemukan',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(sanitizeError);

// Export for Vercel serverless - SINGLE FUNCTION
module.exports = app;