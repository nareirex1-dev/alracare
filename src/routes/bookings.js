const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateBookingData, sanitizePhone } = require('../middleware/validation');
const logger = require('../config/logger');
const {
  BOOKING_STATUS,
  PAGINATION,
  DATE_TIME,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} = require('../utils/constants');
const {
  generateBookingId,
  extractPrice,
  utcToLocal,
  localToUtc,
  formatDate,
  createResponse,
  createPaginationMeta
} = require('../utils/helpers');
const { format } = require('date-fns');

// Get all bookings with pagination (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      status,
      date,
      limit = PAGINATION.DEFAULT_LIMIT,
      offset = PAGINATION.DEFAULT_OFFSET,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // Validate pagination parameters
    const validLimit = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);
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
      ...createResponse(true, data || []),
      pagination: createPaginationMeta(count || 0, validLimit, validOffset)
    });

  } catch (error) {
    logger.error('Get bookings error', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
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
      return res.status(404).json(createResponse(false, null, ERROR_MESSAGES.BOOKING_NOT_FOUND));
    }

    // Convert UTC to local timezone for display
    if (data.appointment_datetime) {
      const localDate = utcToLocal(data.appointment_datetime, DATE_TIME.TIMEZONE);
      data.appointment_datetime_local = format(localDate, DATE_TIME.DATETIME_FORMAT);
    }

    res.json(createResponse(true, data));

  } catch (error) {
    logger.error('Get booking error', { error: error.message, stack: error.stack, id: req.params.id });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
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
      return res.status(404).json(createResponse(false, null, ERROR_MESSAGES.BOOKING_NOT_FOUND));
    }

    res.json(createResponse(true, data));

  } catch (error) {
    logger.error('Check booking error', { error: error.message, stack: error.stack, id: req.params.id });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
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
      ...createResponse(true, data || []),
      count: data?.length || 0
    });

  } catch (error) {
    logger.error('Get booking history error', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Create new booking (Public with validation)
// All patient data is stored in database (patients + bookings tables)
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

    const client = supabaseAdmin || supabase;

    // Check for duplicate booking on same date
    const { data: existingBooking } = await client
      .from('bookings')
      .select('id')
      .eq('patient_phone', sanitizePhone(patient_phone))
      .eq('appointment_date', appointment_date)
      .single();

    if (existingBooking) {
      logger.warn('Duplicate booking attempt', { phone: patient_phone, date: appointment_date });
      return res.status(409).json(
        createResponse(false, null, ERROR_MESSAGES.DUPLICATE_BOOKING)
      );
    }

    // Find or create patient in database
    const cleanPhone = sanitizePhone(patient_phone);
    let patientId = null;
    const { data: existingPatient } = await client
      .from('patients')
      .select('id')
      .eq('phone', cleanPhone)
      .single();

    if (existingPatient) {
      patientId = existingPatient.id;
      // Update patient info if changed
      await client
        .from('patients')
        .update({
          name: patient_name,
          address: patient_address || null,
          medical_notes: patient_notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);
    } else {
      const { data: newPatient, error: patientError } = await client
        .from('patients')
        .insert([{
          name: patient_name,
          phone: cleanPhone,
          address: patient_address || '',
          medical_notes: patient_notes || null
        }])
        .select('id')
        .single();

      if (patientError) {
        logger.error('Create patient error', { error: patientError.message });
        return res.status(500).json(createResponse(false, null, 'Gagal menyimpan data pasien.'));
      }
      patientId = newPatient?.id;
    }

    // Generate booking ID using helper
    const bookingId = generateBookingId();

    // Create appointment datetime in local timezone, then convert to UTC
    const localDateTimeString = `${appointment_date}T${appointment_time}:00`;
    const utcDateTime = localToUtc(localDateTimeString, DATE_TIME.TIMEZONE);

    // Calculate total price using extractPrice helper
    let totalPrice = 0;
    const servicesData = selected_services.map(service => {
      const priceNumeric = extractPrice(service.price);
      totalPrice += priceNumeric;
      
      return {
        service_id: service.id,
        service_name: service.name,
        service_price: service.price,
        price_numeric: priceNumeric
      };
    });

    // Insert booking with patient_id link to database
    const { data: booking, error: bookingError } = await client
      .from('bookings')
      .insert([{
        id: bookingId,
        patient_id: patientId,
        patient_name,
        patient_phone: cleanPhone,
        patient_address,
        patient_notes: patient_notes || 'Tidak ada catatan',
        appointment_date,
        appointment_time,
        appointment_datetime: utcDateTime.toISOString(),
        status: BOOKING_STATUS.PENDING,
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

    res.status(201).json(createResponse(true, completeBooking, SUCCESS_MESSAGES.BOOKING_CREATED));

  } catch (error) {
    logger.error('Create booking error', { error: error.message, stack: error.stack });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.BOOKING_FAILED));
  }
});

// Update booking status (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status using constants
    const validStatuses = Object.values(BOOKING_STATUS);
    if (!validStatuses.includes(status)) {
      return res.status(400).json(createResponse(false, null, ERROR_MESSAGES.INVALID_REQUEST));
    }

    const updateData = { status };

    // Set timestamp based on status
    if (status === BOOKING_STATUS.CONFIRMED) {
      updateData.confirmed_at = new Date().toISOString();
    } else if (status === BOOKING_STATUS.COMPLETED) {
      updateData.completed_at = new Date().toISOString();
    } else if (status === BOOKING_STATUS.CANCELLED) {
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

    res.json(createResponse(true, data, SUCCESS_MESSAGES.BOOKING_UPDATED));

  } catch (error) {
    logger.error('Update booking status error', { error: error.message, id: req.params.id });
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

// Reschedule booking
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time, phone } = req.body;

    // Validate inputs
    if (!appointment_date || !appointment_time || !phone) {
      return res.status(400).json(createResponse(false, null, ERROR_MESSAGES.INVALID_REQUEST));
    }

    // Verify booking belongs to this phone number
    const { data: booking } = await supabase
      .from('bookings')
      .select('patient_phone')
      .eq('id', id)
      .single();

    if (!booking || booking.patient_phone !== sanitizePhone(phone)) {
      return res.status(403).json(createResponse(false, null, ERROR_MESSAGES.UNAUTHORIZED));
    }

    // Update booking with timezone conversion using helpers
    const localDateTimeString = `${appointment_date}T${appointment_time}:00`;
    const utcDateTime = localToUtc(localDateTimeString, DATE_TIME.TIMEZONE);

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

    res.json(createResponse(true, data, SUCCESS_MESSAGES.BOOKING_UPDATED));

  } catch (error) {
    logger.error('Reschedule booking error', { error: error.message, id: req.params.id });
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
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

    res.json(createResponse(true, null, SUCCESS_MESSAGES.BOOKING_CANCELLED));

  } catch (error) {
    logger.error('Delete booking error', { error: error.message, stack: error.stack, id: req.params.id });
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      return res.status(503).json(createResponse(false, null, 'Database connection failed. Please try again later.'));
    }
    res.status(500).json(createResponse(false, null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR));
  }
});

module.exports = router;