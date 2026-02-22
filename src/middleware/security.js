const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');
const { RATE_LIMIT, ERROR_MESSAGES } = require('../utils/constants');

// ===== RATE LIMITING =====

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT.GENERAL.WINDOW_MS,
  max: RATE_LIMIT.GENERAL.MAX_REQUESTS,
  message: {
    success: false,
    message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
    });
  }
});

// Strict rate limiter for authentication
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH.WINDOW_MS,
  max: RATE_LIMIT.AUTH.MAX_REQUESTS,
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    message: ERROR_MESSAGES.AUTH_RATE_LIMIT
  },
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      body: { email: req.body?.email }
    });
    res.status(429).json({
      success: false,
      message: ERROR_MESSAGES.AUTH_RATE_LIMIT
    });
  }
});

// Booking rate limiter
const bookingLimiter = rateLimit({
  windowMs: RATE_LIMIT.BOOKING.WINDOW_MS,
  max: RATE_LIMIT.BOOKING.MAX_REQUESTS,
  message: {
    success: false,
    message: ERROR_MESSAGES.BOOKING_RATE_LIMIT
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
      message: ERROR_MESSAGES.BOOKING_RATE_LIMIT
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
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      if (process.env.NODE_ENV === 'development') return callback(null, true);
      // Allow Vercel deployments when ALLOWED_ORIGINS not set (*.vercel.app, preview URLs)
      if (!process.env.ALLOWED_ORIGINS && process.env.NODE_ENV === 'production') {
        try {
          const host = new URL(origin).hostname;
          if (host.endsWith('.vercel.app') || host === 'vercel.app') return callback(null, true);
        } catch (_) {}
      }
      
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
}

// ===== HELMET CONFIGURATION =====

function configureHelmet() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", process.env.SUPABASE_URL || ""]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  });
}

// ===== HTTPS ENFORCEMENT =====

function enforceHTTPS(req, res, next) {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    logger.info('Redirecting to HTTPS', { url: req.url });
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
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
    ? ERROR_MESSAGES.INTERNAL_SERVER_ERROR
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
  configureHelmet,
  enforceHTTPS,
  sanitizeError,
  securityLogger
};