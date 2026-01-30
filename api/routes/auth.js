const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { generateToken, setAuthCookie, clearAuthCookie } = require('../middleware/auth');
const { sanitizeString } = require('../middleware/validation');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password harus diisi'
      });
    }

    // Sanitize username
    const sanitizedUsername = sanitizeString(username);

    // Call authenticate function
    const { data, error } = await supabase.rpc('authenticate_user', {
      input_username: sanitizedUsername,
      input_password: password
    });

    if (error) throw error;

    // Check authentication result
    const authResult = data[0];

    if (!authResult || !authResult.success) {
      return res.status(401).json({
        success: false,
        message: authResult?.message || 'Username atau password salah'
      });
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
    res.json({
      success: true,
      message: 'Login berhasil',
      token, // Still return token for clients that use localStorage
      user: {
        id: authResult.user_id,
        username: authResult.username,
        full_name: authResult.full_name,
        role: authResult.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  try {
    // Clear auth cookie
    clearAuthCookie(res);

    res.json({
      success: true,
      message: 'Logout berhasil'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat logout'
    });
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
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan'
      });
    }

    // Verify token using jwt
    const jwt = require('jsonwebtoken');
    const { getConfig } = require('../config/env-validator');
    const config = getConfig();

    jwt.verify(token, config.jwt.secret, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Token tidak valid atau sudah expired'
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    });

  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat verifikasi token'
    });
  }
});

module.exports = router;