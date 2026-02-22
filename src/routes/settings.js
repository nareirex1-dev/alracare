const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../config/logger');
const { createResponse } = require('../utils/helpers');
const { ERROR_MESSAGES } = require('../utils/constants');

// Get all settings
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    let query = supabase
      .from('settings')
      .select('*');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform to key-value object
    const settings = {};
    data.forEach(setting => {
      if (!settings[setting.category]) {
        settings[setting.category] = {};
      }
      settings[setting.category][setting.id] = setting.value;
    });

    res.json(createResponse(true, settings));

  } catch (error) {
    logger.error('Get settings error:', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Get single setting by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json(createResponse(false, null, 'Pengaturan tidak ditemukan'));
    }

    res.json(createResponse(true, data));

  } catch (error) {
    logger.error('Get setting error:', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Update settings (Admin only)
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json(createResponse(false, null, ERROR_MESSAGES.INVALID_REQUEST));
    }

    const client = supabaseAdmin || supabase;
    const updates = [];

    // Prepare updates
    for (const [key, value] of Object.entries(settings)) {
      updates.push(
        client
          .from('settings')
          .update({ value })
          .eq('id', key)
      );
    }

    // Execute all updates
    await Promise.all(updates);

    res.json(createResponse(true, null, 'Pengaturan berhasil diupdate'));

  } catch (error) {
    logger.error('Update settings error:', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Get social media accounts
router.get('/social/accounts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('social_media')
      .select('*') 
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Tetap menggunakan logika Grouping asli Anda yang kuat
    const socialMedia = {};
    data.forEach(account => {
      if (!socialMedia[account.platform]) {
        socialMedia[account.platform] = [];
      }
      
      // PERBAIKAN: Mengambil data dari properti objek 'account'
      // dan menyesuaikan dengan nama kolom di SQL (name & url)
      socialMedia[account.platform].push({
        name: account.name, 
        url: account.url    
      });
    });

    res.json(createResponse(true, socialMedia));

  } catch (error) {
    logger.error('Get social media error:', { error: error.message });
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

module.exports = router;