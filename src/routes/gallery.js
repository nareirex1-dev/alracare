const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateGalleryData } = require('../middleware/validation');
const logger = require('../config/logger');
const { createResponse } = require('../utils/helpers');
const { ERROR_MESSAGES } = require('../utils/constants');

// Get all gallery images
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    res.json(createResponse(true, data));

  } catch (error) {
    logger.error('Get gallery error:', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Get single gallery image by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json(createResponse(false, null, 'Gambar tidak ditemukan'));
    }

    res.json(createResponse(true, data));

  } catch (error) {
    logger.error('Get gallery image error:', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Add new gallery image (Admin only)
router.post('/', authenticateToken, requireAdmin, validateGalleryData, async (req, res) => {
  try {
    const { title, description, image_url, category } = req.body;

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('gallery')
      .insert([{
        title,
        description,
        image_url,
        category,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(createResponse(true, data, 'Gambar berhasil ditambahkan'));

  } catch (error) {
    logger.error('Create gallery error:', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Update gallery image (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image_url, category, is_active } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (category !== undefined) updateData.category = category;
    if (is_active !== undefined) updateData.is_active = is_active;

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('gallery')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(createResponse(true, data, 'Gambar berhasil diupdate'));

  } catch (error) {
    logger.error('Update gallery error:', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Delete gallery image (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('gallery')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json(createResponse(true, null, 'Gambar berhasil dihapus'));

  } catch (error) {
    logger.error('Delete gallery error:', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

module.exports = router;