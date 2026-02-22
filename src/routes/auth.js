const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { generateToken, setAuthCookie, clearAuthCookie } = require('../middleware/auth');
const { sanitizeString } = require('../middleware/validation');
const logger = require('../config/logger');
const { createResponse } = require('../utils/helpers');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');

// Login requires service role to bypass RLS on users table
const authClient = supabaseAdmin || supabase;

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    // Service role key required for admin login (users table has RLS)
    if (!supabaseAdmin) {
      logger.warn('SUPABASE_SERVICE_ROLE_KEY not set - admin login may fail due to RLS');
    }

    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json(createResponse(false, null, ERROR_MESSAGES.INVALID_REQUEST));
    }

    // Sanitize username
    const sanitizedUsername = sanitizeString(username);

    // Call authenticate function (use authClient = admin preferred for RLS bypass)
    const { data, error } = await authClient.rpc('authenticate_user', {
      input_username: sanitizedUsername,
      input_password: password
    });

    if (error) throw error;

    // Check authentication result
    const authResult = data[0];

    if (!authResult || !authResult.success) {
      return res.status(401).json(
        createResponse(false, null, authResult?.message || ERROR_MESSAGES.INVALID_CREDENTIALS)
      );
    }

    // Generate JWT token
    const token = generateToken({
      id: authResult.user_id,
      username: authResult.username,
      role: authResult.role
    });

    // Set secure httpOnly cookie
    setAuthCookie(res, token);

    // Return success with token (for backward compatibility with localStorage)
    res.json(createResponse(true, {
      token, // Still return token for clients that use localStorage
      user: {
        id: authResult.user_id,
        username: authResult.username,
        full_name: authResult.full_name,
        role: authResult.role
      }
    }, SUCCESS_MESSAGES.LOGIN_SUCCESS));

  } catch (error) {
    logger.error('Login error:', { error: error.message, stack: error.stack });
    // Network/Supabase connection errors
    if (error.message.includes('fetch failed') || error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json(createResponse(false, null, 
        'Koneksi database gagal. Pastikan environment variables Supabase sudah diatur di Vercel Project Settings.'));
    }
    // Invalid API key or config
    if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
      return res.status(503).json(createResponse(false, null, 
        'Konfigurasi database salah. Periksa Supabase API keys di Vercel Dashboard.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  try {
    // Clear auth cookie
    clearAuthCookie(res);

    res.json(createResponse(true, null, SUCCESS_MESSAGES.LOGOUT_SUCCESS));

  } catch (error) {
    logger.error('Logout error:', { error: error.message });
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    // Get token from cookie or header
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return res.status(401).json(createResponse(false, null, ERROR_MESSAGES.UNAUTHORIZED));
    }

    // Verify token using jwt
    const jwt = require('jsonwebtoken');
    const { getConfig } = require('../config/env-validator');
    const config = getConfig();

    jwt.verify(token, config.jwt.secret, (err, user) => {
      if (err) {
        return res.status(403).json(createResponse(false, null, ERROR_MESSAGES.TOKEN_EXPIRED));
      }

      res.json(createResponse(true, {
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }));
    });

  } catch (error) {
    logger.error('Verify token error:', { error: error.message });
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

module.exports = router;