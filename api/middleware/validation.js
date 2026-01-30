/**
 * Input validation middleware for API routes
 */

/**
 * Validates phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
const isValidPhone = (phone) => {
  // Indonesian phone number format: 08xx-xxxx-xxxx or +628xx-xxxx-xxxx
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

/**
 * Validates date format and range
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid
 */
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return false;
  }
  
  // Date should not be in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Date should not be more than 1 year in the future
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  return date >= today && date <= oneYearFromNow;
};

/**
 * Sanitizes string input to prevent SQL injection
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove potentially dangerous characters
  return input
    .replace(/[';\\]/g, '') // Remove quotes and backslashes
    .trim()
    .substring(0, 255); // Limit length
};

/**
 * Sanitizes phone number
 * @param {string} phone - Phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') {
    return phone;
  }
  // Remove spaces, dashes, and parentheses
  return phone.replace(/[\s\-\(\)]/g, '').trim();
};

/**
 * Validates UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} - True if valid UUID
 */
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Middleware to validate booking data (used in bookings.js line 195)
 */
const validateBookingData = (req, res, next) => {
  try {
    const { 
      patient_name, 
      patient_phone, 
      patient_address,
      appointment_date, 
      appointment_time, 
      selected_services 
    } = req.body;
    
    // Validate required fields
    if (!patient_name || !patient_phone || !appointment_date || !appointment_time) {
      return res.status(400).json({ 
        success: false,
        message: 'Data tidak lengkap. Mohon isi semua field yang diperlukan.',
        required: ['patient_name', 'patient_phone', 'appointment_date', 'appointment_time']
      });
    }
    
    // Validate phone number
    if (!isValidPhone(patient_phone)) {
      return res.status(400).json({ 
        success: false,
        message: 'Format nomor telepon tidak valid. Gunakan format: 08xxxxxxxxxx atau +628xxxxxxxxxx'
      });
    }
    
    // Validate date
    if (!isValidDate(appointment_date)) {
      return res.status(400).json({ 
        success: false,
        message: 'Tanggal appointment tidak valid. Tanggal harus hari ini atau di masa depan, dan dalam 1 tahun.'
      });
    }
    
    // Validate services array
    if (!Array.isArray(selected_services) || selected_services.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Minimal satu layanan harus dipilih'
      });
    }
    
    // Validate each service has required fields
    for (const service of selected_services) {
      if (!service.id || !service.name || service.price === undefined) {
        return res.status(400).json({ 
          success: false,
          message: 'Data layanan tidak valid. Setiap layanan harus memiliki id, name, dan price'
        });
      }
    }
    
    // Sanitize string inputs
    req.body.patient_name = sanitizeString(patient_name);
    req.body.patient_phone = sanitizePhone(patient_phone);
    req.body.patient_address = patient_address ? sanitizeString(patient_address) : '';
    req.body.patient_notes = req.body.patient_notes ? sanitizeString(req.body.patient_notes) : '';
    
    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(400).json({ 
      success: false,
      message: 'Validasi gagal' 
    });
  }
};

/**
 * Middleware to validate booking creation request
 */
const validateBookingCreate = (req, res, next) => {
  try {
    const { patient_name, patient_phone, appointment_date, appointment_time, services } = req.body;
    
    // Validate required fields
    if (!patient_name || !patient_phone || !appointment_date || !appointment_time) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['patient_name', 'patient_phone', 'appointment_date', 'appointment_time']
      });
    }
    
    // Validate phone number
    if (!isValidPhone(patient_phone)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format. Use format: 08xxxxxxxxxx or +628xxxxxxxxxx'
      });
    }
    
    // Validate date
    if (!isValidDate(appointment_date)) {
      return res.status(400).json({ 
        error: 'Invalid appointment date. Date must be today or in the future, and within 1 year.'
      });
    }
    
    // Validate services array
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ 
        error: 'At least one service must be selected'
      });
    }
    
    // Validate each service has required fields
    for (const service of services) {
      if (!service.service_id || !service.option_name || service.price === undefined) {
        return res.status(400).json({ 
          error: 'Invalid service data. Each service must have service_id, option_name, and price'
        });
      }
    }
    
    // Sanitize string inputs
    req.body.patient_name = sanitizeString(patient_name);
    req.body.patient_phone = sanitizeString(patient_phone);
    req.body.notes = req.body.notes ? sanitizeString(req.body.notes) : '';
    
    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(400).json({ error: 'Validation failed' });
  }
};

/**
 * Middleware to validate booking query by phone
 */
const validateBookingQuery = (req, res, next) => {
  try {
    const { phone, date } = req.query;
    
    if (!phone) {
      return res.status(400).json({ 
        error: 'Phone number is required'
      });
    }
    
    // Validate phone number
    if (!isValidPhone(phone)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format'
      });
    }
    
    // Validate date if provided
    if (date && !isValidDate(date)) {
      return res.status(400).json({ 
        error: 'Invalid date format'
      });
    }
    
    // Sanitize inputs
    req.query.phone = sanitizeString(phone);
    if (date) {
      req.query.date = sanitizeString(date);
    }
    
    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(400).json({ error: 'Validation failed' });
  }
};

/**
 * Middleware to validate service ID parameter
 */
const validateServiceId = (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id || !isValidUUID(id)) {
      return res.status(400).json({ 
        error: 'Invalid service ID format'
      });
    }
    
    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(400).json({ error: 'Validation failed' });
  }
};

/**
 * Middleware to validate gallery data
 */
const validateGalleryData = (req, res, next) => {
  try {
    const { title, image_url, category } = req.body;
    
    // Validate required fields
    if (!title || !image_url || !category) {
      return res.status(400).json({ 
        success: false,
        message: 'Data tidak lengkap',
        required: ['title', 'image_url', 'category']
      });
    }
    
    // Sanitize string inputs
    req.body.title = sanitizeString(title);
    req.body.description = req.body.description ? sanitizeString(req.body.description) : '';
    req.body.category = sanitizeString(category);
    
    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(400).json({ 
      success: false,
      message: 'Validasi gagal' 
    });
  }
};

module.exports = {
  validateBookingCreate,
  validateBookingQuery,
  validateServiceId,
  validateBookingData,
  validateGalleryData,
  sanitizePhone,
  isValidPhone,
  isValidDate,
  isValidUUID,
  sanitizeString
};