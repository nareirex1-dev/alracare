const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { validateServiceId } = require('../middleware/validation');

// Get all services grouped by category (optimized with single query)
router.get('/', async (req, res) => {
  try {
    // Single query with JOIN to avoid N+1 problem
    const { data, error } = await supabase
      .from('service_categories')
      .select(`
        id,
        name,
        description,
        icon,
        display_order,
        is_active,
        services:services(
          id,
          name,
          description,
          base_price,
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
      console.error('Error fetching services:', error);
      return res.status(500).json({ error: 'Failed to fetch services' });
    }

    // Filter out categories with no active services
    const categoriesWithServices = data.filter(category => 
      category.services && category.services.length > 0
    );

    res.json(categoriesWithServices);
  } catch (error) {
    console.error('Error in get services:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      console.error('Error fetching service:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Service not found' });
      }
      return res.status(500).json({ error: 'Failed to fetch service' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in get service by id:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      console.error('Error fetching services by category:', error);
      return res.status(500).json({ error: 'Failed to fetch services' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in get services by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new service (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, base_price, category_id, display_order } = req.body;

    if (!name || !category_id || base_price === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'category_id', 'base_price']
      });
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
      console.error('Error creating service:', error);
      return res.status(500).json({ error: 'Failed to create service' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error in create service:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      console.error('Error updating service:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Service not found' });
      }
      return res.status(500).json({ error: 'Failed to update service' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in update service:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      console.error('Error deleting service:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Service not found' });
      }
      return res.status(500).json({ error: 'Failed to delete service' });
    }

    res.json({ message: 'Service deleted successfully', data });
  } catch (error) {
    console.error('Error in delete service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;