/**
 * Utility Helper Functions
 * Shared utility functions used across the application
 */

const { VALIDATION, DATE_TIME } = require('./constants');
const { format, parseISO } = require('date-fns');
const { utcToZonedTime, zonedTimeToUtc } = require('date-fns-tz');

/**
 * Sanitize phone number by removing non-numeric characters
 * @param {string} phone - Phone number to sanitize
 * @returns {string} Sanitized phone number
 */
function sanitizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidPhone(phone) {
  if (!phone) return false;
  const sanitized = sanitizePhone(phone);
  return (
    sanitized.length >= VALIDATION.PHONE.MIN_LENGTH &&
    sanitized.length <= VALIDATION.PHONE.MAX_LENGTH &&
    VALIDATION.PHONE.REGEX.test(phone)
  );
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate name format (minimum 2 words)
 * @param {string} name - Name to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidName(name) {
  if (!name) return false;
  const words = name.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length >= VALIDATION.NAME.MIN_WORDS;
}

/**
 * Convert UTC datetime to local timezone
 * @param {string|Date} utcDateTime - UTC datetime
 * @param {string} timezone - Target timezone (default: Asia/Jakarta)
 * @returns {Date} Local datetime
 */
function utcToLocal(utcDateTime, timezone = DATE_TIME.TIMEZONE) {
  const date = typeof utcDateTime === 'string' ? parseISO(utcDateTime) : utcDateTime;
  return utcToZonedTime(date, timezone);
}

/**
 * Convert local datetime to UTC
 * @param {string|Date} localDateTime - Local datetime
 * @param {string} timezone - Source timezone (default: Asia/Jakarta)
 * @returns {Date} UTC datetime
 */
function localToUtc(localDateTime, timezone = DATE_TIME.TIMEZONE) {
  const date = typeof localDateTime === 'string' ? parseISO(localDateTime) : localDateTime;
  return zonedTimeToUtc(date, timezone);
}

/**
 * Format date to string
 * @param {Date|string} date - Date to format
 * @param {string} formatString - Format string (default: yyyy-MM-dd)
 * @returns {string} Formatted date string
 */
function formatDate(date, formatString = DATE_TIME.DATE_FORMAT) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Extract price from price string (e.g., "Rp 150.000" -> 150000)
 * @param {string} priceString - Price string
 * @returns {number} Numeric price
 */
function extractPrice(priceString) {
  if (!priceString) return 0;
  const match = priceString.match(/(\d+\.?\d*)/g);
  return match ? parseInt(match[0].replace(/\./g, '')) : 0;
}

/**
 * Format number to Indonesian currency format
 * @param {number} price - Price to format
 * @returns {string} Formatted price string
 */
function formatPrice(price) {
  return 'Rp ' + price.toLocaleString('id-ID');
}

/**
 * Generate unique booking ID
 * @returns {string} Unique booking ID
 */
function generateBookingId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `BK${timestamp}${random}`;
}

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
function isPastDate(date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj < today;
}

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Check if string contains suspicious patterns
 * @param {string} input - Input to check
 * @returns {boolean} True if suspicious
 */
function isSuspicious(input) {
  if (!input) return false;
  
  const suspiciousPatterns = [
    /(\.\.|\/etc\/|\/proc\/|\/sys\/)/i, // Path traversal (fixed escape)
    /(union|select|insert|update|delete|drop|create|alter|exec|script)/i, // SQL injection
    /(<script|javascript:|onerror=|onload=)/i // XSS
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input.toLowerCase()));
}

/**
 * Create standardized API response
 * @param {boolean} success - Success status
 * @param {*} data - Response data
 * @param {string} message - Response message
 * @returns {object} Standardized response object
 */
function createResponse(success, data = null, message = '') {
  const response = { success };
  
  if (message) {
    response.message = message;
  }
  
  if (data !== null) {
    response.data = data;
  }
  
  return response;
}

/**
 * Create pagination metadata
 * @param {number} total - Total items
 * @param {number} limit - Items per page
 * @param {number} offset - Current offset
 * @returns {object} Pagination metadata
 */
function createPaginationMeta(total, limit, offset) {
  return {
    total,
    limit,
    offset,
    hasMore: (offset + limit) < total,
    currentPage: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit)
  };
}

module.exports = {
  sanitizePhone,
  isValidPhone,
  isValidEmail,
  isValidName,
  utcToLocal,
  localToUtc,
  formatDate,
  extractPrice,
  formatPrice,
  generateBookingId,
  isPastDate,
  sanitizeInput,
  isSuspicious,
  createResponse,
  createPaginationMeta
};