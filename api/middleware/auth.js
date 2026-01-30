const jwt = require('jsonwebtoken');
const { getConfig } = require('../config/env-validator');

const config = getConfig();

// Validate JWT_SECRET exists (already validated in env-validator, but double-check)
if (!config.jwt.secret) {
  throw new Error('JWT_SECRET is not configured. Please check your environment variables.');
}

/**
 * Middleware to authenticate JWT token
 * Supports both Authorization header and httpOnly cookie
 */
async function authenticateToken(req, res, next) {
  try {
    // Try to get token from Authorization header first
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    // If no token in header, try to get from httpOnly cookie
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    // If still no token, return unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token autentikasi tidak ditemukan. Silakan login kembali.'
      });
    }

    // Verify token
    jwt.verify(token, config.jwt.secret, (err, user) => {
      if (err) {
        // Token expired or invalid
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token sudah expired. Silakan login kembali.',
            code: 'TOKEN_EXPIRED'
          });
        }

        return res.status(403).json({
          success: false,
          message: 'Token tidak valid. Silakan login kembali.',
          code: 'TOKEN_INVALID'
        });
      }

      // Attach user info to request
      req.user = user;
      next();
    });

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat autentikasi'
    });
  }
}

/**
 * Middleware to check if user is admin
 * Must be used after authenticateToken
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autentikasi diperlukan'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya admin yang dapat mengakses resource ini.'
    });
  }

  next();
}

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiration
  });
}

/**
 * Set secure httpOnly cookie with token
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 */
function setAuthCookie(res, token) {
  res.cookie('auth_token', token, {
    httpOnly: true, // Prevents XSS attacks
    secure: config.security.cookieSecure, // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: config.security.cookieDomain,
    path: '/'
  });
}

/**
 * Clear auth cookie
 * @param {Object} res - Express response object
 */
function clearAuthCookie(res) {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: config.security.cookieSecure,
    sameSite: 'strict',
    domain: config.security.cookieDomain,
    path: '/'
  });
}

module.exports = {
  authenticateToken,
  requireAdmin,
  generateToken,
  setAuthCookie,
  clearAuthCookie
};