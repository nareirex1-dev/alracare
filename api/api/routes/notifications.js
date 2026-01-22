const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');

// Get notifications by phone number (Public)
router.get('/phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const { status, limit = 50 } = req.query;

    // Clean phone number
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

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
      success: true,
      data: data || [],
      count: data ? data.length : 0
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error mengambil notifikasi'
    });
  }
});

// Get unread count by phone number (Public)
router.get('/phone/:phone/unread-count', async (req, res) => {
  try {
    const { phone } = req.params;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    const { data, error } = await supabase.rpc('get_unread_count', {
      p_user_phone: cleanPhone
    });

    if (error) throw error;

    res.json({
      success: true,
      count: data || 0
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error mengambil jumlah notifikasi'
    });
  }
});

// Mark notification as read (Public)
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Nomor telepon diperlukan'
      });
    }

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Verify notification belongs to this phone number
    const { data: notification, error: verifyError } = await supabase
      .from('notifications')
      .select('user_phone')
      .eq('id', id)
      .single();

    if (verifyError || !notification) {
      return res.status(404).json({
        success: false,
        message: 'Notifikasi tidak ditemukan'
      });
    }

    if (notification.user_phone !== cleanPhone) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk notifikasi ini'
      });
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

    res.json({
      success: true,
      message: 'Notifikasi ditandai sebagai dibaca',
      data
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error menandai notifikasi'
    });
  }
});

// Mark all notifications as read (Public)
router.put('/phone/:phone/read-all', async (req, res) => {
  try {
    const { phone } = req.params;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    const { data, error } = await supabase.rpc('mark_all_notifications_read', {
      p_user_phone: cleanPhone
    });

    if (error) throw error;

    res.json({
      success: true,
      message: 'Semua notifikasi ditandai sebagai dibaca',
      count: data || 0
    });

  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error menandai semua notifikasi'
    });
  }
});

// Delete notification (soft delete) (Public)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Nomor telepon diperlukan'
      });
    }

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Verify notification belongs to this phone number
    const { data: notification, error: verifyError } = await supabase
      .from('notifications')
      .select('user_phone')
      .eq('id', id)
      .single();

    if (verifyError || !notification) {
      return res.status(404).json({
        success: false,
        message: 'Notifikasi tidak ditemukan'
      });
    }

    if (notification.user_phone !== cleanPhone) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk notifikasi ini'
      });
    }

    // Soft delete
    const { error } = await supabase
      .from('notifications')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Notifikasi berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error menghapus notifikasi'
    });
  }
});

// Create notification manually (Admin or System)
router.post('/', async (req, res) => {
  try {
    const { user_phone, type, title, message, booking_id } = req.body;

    if (!user_phone || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap'
      });
    }

    const { data, error } = await supabase.rpc('create_notification', {
      p_user_phone: user_phone,
      p_type: type,
      p_title: title,
      p_message: message,
      p_booking_id: booking_id || null
    });

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Notifikasi berhasil dibuat',
      notification_id: data
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error membuat notifikasi'
    });
  }
});

module.exports = router;