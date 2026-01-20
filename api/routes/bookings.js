const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateBookingData, sanitizePhone } = require('../middleware/validation');
const { v4: uuidv4 } = require('uuid');
const { format, parseISO } = require('date-fns');
const { utcToZonedTime, zonedTimeToUtc } = require('date-fns-tz');
const logger = require('../config/logger');

// Timezone for Indonesia (WIB)
const TIMEZONE = 'Asia/Jakarta';

// Get all bookings with pagination (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, date, limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    // Validate pagination parameters
    const validLimit = Math.min(parseInt(limit), 100); // Max 100 items per page
    const validOffset = Math.max(parseInt(offset), 0);

    let query = supabase
      .from('bookings')
      .select(`
        *,
        booking_services(*)
      `, { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(validOffset, validOffset + validLimit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('appointment_date', date);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    logger.info('Bookings retrieved', {
      count: data?.length || 0,
      total: count,
      filters: { status, date }
    });

    res.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit: validLimit,
        offset: validOffset,
        hasMore: (validOffset + validLimit) < (count || 0)
      }
    });

  } catch (error) {
    logger.error('Get bookings error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error mengambil data booking'
    });
  }
});

// Get single booking by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_services(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    // Convert UTC to local timezone for display
    if (data.appointment_datetime) {
      const utcDate = parseISO(data.appointment_datetime);
      const localDate = utcToZonedTime(utcDate, TIMEZONE);
      data.appointment_datetime_local = format(localDate, 'yyyy-MM-dd HH:mm:ss');
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    logger.error('Get booking error', { error: error.message, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error mengambil data booking'
    });
  }
});

// Check booking by ID (Public - for users to check their booking)
router.get('/check/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        patient_name,
        patient_phone,
        appointment_date,
        appointment_time,
        status,
        booking_services(service_name, service_price)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    logger.error('Check booking error', { error: error.message, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error memeriksa booking'
    });
  }
});

// Get booking history by phone (Public)
router.get('/history/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const cleanPhone = sanitizePhone(phone);

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        patient_name,
        appointment_date,
        appointment_time,
        status,
        created_at,
        booking_services(service_name, service_price)
      `)
      .eq('patient_phone', cleanPhone)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    logger.error('Get booking history error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error mengambil riwayat booking'
    });
  }
});

// Create new booking (Public with validation)
router.post('/', validateBookingData, async (req, res) => {
  try {
    const {
      patient_name,
      patient_phone,
      patient_address,
      patient_notes,
      appointment_date,
      appointment_time,
      selected_services
    } = req.body;

    // Check for duplicate booking on same date
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('patient_phone', patient_phone)
      .eq('appointment_date', appointment_date)
      .single();

    if (existingBooking) {
      logger.warn('Duplicate booking attempt', { phone: patient_phone, date: appointment_date });
      return res.status(409).json({
        success: false,
        message: 'Anda sudah memiliki booking untuk tanggal yang sama. Silakan pilih tanggal lain.',
        code: 'DUPLICATE_BOOKING'
      });
    }

    // Generate booking ID using UUID (more secure than timestamp)
    const bookingId = 'BK' + Date.now() + uuidv4().substring(0, 8).toUpperCase();

    // Create appointment datetime in local timezone, then convert to UTC
    const localDateTimeString = `${appointment_date}T${appointment_time}:00`;
    const localDateTime = parseISO(localDateTimeString);
    const utcDateTime = zonedTimeToUtc(localDateTime, TIMEZONE);

    // Calculate total price
    let totalPrice = 0;
    const servicesData = selected_services.map(service => {
      const priceNumeric = parseFloat(service.price.replace(/[^0-9]/g, '')) || 0;
      totalPrice += priceNumeric;
      
      return {
        service_id: service.id,
        service_name: service.name,
        service_price: service.price,
        price_numeric: priceNumeric
      };
    });

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        id: bookingId,
        patient_name,
        patient_phone,
        patient_address,
        patient_notes: patient_notes || 'Tidak ada catatan',
        appointment_date,
        appointment_time,
        appointment_datetime: utcDateTime.toISOString(),
        status: 'pending',
        total_price: totalPrice
      }])
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Insert booking services
    const bookingServicesData = servicesData.map(service => ({
      booking_id: bookingId,
      ...service
    }));

    const { error: servicesError } = await supabase
      .from('booking_services')
      .insert(bookingServicesData);

    if (servicesError) throw servicesError;

    // Fetch complete booking data
    const { data: completeBooking } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_services(*)
      `)
      .eq('id', bookingId)
      .single();

    logger.info('Booking created', {
      bookingId,
      patient_name,
      appointment_date,
      services_count: selected_services.length
    });

    res.status(201).json({
      success: true,
      message: 'Booking berhasil dibuat',
      data: completeBooking
    });

  } catch (error) {
    logger.error('Create booking error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error membuat booking'
    });
  }
});

// Update booking status (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }

    const updateData = { status };

    // Set timestamp based on status
    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
    }

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info('Booking status updated', { bookingId: id, status });

    res.json({
      success: true,
      message: 'Status booking berhasil diupdate',
      data
    });

  } catch (error) {
    logger.error('Update booking status error', { error: error.message, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error mengupdate status booking'
    });
  }
});

// Reschedule booking
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time, phone } = req.body;

    // Validate inputs
    if (!appointment_date || !appointment_time || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal, jam, dan nomor telepon harus diisi'
      });
    }

    // Verify booking belongs to this phone number
    const { data: booking } = await supabase
      .from('bookings')
      .select('patient_phone')
      .eq('id', id)
      .single();

    if (!booking || booking.patient_phone !== sanitizePhone(phone)) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk booking ini'
      });
    }

    // Update booking with timezone conversion
    const localDateTimeString = `${appointment_date}T${appointment_time}:00`;
    const localDateTime = parseISO(localDateTimeString);
    const utcDateTime = zonedTimeToUtc(localDateTime, TIMEZONE);

    const { data, error } = await supabase
      .from('bookings')
      .update({
        appointment_date,
        appointment_time,
        appointment_datetime: utcDateTime.toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info('Booking rescheduled', { bookingId: id, new_date: appointment_date });

    res.json({
      success: true,
      message: 'Booking berhasil dijadwalkan ulang',
      data
    });

  } catch (error) {
    logger.error('Reschedule booking error', { error: error.message, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error menjadwalkan ulang booking'
    });
  }
});

// Delete booking (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    logger.info('Booking deleted', { bookingId: id });

    res.json({
      success: true,
      message: 'Booking berhasil dihapus'
    });

  } catch (error) {
    logger.error('Delete booking error', { error: error.message, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Error menghapus booking'
    });
  }
});

module.exports = router;