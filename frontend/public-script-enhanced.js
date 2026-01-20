// ===== PHASE 2: NEW FEATURES =====

// ===== CHECK BOOKING STATUS =====
function showCheckBookingModal() {
    const content = `
        <div class="booking-form-modal">
            <div class="booking-header">
                <h2><i class="fas fa-search me-2"></i>Cek Status Booking</h2>
                <p class="form-description">Masukkan nomor booking Anda untuk mengecek status</p>
            </div>
            
            <form id="checkBookingForm" class="booking-form">
                <div class="form-group">
                    <label for="checkBookingId">Nomor Booking *</label>
                    <input type="text" id="checkBookingId" name="checkBookingId" required 
                           placeholder="Contoh: BK1234567890ABCDEF"
                           pattern="BK[0-9A-Z]+"
                           style="text-transform: uppercase;">
                    <small class="form-hint">Format: BK diikuti angka dan huruf (contoh: BK1234567890ABCDEF)</small>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cta-button secondary" onclick="modalManager.closeAll()">
                        <i class="fas fa-times"></i> Batal
                    </button>
                    <button type="submit" class="cta-button">
                        <i class="fas fa-search"></i> Cek Status
                    </button>
                </div>
            </form>
        </div>
    `;
    
    const modalContent = document.getElementById('checkBookingContent');
    if (modalContent) {
        modalContent.innerHTML = content;
        modalManager.openModal('checkBookingModal');
        
        // Setup form submission
        const form = document.getElementById('checkBookingForm');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                const bookingId = document.getElementById('checkBookingId').value.trim().toUpperCase();
                await checkBookingStatus(bookingId);
            });
        }
    }
}

async function checkBookingStatus(bookingId) {
    try {
        showNotification('⏳ Mengecek status booking...', 'info');
        
        const response = await apiCall(API_CONFIG.ENDPOINTS.BOOKING_CHECK(bookingId));
        
        if (response.success && response.data) {
            displayBookingStatus(response.data);
        } else {
            throw new Error(response.message || 'Booking tidak ditemukan');
        }
        
    } catch (error) {
        console.error('Error checking booking:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

function displayBookingStatus(booking) {
    const appointmentDate = new Date(booking.appointment_datetime);
    const formattedDate = appointmentDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const servicesHTML = booking.booking_services ? booking.booking_services.map(service => `
        <div class="service-summary-item">
            <div>
                <strong>${service.service_name}</strong>
            </div>
            <span class="service-price">${service.service_price}</span>
        </div>
    `).join('') : '';
    
    // Determine timeline status
    const statusMap = {
        'pending': { step: 1, text: 'Menunggu Konfirmasi', icon: 'clock', color: '#f39c12' },
        'confirmed': { step: 2, text: 'Dikonfirmasi', icon: 'check-circle', color: '#27ae60' },
        'completed': { step: 3, text: 'Selesai', icon: 'check-double', color: '#27ae60' },
        'cancelled': { step: 0, text: 'Dibatalkan', icon: 'times-circle', color: '#e74c3c' }
    };
    
    const currentStatus = statusMap[booking.status] || statusMap['pending'];
    
    const content = `
        <div class="booking-form-modal">
            <div class="booking-header">
                <h2><i class="fas fa-info-circle me-2"></i>Status Booking</h2>
                <p class="booking-id">Nomor Booking: <strong>${booking.id}</strong></p>
            </div>
            
            ${booking.status !== 'cancelled' ? `
            <div class="status-timeline">
                <div class="timeline-step ${currentStatus.step >= 1 ? 'completed' : ''}">
                    <div class="timeline-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="timeline-label">Booking Dibuat</div>
                </div>
                
                <div class="timeline-step ${currentStatus.step >= 2 ? 'active' : ''} ${currentStatus.step > 2 ? 'completed' : ''}">
                    <div class="timeline-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="timeline-label">Dikonfirmasi</div>
                </div>
                
                <div class="timeline-step ${currentStatus.step >= 3 ? 'active' : ''}">
                    <div class="timeline-icon">
                        <i class="fas fa-check-double"></i>
                    </div>
                    <div class="timeline-label">Selesai</div>
                </div>
            </div>
            ` : `
            <div class="alert alert-danger" style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #ffeaea; border-left: 4px solid #e74c3c;">
                <i class="fas fa-times-circle me-2"></i>
                <strong>Booking Dibatalkan</strong>
            </div>
            `}
            
            <div class="booking-details" style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0;">
                <h4 style="margin-bottom: 1rem; color: var(--text-dark);">
                    <i class="fas fa-user me-2"></i>Informasi Pasien
                </h4>
                <div class="detail-row">
                    <span class="detail-label">Nama:</span>
                    <span class="detail-value">${booking.patient_name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Telepon:</span>
                    <span class="detail-value">${booking.patient_phone}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Alamat:</span>
                    <span class="detail-value">${booking.patient_address}</span>
                </div>
            </div>
            
            <div class="booking-details" style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0;">
                <h4 style="margin-bottom: 1rem; color: var(--text-dark);">
                    <i class="fas fa-calendar-alt me-2"></i>Jadwal Perawatan
                </h4>
                <div class="detail-row">
                    <span class="detail-label">Tanggal:</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Jam:</span>
                    <span class="detail-value">${booking.appointment_time}</span>
                </div>
            </div>
            
            <div class="booking-details" style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0;">
                <h4 style="margin-bottom: 1rem; color: var(--text-dark);">
                    <i class="fas fa-concierge-bell me-2"></i>Layanan
                </h4>
                ${servicesHTML}
            </div>
            
            ${booking.patient_notes && booking.patient_notes !== 'Tidak ada catatan' ? `
            <div class="booking-details" style="background: #fff3e0; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0;">
                <h4 style="margin-bottom: 0.5rem; color: var(--text-dark);">
                    <i class="fas fa-sticky-note me-2"></i>Catatan
                </h4>
                <p style="margin: 0; color: var(--text-light);">${booking.patient_notes}</p>
            </div>
            ` : ''}
            
            <div class="form-actions" style="margin-top: 2rem;">
                ${booking.status === 'pending' || booking.status === 'confirmed' ? `
                <button type="button" class="cta-button secondary" onclick="showRescheduleModal('${booking.id}', '${booking.patient_phone}')">
                    <i class="fas fa-calendar-alt"></i> Reschedule
                </button>
                ` : ''}
                <button type="button" class="cta-button" onclick="downloadBookingPDF('${booking.id}')">
                    <i class="fas fa-download"></i> Download Bukti
                </button>
                <button type="button" class="cta-button" onclick="contactViaWhatsApp('${booking.id}')">
                    <i class="fab fa-whatsapp"></i> Hubungi Klinik
                </button>
            </div>
        </div>
    `;
    
    const modalContent = document.getElementById('checkBookingContent');
    if (modalContent) {
        modalContent.innerHTML = content;
    }
}

// ===== BOOKING HISTORY =====
function showBookingHistoryModal() {
    const content = `
        <div class="booking-form-modal">
            <div class="booking-header">
                <h2><i class="fas fa-history me-2"></i>Riwayat Booking</h2>
                <p class="form-description">Masukkan nomor telepon untuk melihat riwayat booking Anda</p>
            </div>
            
            <form id="bookingHistoryForm" class="booking-form">
                <div class="form-group">
                    <label for="historyPhone">Nomor Telepon *</label>
                    <input type="tel" id="historyPhone" name="historyPhone" required 
                           placeholder="Contoh: 081234567890"
                           pattern="[0-9]{10,13}">
                    <small class="form-hint">Masukkan nomor telepon yang Anda gunakan saat booking</small>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cta-button secondary" onclick="modalManager.closeAll()">
                        <i class="fas fa-times"></i> Batal
                    </button>
                    <button type="submit" class="cta-button">
                        <i class="fas fa-search"></i> Lihat Riwayat
                    </button>
                </div>
            </form>
        </div>
    `;
    
    const modalContent = document.getElementById('bookingHistoryContent');
    if (modalContent) {
        modalContent.innerHTML = content;
        modalManager.openModal('bookingHistoryModal');
        
        // Setup form submission
        const form = document.getElementById('bookingHistoryForm');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                const phone = document.getElementById('historyPhone').value.trim();
                await loadBookingHistory(phone);
            });
        }
    }
}

async function loadBookingHistory(phone, status = 'all') {
    try {
        showNotification('⏳ Memuat riwayat booking...', 'info');
        
        const endpoint = status === 'all' 
            ? API_CONFIG.ENDPOINTS.BOOKING_HISTORY(phone)
            : API_CONFIG.ENDPOINTS.BOOKING_HISTORY(phone) + `?status=${status}`;
        
        const response = await apiCall(endpoint);
        
        if (response.success) {
            displayBookingHistory(response.data, phone, status);
        } else {
            throw new Error(response.message || 'Gagal memuat riwayat booking');
        }
        
    } catch (error) {
        console.error('Error loading booking history:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

function displayBookingHistory(bookings, phone, currentFilter = 'all') {
    const content = `
        <div class="booking-form-modal">
            <div class="booking-header">
                <h2><i class="fas fa-history me-2"></i>Riwayat Booking</h2>
                <p class="form-description">Nomor Telepon: <strong>${phone}</strong></p>
                <p class="form-description">Total: <strong>${bookings.length}</strong> booking</p>
            </div>
            
            <div class="filter-buttons">
                <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" 
                        onclick="loadBookingHistory('${phone}', 'all')">
                    <i class="fas fa-list"></i> Semua
                </button>
                <button class="filter-btn ${currentFilter === 'pending' ? 'active' : ''}" 
                        onclick="loadBookingHistory('${phone}', 'pending')">
                    <i class="fas fa-clock"></i> Menunggu
                </button>
                <button class="filter-btn ${currentFilter === 'confirmed' ? 'active' : ''}" 
                        onclick="loadBookingHistory('${phone}', 'confirmed')">
                    <i class="fas fa-check-circle"></i> Dikonfirmasi
                </button>
                <button class="filter-btn ${currentFilter === 'completed' ? 'active' : ''}" 
                        onclick="loadBookingHistory('${phone}', 'completed')">
                    <i class="fas fa-check-double"></i> Selesai
                </button>
                <button class="filter-btn ${currentFilter === 'cancelled' ? 'active' : ''}" 
                        onclick="loadBookingHistory('${phone}', 'cancelled')">
                    <i class="fas fa-times-circle"></i> Dibatalkan
                </button>
            </div>
            
            <div class="booking-history-list">
                ${bookings.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <h3>Tidak Ada Booking</h3>
                        <p>Tidak ada riwayat booking untuk nomor telepon ini</p>
                        <button class="cta-button" onclick="modalManager.closeAll(); showQuickBooking()">
                            <i class="fas fa-plus"></i> Buat Booking Baru
                        </button>
                    </div>
                ` : bookings.map(booking => {
                    const appointmentDate = new Date(booking.appointment_datetime);
                    const formattedDate = appointmentDate.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    });
                    
                    const statusMap = {
                        'pending': { text: 'Menunggu', class: 'status-pending', icon: 'clock' },
                        'confirmed': { text: 'Dikonfirmasi', class: 'status-confirmed', icon: 'check-circle' },
                        'completed': { text: 'Selesai', class: 'status-completed', icon: 'check-double' },
                        'cancelled': { text: 'Dibatalkan', class: 'status-cancelled', icon: 'times-circle' }
                    };
                    
                    const status = statusMap[booking.status] || statusMap['pending'];
                    
                    return `
                        <div class="booking-history-item">
                            <div class="booking-header">
                                <div class="booking-id">${booking.id}</div>
                                <span class="status-badge ${status.class}">
                                    <i class="fas fa-${status.icon}"></i> ${status.text}
                                </span>
                            </div>
                            <div class="booking-info">
                                <div class="info-row">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span>${formattedDate} • ${booking.appointment_time}</span>
                                </div>
                                <div class="info-row">
                                    <i class="fas fa-concierge-bell"></i>
                                    <span>${booking.booking_services?.[0]?.service_name || 'N/A'}</span>
                                </div>
                            </div>
                            <div class="booking-actions">
                                <button class="cta-button secondary btn-sm" onclick="checkBookingStatus('${booking.id}')">
                                    <i class="fas fa-eye"></i> Detail
                                </button>
                                ${booking.status === 'pending' || booking.status === 'confirmed' ? `
                                <button class="cta-button btn-sm" onclick="showRescheduleModal('${booking.id}', '${phone}')">
                                    <i class="fas fa-calendar-alt"></i> Reschedule
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="form-actions" style="margin-top: 2rem;">
                <button type="button" class="cta-button secondary" onclick="showBookingHistoryModal()">
                    <i class="fas fa-arrow-left"></i> Cari Nomor Lain
                </button>
                <button type="button" class="cta-button" onclick="modalManager.closeAll(); showQuickBooking()">
                    <i class="fas fa-plus"></i> Booking Baru
                </button>
            </div>
        </div>
    `;
    
    const modalContent = document.getElementById('bookingHistoryContent');
    if (modalContent) {
        modalContent.innerHTML = content;
    }
}

// ===== RESCHEDULE BOOKING =====
function showRescheduleModal(bookingId, phone) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
    
    const timeOptions = generateTimeOptions();
    
    const content = `
        <div class="booking-form-modal">
            <div class="booking-header">
                <h2><i class="fas fa-calendar-alt me-2"></i>Reschedule Booking</h2>
                <p class="form-description">Nomor Booking: <strong>${bookingId}</strong></p>
                <p class="form-description">Pilih tanggal dan jam baru untuk perawatan Anda</p>
            </div>
            
            <form id="rescheduleForm" class="booking-form">
                <input type="hidden" id="rescheduleBookingId" value="${bookingId}">
                <input type="hidden" id="reschedulePhone" value="${phone}">
                
                <div class="form-group">
                    <label for="rescheduleDate">Tanggal Baru *</label>
                    <input type="date" id="rescheduleDate" name="rescheduleDate" 
                           min="${today}" value="${tomorrowFormatted}" required>
                    <small class="form-hint">Pilih tanggal mulai hari ini</small>
                </div>
                
                <div class="form-group">
                    <label for="rescheduleTime">Jam Baru *</label>
                    <select id="rescheduleTime" name="rescheduleTime" required>
                        <option value="">Pilih Jam</option>
                        ${timeOptions}
                    </select>
                    <small class="form-hint">Jam praktik: 08:00 - 17:00</small>
                </div>
                
                <div class="alert alert-info" style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #e3f2fd; border-left: 4px solid #2196f3;">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Catatan:</strong> Setelah reschedule, status booking akan kembali menjadi "Menunggu Konfirmasi". 
                    Tim kami akan menghubungi Anda untuk konfirmasi jadwal baru.
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cta-button secondary" onclick="checkBookingStatus('${bookingId}')">
                        <i class="fas fa-arrow-left"></i> Kembali
                    </button>
                    <button type="submit" class="cta-button">
                        <i class="fas fa-save"></i> Simpan Jadwal Baru
                    </button>
                </div>
            </form>
        </div>
    `;
    
    const modalContent = document.getElementById('checkBookingContent');
    if (modalContent) {
        modalContent.innerHTML = content;
        modalManager.openModal('checkBookingModal');
        
        // Setup form submission
        const form = document.getElementById('rescheduleForm');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                await submitReschedule();
            });
        }
    }
}

async function submitReschedule() {
    try {
        const bookingId = document.getElementById('rescheduleBookingId').value;
        const phone = document.getElementById('reschedulePhone').value;
        const date = document.getElementById('rescheduleDate').value;
        const time = document.getElementById('rescheduleTime').value;
        
        if (!date || !time) {
            showNotification('Harap pilih tanggal dan jam', 'error');
            return;
        }
        
        showNotification('⏳ Menyimpan jadwal baru...', 'info');
        
        const response = await apiCall(API_CONFIG.ENDPOINTS.BOOKING_RESCHEDULE(bookingId), {
            method: 'PUT',
            body: JSON.stringify({
                appointment_date: date,
                appointment_time: time,
                patient_phone: phone
            })
        });
        
        if (response.success) {
            showNotification('✅ Jadwal berhasil diubah! Tim kami akan menghubungi Anda untuk konfirmasi.', 'success');
            setTimeout(() => {
                checkBookingStatus(bookingId);
            }, 1500);
        } else {
            throw new Error(response.message || 'Gagal reschedule booking');
        }
        
    } catch (error) {
        console.error('Error rescheduling:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

// ===== DOWNLOAD BOOKING PDF =====
function downloadBookingPDF(bookingId) {
    showNotification('⏳ Mempersiapkan bukti booking...', 'info');
    
    // Open print dialog for the booking
    // In a real implementation, this would generate a proper PDF
    // For now, we'll use the browser's print functionality
    
    setTimeout(async () => {
        try {
            const response = await apiCall(API_CONFIG.ENDPOINTS.BOOKING_CHECK(bookingId));
            
            if (response.success && response.data) {
                const booking = response.data;
                printBookingReceipt(booking);
            } else {
                throw new Error('Gagal memuat data booking');
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
            showNotification('❌ ' + error.message, 'error');
        }
    }, 500);
}

function printBookingReceipt(booking) {
    const appointmentDate = new Date(booking.appointment_datetime);
    const formattedDate = appointmentDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const servicesHTML = booking.booking_services ? booking.booking_services.map(service => `
        <div style="background: #f9f9f9; padding: 12px; margin: 8px 0; border-radius: 8px; border-left: 4px solid #3498db;">
            <div style="font-weight: bold; font-size: 14px;">${service.service_name}</div>
            <div style="color: #666; font-size: 13px;">${service.service_price}</div>
        </div>
    `).join('') : '';
    
    const statusMap = {
        'pending': 'Menunggu Konfirmasi',
        'confirmed': 'Dikonfirmasi',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan'
    };
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showNotification('Tidak dapat membuka jendela print. Pastikan pop-up diizinkan.', 'error');
        return;
    }
    
    const printContent = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Bukti Booking - ${booking.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.6; color: #333; }
                    .header { text-align: center; border-bottom: 4px solid #3498db; padding-bottom: 20px; margin-bottom: 30px; }
                    .details { margin: 30px 0; }
                    .detail-item { margin: 15px 0; padding: 12px 0; border-bottom: 2px solid #eee; display: flex; justify-content: space-between; font-size: 14px; }
                    .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; padding-top: 20px; border-top: 2px solid #ddd; }
                    .status { background: #fff3e0; color: #f39c12; padding: 6px 15px; border-radius: 25px; font-weight: bold; font-size: 12px; border: 2px solid #f39c12; display: inline-block; }
                    .qr-code { text-align: center; margin: 20px 0; }
                    @media print { 
                        body { margin: 20px; }
                        .header { border-bottom-color: #000; }
                        .footer { page-break-inside: avoid; }
                    }
                    @page { margin: 1cm; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 style="margin: 0; color: #3498db; font-size: 28px;">Alra Care</h1>
                    <h2 style="margin: 10px 0; color: #333; font-size: 22px;">Bukti Booking</h2>
                    <p style="margin: 0; color: #666; font-size: 16px;">Kesehatan & Kecantikan Profesional</p>
                </div>
                
                <div class="qr-code">
                    <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Scan untuk cek status booking</p>
                    <div style="display: inline-block; padding: 20px; border: 2px solid #ddd; border-radius: 10px;">
                        <div style="font-size: 48px; font-weight: bold; color: #3498db;">${booking.id}</div>
                    </div>
                </div>
                
                <div class="details">
                    <div class="detail-item"><strong>Nomor Booking:</strong> <span>${booking.id}</span></div>
                    <div class="detail-item"><strong>Status:</strong> <span class="status">${statusMap[booking.status] || 'Menunggu'}</span></div>
                    <div class="detail-item"><strong>Nama Pasien:</strong> <span>${booking.patient_name}</span></div>
                    <div class="detail-item"><strong>Telepon:</strong> <span>${booking.patient_phone}</span></div>
                    <div class="detail-item"><strong>Alamat:</strong> <span>${booking.patient_address}</span></div>
                    <div class="detail-item"><strong>Tanggal Perawatan:</strong> <span>${formattedDate}</span></div>
                    <div class="detail-item"><strong>Jam Perawatan:</strong> <span>${booking.appointment_time}</span></div>
                    <div class="detail-item" style="border-bottom: none;">
                        <strong>Layanan:</strong>
                    </div>
                    ${servicesHTML}
                    ${booking.patient_notes && booking.patient_notes !== 'Tidak ada catatan' ? `
                    <div class="detail-item"><strong>Catatan:</strong> <span>${booking.patient_notes}</span></div>
                    ` : ''}
                    <div class="detail-item"><strong>Tanggal Booking:</strong> <span>${new Date(booking.created_at).toLocaleString('id-ID')}</span></div>
                </div>
                
                <div class="footer">
                    <p style="font-weight: bold; font-size: 14px;">⚠️ PENTING</p>
                    <p>✓ Harap datang 15 menit sebelum jadwal perawatan</p>
                    <p>✓ Bawa bukti booking ini saat datang ke klinik</p>
                    <p>✓ Untuk reschedule atau pembatalan, hubungi kami minimal 24 jam sebelumnya</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-weight: bold;">Terima kasih atas kepercayaan Anda kepada Alra Care</p>
                    <p>📍 Jl. Akcaya, Pontianak • 📞 0813-8122-3811</p>
                    <p>🌐 www.alracare.com • ✉️ rahmadramadhanaswin@gmail.com</p>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    };
                </script>
            </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    showNotification('✅ Bukti booking siap dicetak!', 'success');
}

// ===== HELPER FUNCTIONS =====
function generateTimeOptions() {
    let options = '';
    for (let hour = 8; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            if (hour === 17 && minute > 0) break;
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            options += `<option value="${time}">${time}</option>`;
        }
    }
    return options;
}

// Export functions for global access
window.showCheckBookingModal = showCheckBookingModal;
window.checkBookingStatus = checkBookingStatus;
window.showBookingHistoryModal = showBookingHistoryModal;
window.loadBookingHistory = loadBookingHistory;
window.showRescheduleModal = showRescheduleModal;
window.downloadBookingPDF = downloadBookingPDF;

console.log('✅ Phase 2 features loaded: Check Booking, Booking History, Reschedule, Download PDF');