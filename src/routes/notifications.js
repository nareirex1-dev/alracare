const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const logger = require('../config/logger');
const { createResponse } = require('../utils/helpers');
const { sanitizePhone } = require('../middleware/validation');
const { ERROR_MESSAGES, PAGINATION } = require('../utils/constants');

// Get notifications by phone number (Public)
router.get('/phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const { status, limit = PAGINATION.DEFAULT_LIMIT } = req.query;

    // Clean phone number using shared helper
    const cleanPhone = sanitizePhone(phone);

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_phone', cleanPhone)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status === 'unread') {
      query = query.eq('is_read', false);
    } else if (status === 'read') {
      query = query.eq('is_read', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      ...createResponse(true, data || []),
      count: data ? data.length : 0
    });

  } catch (error) {
    logger.error('Get notifications error:', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Get unread count by phone number (Public)
router.get('/phone/:phone/unread-count', async (req, res) => {
  try {
    const { phone } = req.params;
    const cleanPhone = sanitizePhone(phone);

    const { data, error } = await supabase.rpc('get_unread_count', {
      p_user_phone: cleanPhone
    });

    if (error) throw error;

    res.json(createResponse(true, { count: data || 0 }));

  } catch (error) {
    logger.error('Get unread count error:', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Mark notification as read (Public)
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json(createResponse(false, null, ERROR_MESSAGES.INVALID_REQUEST));
    }

    const cleanPhone = sanitizePhone(phone);

    // Verify notification belongs to this phone number
    const { data: notification, error: verifyError } = await supabase
      .from('notifications')
      .select('user_phone')
      .eq('id', id)
      .single();

    if (verifyError || !notification) {
      return res.status(404).json(createResponse(false, null, 'Notifikasi tidak ditemukan'));
    }

    if (notification.user_phone !== cleanPhone) {
      return res.status(403).json(createResponse(false, null, ERROR_MESSAGES.UNAUTHORIZED));
    }

    // Mark as read
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(createResponse(true, data, 'Notifikasi ditandai sebagai dibaca'));

  } catch (error) {
    logger.error('Mark notification read error:', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Mark all notifications as read (Public)
router.put('/phone/:phone/read-all', async (req, res) => {
  try {
    const { phone } = req.params;
    const cleanPhone = sanitizePhone(phone);

    const { data, error } = await supabase.rpc('mark_all_notifications_read', {
      p_user_phone: cleanPhone
    });

    if (error) throw error;

    res.json(createResponse(true, { count: data || 0 }, 'Semua notifikasi ditandai sebagai dibaca'));

  } catch (error) {
    logger.error('Mark all read error:', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Delete notification (soft delete) (Public)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json(createResponse(false, null, ERROR_MESSAGES.INVALID_REQUEST));
    }

    const cleanPhone = sanitizePhone(phone);

    // Verify notification belongs to this phone number
    const { data: notification, error: verifyError } = await supabase
      .from('notifications')
      .select('user_phone')
      .eq('id', id)
      .single();

    if (verifyError || !notification) {
      return res.status(404).json(createResponse(false, null, 'Notifikasi tidak ditemukan'));
    }

    if (notification.user_phone !== cleanPhone) {
      return res.status(403).json(createResponse(false, null, ERROR_MESSAGES.UNAUTHORIZED));
    }

    // Soft delete
    const { error } = await supabase
      .from('notifications')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;

    res.json(createResponse(true, null, 'Notifikasi berhasil dihapus'));

  } catch (error) {
    logger.error('Delete notification error:', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Create notification manually (Admin or System)
router.post('/', async (req, res) => {
  try {
    const { user_phone, type, title, message, booking_id } = req.body;

    if (!user_phone || !type || !title || !message) {
      return res.status(400).json(createResponse(false, null, ERROR_MESSAGES.INVALID_REQUEST));
    }

    const { data, error } = await supabase.rpc('create_notification', {
      p_user_phone: user_phone,
      p_type: type,
      p_title: title,
      p_message: message,
      p_booking_id: booking_id || null
    });

    if (error) throw error;

    res.status(201).json(createResponse(true, { notification_id: data }, 'Notifikasi berhasil dibuat'));

  } catch (error) {
    logger.error('Create notification error:', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

module.exports = router;