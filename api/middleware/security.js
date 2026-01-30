const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

// ===== RATE LIMITING =====

// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Terlalu banyak request dari IP ini, silakan coba lagi setelah 15 menit'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/api/health';
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak request dari IP ini, silakan coba lagi setelah 15 menit'
    });
  }
});

// Strict rate limiter for authentication - 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit'
  },
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      body: { email: req.body?.email }
    });
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit'
    });
  }
});

// Booking rate limiter - 10 bookings per hour per IP
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'Terlalu banyak booking dari IP ini. Silakan coba lagi setelah 1 jam'
  },
  handler: (req, res) => {
    logger.warn('Booking rate limit exceeded', {
      ip: req.ip,
      body: {
        patient_name: req.body?.patient_name,
        patient_phone: req.body?.patient_phone
      }
    });
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak booking dari IP ini. Silakan coba lagi setelah 1 jam'
    });
  }
});

// ===== CORS CONFIGURATION =====

function configureCORS() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];

  return {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl, etc.)
      if (!origin) return callback(null, true);
      
      // In production, allow Vercel domains
      if (process.env.NODE_ENV === 'production' && origin.includes('.vercel.app')) {
        return callback(null, true);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        logger.warn('CORS blocked request', { origin });
        callback(null, true); // Allow in production for now, can be stricter later
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };
}

// ===== ERROR SANITIZATION =====

function sanitizeError(err, req, res, next) {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Terjadi kesalahan pada server'
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

// ===== SECURITY EVENT LOGGING =====

function securityLogger(req, res, next) {
  // Log security-relevant events
  const sensitiveRoutes = ['/api/auth', '/api/bookings'];
  const isSensitive = sensitiveRoutes.some(route => req.path.startsWith(route));

  if (isSensitive) {
    logger.info('Security-relevant request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  }

  next();
}

module.exports = {
  apiLimiter,
  authLimiter,
  bookingLimiter,
  configureCORS,
  sanitizeError,
  securityLogger
};