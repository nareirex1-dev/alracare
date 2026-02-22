/**
 * Application Constants
 * Centralized constants for the entire application
 */

// ===== HTTP STATUS CODES =====
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

// ===== RATE LIMITING =====
const RATE_LIMIT = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5
  },
  BOOKING: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 10
  }
};

// ===== PAGINATION =====
const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0
};

// ===== CACHE =====
const CACHE = {
  SERVICES_KEY: 'alracare_services_cache',
  TTL: 60 * 60 * 1000, // 1 hour
  VERSION: '1.0'
};

// ===== DATE & TIME =====
const DATE_TIME = {
  TIMEZONE: 'Asia/Jakarta',
  DATE_FORMAT: 'yyyy-MM-dd',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'yyyy-MM-dd HH:mm:ss'
};

// ===== BOOKING STATUS =====
const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// ===== VALIDATION =====
const VALIDATION = {
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 13,
    REGEX: /^(\+62|62|0)[0-9]{9,12}$/
  },
  NAME: {
    MIN_WORDS: 2,
    REGEX: /^[a-zA-Z\s]{3,}$/
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  }
};

// ===== ERROR MESSAGES =====
const ERROR_MESSAGES = {
  // General
  INTERNAL_SERVER_ERROR: 'Terjadi kesalahan pada server',
  INVALID_REQUEST: 'Permintaan tidak valid',
  
  // Authentication
  UNAUTHORIZED: 'Anda tidak memiliki akses',
  INVALID_CREDENTIALS: 'Email atau password salah',
  TOKEN_EXPIRED: 'Sesi Anda telah berakhir, silakan login kembali',
  
  // Validation
  REQUIRED_FIELD: 'Field ini wajib diisi',
  INVALID_PHONE: 'Format nomor telepon tidak valid',
  INVALID_EMAIL: 'Format email tidak valid',
  INVALID_DATE: 'Format tanggal tidak valid',
  
  // Booking
  BOOKING_NOT_FOUND: 'Booking tidak ditemukan',
  DUPLICATE_BOOKING: 'Anda sudah memiliki booking untuk tanggal yang sama',
  BOOKING_FAILED: 'Gagal membuat booking',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'Terlalu banyak request dari IP ini',
  AUTH_RATE_LIMIT: 'Terlalu banyak percobaan login',
  BOOKING_RATE_LIMIT: 'Terlalu banyak booking dalam waktu singkat'
};

// ===== SUCCESS MESSAGES =====
const SUCCESS_MESSAGES = {
  BOOKING_CREATED: 'Booking berhasil dibuat',
  BOOKING_UPDATED: 'Booking berhasil diupdate',
  BOOKING_CANCELLED: 'Booking berhasil dibatalkan',
  LOGIN_SUCCESS: 'Login berhasil',
  LOGOUT_SUCCESS: 'Logout berhasil'
};

// ===== IMAGE =====
const IMAGE = {
  MAX_CACHE_SIZE: 100,
  LOAD_TIMEOUT: 10000, // 10 seconds
  DEFAULT_ORIENTATION: 'landscape'
};

// ===== LOGGING =====
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

// ===== FILE SIZE LIMITS =====
const FILE_SIZE = {
  MAX_LOG_SIZE: 5242880, // 5MB
  MAX_LOG_FILES: 5
};

module.exports = {
  HTTP_STATUS,
  RATE_LIMIT,
  PAGINATION,
  CACHE,
  DATE_TIME,
  BOOKING_STATUS,
  VALIDATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  IMAGE,
  LOG_LEVELS,
  FILE_SIZE
};