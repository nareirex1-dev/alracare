const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { validateServiceId } = require('../middleware/validation');
const logger = require('../config/logger');
const { createResponse } = require('../utils/helpers');
const { ERROR_MESSAGES } = require('../utils/constants');

// Get all services grouped by category (optimized with single query)
router.get('/', async (req, res) => {
  try {
    // Single query with JOIN to avoid N+1 problem
    const { data, error } = await supabase
      .from('service_categories')
      .select(`
        id,
        title,
        description,
        icon,
        display_order,
        is_active,
        services:services(
          id,
          name,
          description,
          price,
          price_numeric,
          image_url,
          category_id,
          display_order,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('is_active', true)
      .eq('services.is_active', true)
      .order('display_order', { ascending: true })
      .order('display_order', { foreignTable: 'services', ascending: true });

    if (error) {
      logger.error('Error fetching services:', { error: error.message, code: error.code });
      throw error; // Re-throw to be caught by outer catch
    }

    // Filter out categories with no active services
    const categoriesWithServices = data.filter(category => 
      category.services && category.services.length > 0
    );

    res.json(categoriesWithServices);
  } catch (err) {
    logger.error('Database connection error:', { error: err.message, stack: err.stack });
    if (err.message.includes('fetch failed') || err.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Get service by ID
router.get('/:id', validateServiceId, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_categories (
          id,
          name,
          description,
          icon
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Error fetching service:', { error: error.message });
      if (error.code === 'PGRST116') {
        return res.status(404).json(createResponse(false, null, 'Service not found'));
      }
      return res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
    }

    res.json(data);
  } catch (error) {
    logger.error('Error in get service by id:', { error: error.message });
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Get services by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('Error fetching services by category:', { error: error.message });
      return res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
    }

    res.json(data);
  } catch (error) {
    logger.error('Error in get services by category:', { error: error.message });
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Create new service (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, base_price, category_id, display_order } = req.body;

    if (!name || !category_id || base_price === undefined) {
      return res.status(400).json(createResponse(false, null, 'Missing required fields: name, category_id, base_price'));
    }

    const { data, error } = await supabase
      .from('services')
      .insert([
        {
          name,
          description: description || '',
          base_price,
          category_id,
          display_order: display_order || 0,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      logger.error('Error creating service:', { error: error.message });
      return res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
    }

    res.status(201).json(data);
  } catch (error) {
    logger.error('Error in create service:', { error: error.message });
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Update service (admin only)
router.put('/:id', authenticateToken, validateServiceId, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, base_price, category_id, display_order, is_active } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (base_price !== undefined) updateData.base_price = base_price;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating service:', { error: error.message });
      if (error.code === 'PGRST116') {
        return res.status(404).json(createResponse(false, null, 'Service not found'));
      }
      return res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
    }

    res.json(data);
  } catch (error) {
    logger.error('Error in update service:', { error: error.message });
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Delete service (admin only)
router.delete('/:id', authenticateToken, validateServiceId, async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting is_active to false
    const { data, error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error deleting service:', { error: error.message });
      if (error.code === 'PGRST116') {
        return res.status(404).json(createResponse(false, null, 'Service not found'));
      }
      return res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
    }

    res.json(createResponse(true, data, 'Service deleted successfully'));
  } catch (error) {
    logger.error('Error in delete service:', { error: error.message });
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

module.exports = router;