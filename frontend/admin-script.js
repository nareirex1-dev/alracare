// ===== GLOBAL VARIABLES =====
let bookings = [];
let services = {};
let gallery = [];
let settings = {};
let editingServiceId = null;
let editingOptionData = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Alra Care Admin Panel initialized');
    
    // Load data from API
    loadData();
    
    // Setup navigation
    setupNavigation();
    
    // Setup form submissions
    setupForms();
    
    // Display initial data
    displayDashboardData();
    displayAllBookings();
    displayServiceCategories();
    displayServiceOptions();
    displayGallery();
    
    // Load settings into forms
    loadSettingsIntoForms();
});

// ===== DATA MANAGEMENT WITH API =====
async function loadData() {
    try {
        // Load bookings from API
        const bookingsResponse = await apiCall(API_CONFIG.ENDPOINTS.BOOKINGS);
        if (bookingsResponse.success) {
            bookings = bookingsResponse.data.map(booking => ({
                bookingId: booking.id,
                patientInfo: {
                    name: booking.patient_name,
                    phone: booking.patient_phone,
                    address: booking.patient_address,
                    notes: booking.patient_notes
                },
                appointmentInfo: {
                    date: booking.appointment_date,
                    time: booking.appointment_time,
                    datetime: booking.appointment_datetime
                },
                serviceInfo: {
                    serviceName: booking.booking_services?.[0]?.service_name || 'N/A',
                    selectedOptions: booking.booking_services || []
                },
                status: booking.status,
                bookingDate: booking.created_at,
                lastUpdated: booking.updated_at
            }));
        }
        
        // Load services from API
        const servicesResponse = await apiCall(API_CONFIG.ENDPOINTS.SERVICES);
        if (servicesResponse.success) {
            services = servicesResponse.data;
        }
        
        // Load gallery from API
        const galleryResponse = await apiCall(API_CONFIG.ENDPOINTS.GALLERY);
        if (galleryResponse.success) {
            gallery = galleryResponse.data;
        }
        
        // Load settings from API
        const settingsResponse = await apiCall(API_CONFIG.ENDPOINTS.SETTINGS);
        if (settingsResponse.success) {
            settings = settingsResponse.data;
        }
        
        console.log('Data loaded successfully from API');
    } catch (error) {
        console.error('Error loading data from API:', error);
        showNotification('⚠️ Gagal memuat data dari server', 'error');
    }
}

async function saveBooking(bookingData) {
    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.BOOKINGS, {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
        
        if (response.success) {
            await loadData();
            return response.data;
        }
        throw new Error(response.message || 'Gagal menyimpan booking');
    } catch (error) {
        console.error('Error saving booking:', error);
        throw error;
    }
}

async function updateBookingStatusAPI(bookingId, newStatus) {
    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.BOOKING_STATUS(bookingId), {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.success) {
            await loadData();
            return response.data;
        }
        throw new Error(response.message || 'Gagal update status');
    } catch (error) {
        console.error('Error updating booking status:', error);
        throw error;
    }
}

async function deleteBookingAPI(bookingId) {
    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.BOOKING_BY_ID(bookingId), {
            method: 'DELETE'
        });
        
        if (response.success) {
            await loadData();
            return true;
        }
        throw new Error(response.message || 'Gagal menghapus booking');
    } catch (error) {
        console.error('Error deleting booking:', error);
        throw error;
    }
}

async function saveServiceCategory(categoryData) {
    try {
        // For creating new category, we need to use service_categories endpoint
        const response = await apiCall(API_CONFIG.ENDPOINTS.SERVICES, {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
        
        if (response.success) {
            await loadData();
            return response.data;
        }
        throw new Error(response.message || 'Gagal menyimpan kategori');
    } catch (error) {
        console.error('Error saving service category:', error);
        throw error;
    }
}

async function saveServiceOption(optionData) {
    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.SERVICES, {
            method: 'POST',
            body: JSON.stringify(optionData)
        });
        
        if (response.success) {
            await loadData();
            return response.data;
        }
        throw new Error(response.message || 'Gagal menyimpan layanan');
    } catch (error) {
        console.error('Error saving service option:', error);
        throw error;
    }
}

async function updateServiceOption(serviceId, optionData) {
    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.SERVICE_BY_ID(serviceId), {
            method: 'PUT',
            body: JSON.stringify(optionData)
        });
        
        if (response.success) {
            await loadData();
            return response.data;
        }
        throw new Error(response.message || 'Gagal mengupdate layanan');
    } catch (error) {
        console.error('Error updating service option:', error);
        throw error;
    }
}

async function deleteServiceAPI(serviceId) {
    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.SERVICE_BY_ID(serviceId), {
            method: 'DELETE'
        });
        
        if (response.success) {
            await loadData();
            return true;
        }
        throw new Error(response.message || 'Gagal menghapus layanan');
    } catch (error) {
        console.error('Error deleting service:', error);
        throw error;
    }
}

async function saveGalleryImage(imageData) {
    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.GALLERY, {
            method: 'POST',
            body: JSON.stringify(imageData)
        });
        
        if (response.success) {
            await loadData();
            return response.data;
        }
        throw new Error(response.message || 'Gagal menyimpan gambar');
    } catch (error) {
        console.error('Error saving gallery image:', error);
        throw error;
    }
}

async function deleteGalleryImageAPI(imageId) {
    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.GALLERY_BY_ID(imageId), {
            method: 'DELETE'
        });
        
        if (response.success) {
            await loadData();
            return true;
        }
        throw new Error(response.message || 'Gagal menghapus gambar');
    } catch (error) {
        console.error('Error deleting gallery image:', error);
        throw error;
    }
}

async function saveSettings(settingsData) {
    try {
        // Transform settings data to match API format
        const settingsToUpdate = {};
        
        if (settingsData.general) {
            settingsToUpdate['clinic_name'] = settingsData.general.clinicName;
            settingsToUpdate['clinic_address'] = settingsData.general.clinicAddress;
            settingsToUpdate['clinic_phone'] = settingsData.general.clinicPhone;
            settingsToUpdate['clinic_email'] = settingsData.general.clinicEmail;
            settingsToUpdate['business_hours'] = settingsData.general.businessHours;
        }
        
        if (settingsData.social) {
            settingsToUpdate['social_instagram'] = JSON.stringify(settingsData.social.instagram);
            settingsToUpdate['social_facebook'] = JSON.stringify(settingsData.social.facebook);
            settingsToUpdate['social_youtube'] = JSON.stringify(settingsData.social.youtube);
            settingsToUpdate['social_tiktok'] = JSON.stringify(settingsData.social.tiktok);
        }
        
        const response = await apiCall(API_CONFIG.ENDPOINTS.SETTINGS, {
            method: 'PUT',
            body: JSON.stringify({ settings: settingsToUpdate })
        });
        
        if (response.success) {
            await loadData();
            return response.data;
        }
        throw new Error(response.message || 'Gagal menyimpan pengaturan');
    } catch (error) {
        console.error('Error saving settings:', error);
        throw error;
    }
}

// ===== NAVIGATION =====
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            // Show selected page
            const pageId = this.getAttribute('data-page');
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
                
                // Refresh data for specific pages
                if (pageId === 'dashboard') {
                    displayDashboardData();
                } else if (pageId === 'bookings') {
                    displayAllBookings();
                } else if (pageId === 'services') {
                    displayServiceCategories();
                    displayServiceOptions();
                } else if (pageId === 'gallery') {
                    displayGallery();
                }
            }
        });
    });
}

// ===== DASHBOARD FUNCTIONS =====
function displayDashboardData() {
    try {
        // Calculate dashboard statistics
        const totalBookings = bookings.length;
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookings.filter(booking => 
            booking.appointmentInfo && booking.appointmentInfo.date === today
        ).length;
        
        // Calculate monthly revenue
        const monthlyRevenue = bookings.reduce((total, booking) => {
            let price = 0;
            if (booking.serviceInfo && booking.serviceInfo.selectedOptions) {
                booking.serviceInfo.selectedOptions.forEach(option => {
                    if (option.price || option.service_price) {
                        const priceStr = option.price || option.service_price;
                        const priceMatch = priceStr.match(/(\d+\.?\d*)/g);
                        if (priceMatch) {
                            price += parseInt(priceMatch[0].replace(/\./g, '')) || 0;
                        }
                    }
                });
            }
            return total + price;
        }, 0);
        
        // Count available services
        let serviceCount = 0;
        Object.keys(services).forEach(category => {
            if (services[category] && services[category].options) {
                serviceCount += services[category].options.length;
            }
        });
        
        // Update dashboard cards
        const totalBookingsEl = document.getElementById('totalBookings');
        const todayBookingsEl = document.getElementById('todayBookings');
        const monthlyRevenueEl = document.getElementById('monthlyRevenue');
        const availableServicesEl = document.getElementById('availableServices');
        
        if (totalBookingsEl) totalBookingsEl.textContent = totalBookings;
        if (todayBookingsEl) todayBookingsEl.textContent = todayBookings;
        if (monthlyRevenueEl) monthlyRevenueEl.textContent = 'Rp ' + monthlyRevenue.toLocaleString('id-ID');
        if (availableServicesEl) availableServicesEl.textContent = serviceCount;
        
        // Display recent bookings
        displayRecentBookings();
    } catch (error) {
        console.error('Error displaying dashboard data:', error);
    }
}

function displayRecentBookings() {
    const tableBody = document.querySelector('#recentBookingsTable tbody');
    if (!tableBody) return;
    
    const recentBookings = bookings.slice(-5).reverse();
    
    if (recentBookings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-calendar-times fa-2x text-muted mb-2"></i>
                    <p class="text-muted">Tidak ada booking terbaru</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = recentBookings.map(booking => {
        if (!booking.appointmentInfo) return '';
        
        const appointmentDate = new Date(booking.appointmentInfo.datetime);
        const formattedDate = appointmentDate.toLocaleDateString('id-ID');
        
        return `
            <tr>
                <td>${booking.bookingId || 'N/A'}</td>
                <td>${booking.patientInfo?.name || 'N/A'}</td>
                <td>${booking.serviceInfo?.serviceName || 'N/A'}</td>
                <td>${formattedDate}</td>
                <td>
                    <span class="status-badge status-${booking.status || 'pending'}">
                        ${getStatusText(booking.status)}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewBooking('${booking.bookingId}')" title="Lihat Detail">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="updateBookingStatus('${booking.bookingId}', 'confirmed')" title="Konfirmasi" ${booking.status === 'confirmed' ? 'disabled' : ''}>
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== BOOKING MANAGEMENT =====
function displayAllBookings() {
    const tableBody = document.querySelector('#allBookingsTable tbody');
    if (!tableBody) return;
    
    if (bookings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-calendar-times fa-2x text-muted mb-2"></i>
                    <p class="text-muted">Tidak ada booking</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort bookings by date (newest first)
    const sortedBookings = [...bookings].sort((a, b) => 
        new Date(b.bookingDate || 0) - new Date(a.bookingDate || 0)
    );
    
    tableBody.innerHTML = sortedBookings.map(booking => {
        if (!booking.appointmentInfo) return '';
        
        const appointmentDate = new Date(booking.appointmentInfo.datetime);
        const formattedDate = appointmentDate.toLocaleDateString('id-ID');
        const formattedTime = booking.appointmentInfo.time || 'N/A';
        
        return `
            <tr>
                <td>${booking.bookingId || 'N/A'}</td>
                <td>${booking.patientInfo?.name || 'N/A'}</td>
                <td>${booking.patientInfo?.phone || 'N/A'}</td>
                <td>${booking.serviceInfo?.serviceName || 'N/A'}</td>
                <td>${formattedDate} ${formattedTime}</td>
                <td>
                    <span class="status-badge status-${booking.status || 'pending'}">
                        ${getStatusText(booking.status)}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewBooking('${booking.bookingId}')" title="Lihat Detail">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="updateBookingStatus('${booking.bookingId}', 'confirmed')" title="Konfirmasi" ${booking.status === 'confirmed' ? 'disabled' : ''}>
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="updateBookingStatus('${booking.bookingId}', 'pending')" title="Tunda" ${booking.status === 'pending' ? 'disabled' : ''}>
                            <i class="fas fa-clock"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="updateBookingStatus('${booking.bookingId}', 'cancelled')" title="Batalkan" ${booking.status === 'cancelled' ? 'disabled' : ''}>
                            <i class="fas fa-times"></i>
                        </button>
                        <button class="btn btn-outline-secondary" onclick="deleteBooking('${booking.bookingId}')" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function viewBooking(bookingId) {
    const booking = bookings.find(b => b.bookingId === bookingId);
    if (!booking) {
        showNotification('Booking tidak ditemukan', 'error');
        return;
    }
    
    const appointmentDate = new Date(booking.appointmentInfo.datetime);
    const formattedDate = appointmentDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const servicesHTML = booking.serviceInfo?.selectedOptions ? 
        booking.serviceInfo.selectedOptions.map(option => `
            <div class="bg-light p-3 mb-2 rounded border-start border-4 border-primary">
                <div class="fw-bold small">${option.name || option.service_name || 'N/A'}</div>
                <div class="text-muted small">${option.price || option.service_price || 'N/A'}</div>
            </div>
        `).join('') : '';
    
    const content = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">ID Booking</label>
                <div class="form-control bg-light">${booking.bookingId || 'N/A'}</div>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">Status</label>
                <div class="form-control bg-light">
                    <span class="status-badge status-${booking.status || 'pending'}">
                        ${getStatusText(booking.status)}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">Nama Pasien</label>
                <div class="form-control bg-light">${booking.patientInfo?.name || 'N/A'}</div>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">Telepon</label>
                <div class="form-control bg-light">${booking.patientInfo?.phone || 'N/A'}</div>
            </div>
        </div>
        
        <div class="mb-3">
            <label class="form-label fw-bold">Alamat</label>
            <div class="form-control bg-light" style="min-height: 80px;">${booking.patientInfo?.address || 'N/A'}</div>
        </div>
        
        <div class="mb-3">
            <label class="form-label fw-bold">Layanan</label>
            <div class="form-control bg-light">${booking.serviceInfo?.serviceName || 'N/A'}</div>
        </div>
        
        ${servicesHTML ? `
        <div class="mb-3">
            <label class="form-label fw-bold">Detail Layanan</label>
            ${servicesHTML}
        </div>
        ` : ''}
        
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">Tanggal Perawatan</label>
                <div class="form-control bg-light">${formattedDate}</div>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">Jam Perawatan</label>
                <div class="form-control bg-light">${booking.appointmentInfo?.time || 'N/A'}</div>
            </div>
        </div>
        
        <div class="mb-3">
            <label class="form-label fw-bold">Catatan</label>
            <div class="form-control bg-light" style="min-height: 80px;">${booking.patientInfo?.notes || 'Tidak ada catatan'}</div>
        </div>
        
        <div class="mb-3">
            <label class="form-label fw-bold">Tanggal Booking</label>
            <div class="form-control bg-light">${new Date(booking.bookingDate).toLocaleString('id-ID')}</div>
        </div>
        
        <div class="d-flex gap-2 justify-content-end mt-4">
            <button type="button" class="btn btn-primary" onclick="printBookingDetails('${booking.bookingId}')">
                <i class="fas fa-print me-1"></i> Cetak
            </button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                <i class="fas fa-times me-1"></i> Tutup
            </button>
        </div>
    `;
    
    // Create a temporary modal for viewing booking details
    const modalHTML = `
        <div class="modal fade" id="bookingDetailModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detail Booking</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('bookingDetailModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('bookingDetailModal'));
    modal.show();
}

async function updateBookingStatus(bookingId, newStatus) {
    try {
        await updateBookingStatusAPI(bookingId, newStatus);
        
        displayAllBookings();
        displayRecentBookings();
        displayDashboardData();
        
        showNotification(`Status booking berhasil diubah menjadi ${getStatusText(newStatus)}`, 'success');
    } catch (error) {
        showNotification('Gagal mengubah status booking: ' + error.message, 'error');
    }
}

async function deleteBooking(bookingId) {
    if (!confirm('Apakah Anda yakin ingin menghapus booking ini?')) {
        return;
    }
    
    try {
        await deleteBookingAPI(bookingId);
        
        displayAllBookings();
        displayRecentBookings();
        displayDashboardData();
        
        showNotification('Booking berhasil dihapus', 'success');
    } catch (error) {
        showNotification('Gagal menghapus booking: ' + error.message, 'error');
    }
}

function showAddBookingModal() {
    // Populate service options
    const serviceSelect = document.getElementById('newService');
    if (serviceSelect) {
        serviceSelect.innerHTML = '<option value="">Pilih Layanan</option>';
        
        Object.keys(services).forEach(serviceId => {
            const service = services[serviceId];
            if (service && service.title) {
                serviceSelect.innerHTML += `<option value="${serviceId}">${service.title}</option>`;
            }
        });
    }
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('newAppointmentDate');
    if (dateInput) {
        dateInput.value = tomorrow.toISOString().split('T')[0];
        dateInput.min = new Date().toISOString().split('T')[0]; // Set min date to today
    }
    
    // Populate time options
    const timeSelect = document.getElementById('newAppointmentTime');
    if (timeSelect) {
        timeSelect.innerHTML = '<option value="">Pilih Jam</option>';
        
        for (let hour = 8; hour <= 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === 17 && minute > 0) break;
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                timeSelect.innerHTML += `<option value="${time}">${time}</option>`;
            }
        }
    }
    
    const modal = new bootstrap.Modal(document.getElementById('addBookingModal'));
    modal.show();
}

// ===== SERVICE MANAGEMENT =====
function displayServiceCategories() {
    const tableBody = document.querySelector('#serviceCategoriesTable tbody');
    if (!tableBody) return;
    
    const serviceIds = Object.keys(services);
    
    if (serviceIds.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <i class="fas fa-concierge-bell fa-2x text-muted mb-2"></i>
                    <p class="text-muted">Tidak ada kategori layanan</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = serviceIds.map(serviceId => {
        const service = services[serviceId];
        const optionCount = service && service.options ? service.options.length : 0;
        
        return `
            <tr>
                <td>${serviceId}</td>
                <td>${service?.title || 'N/A'}</td>
                <td>${optionCount} layanan</td>
                <td>
                    <span class="status-badge status-confirmed">Aktif</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editService('${serviceId}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteService('${serviceId}')" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function displayServiceOptions() {
    const grid = document.getElementById('serviceOptionsGrid');
    if (!grid) return;
    
    let allOptions = [];
    
    // Collect all service options from all categories
    Object.keys(services).forEach(serviceId => {
        const service = services[serviceId];
        if (service && service.options) {
            service.options.forEach(option => {
                allOptions.push({
                    ...option,
                    category: service.title,
                    categoryId: serviceId
                });
            });
        }
    });
    
    if (allOptions.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-4">
                <i class="fas fa-concierge-bell fa-2x text-muted mb-2"></i>
                <p class="text-muted">Tidak ada layanan</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = allOptions.map(option => {
        return `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="service-option-card">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${option.name || 'N/A'}</h6>
                            <p class="text-muted small mb-1">${option.category || 'N/A'}</p>
                            <p class="fw-bold text-primary mb-0">${option.price || 'N/A'}</p>
                        </div>
                        <img src="${option.image || ''}" alt="${option.name || 'Service Image'}" 
                             class="service-option-image ms-3"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjhmOGY4IiByeD0iOCIvPgo8dGV4dCB4PSI0MCIgeT0iNDIiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1nPC90ZXh0Pgo8L3N2Zz4K'">
                    </div>
                    <div class="d-flex gap-1">
                        <button class="btn btn-outline-primary btn-sm flex-fill" onclick="editServiceOption('${option.categoryId}', '${option.id}')" title="Edit">
                            <i class="fas fa-edit me-1"></i> Edit
                        </button>
                        <button class="btn btn-outline-danger btn-sm flex-fill" onclick="deleteServiceOption('${option.categoryId}', '${option.id}')" title="Hapus">
                            <i class="fas fa-trash me-1"></i> Hapus
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showAddServiceModal() {
    const modal = new bootstrap.Modal(document.getElementById('addServiceModal'));
    modal.show();
}

function showAddServiceOptionModal() {
    // Clear editing state
    editingOptionData = null;
    
    // Populate service categories
    const serviceSelect = document.getElementById('newOptionService');
    if (serviceSelect) {
        serviceSelect.innerHTML = '<option value="">Pilih Kategori</option>';
        
        Object.keys(services).forEach(serviceId => {
            const service = services[serviceId];
            if (service && service.title) {
                serviceSelect.innerHTML += `<option value="${serviceId}">${service.title}</option>`;
            }
        });
    }
    
    // Clear form fields
    document.getElementById('newOptionId').value = '';
    document.getElementById('newOptionName').value = '';
    document.getElementById('newOptionPrice').value = '';
    document.getElementById('newOptionImage').value = '';
    
    // Change modal title
    const modalTitle = document.querySelector('#addServiceOptionModal .modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Tambah Layanan';
    }
    
    const modal = new bootstrap.Modal(document.getElementById('addServiceOptionModal'));
    modal.show();
}

// ===== GALLERY MANAGEMENT =====
function displayGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    
    if (gallery.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-4">
                <i class="fas fa-images fa-2x text-muted mb-2"></i>
                <p class="text-muted">Tidak ada gambar di galeri</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = gallery.map((item) => {
        return `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="gallery-item">
                    <img src="${item.url || item.image_url || ''}" alt="${item.title || 'Gallery Image'}" 
                         class="img-fluid rounded">
                    <div class="mt-2">
                        <h6 class="mb-1">${item.title || 'Tanpa Judul'}</h6>
                        <p class="text-muted small mb-2">${item.description || 'Tidak ada deskripsi'}</p>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteGalleryImage('${item.id}')" title="Hapus Gambar">
                            <i class="fas fa-trash me-1"></i> Hapus
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showAddGalleryModal() {
    const modal = new bootstrap.Modal(document.getElementById('addGalleryModal'));
    modal.show();
}

async function deleteGalleryImage(imageId) {
    if (!confirm('Apakah Anda yakin ingin menghapus gambar ini dari galeri?')) {
        return;
    }
    
    try {
        await deleteGalleryImageAPI(imageId);
        displayGallery();
        showNotification('Gambar berhasil dihapus dari galeri', 'success');
    } catch (error) {
        showNotification('Gagal menghapus gambar: ' + error.message, 'error');
    }
}

// ===== EDIT SERVICE FUNCTIONS (FIXED) =====
function editService(serviceId) {
    const service = services[serviceId];
    if (!service) {
        showNotification('Layanan tidak ditemukan', 'error');
        return;
    }
    
    // Populate form with existing data
    document.getElementById('newServiceId').value = serviceId;
    document.getElementById('newServiceId').disabled = true; // Prevent changing ID
    document.getElementById('newServiceTitle').value = service.title || '';
    document.getElementById('newServiceDescription').value = service.description || '';
    
    // Change modal title and button text
    const modalTitle = document.querySelector('#addServiceModal .modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Edit Kategori Layanan';
    }
    
    const submitBtn = document.querySelector('#addServiceForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save me-1"></i> Update Kategori';
    }
    
    // Store editing state
    editingServiceId = serviceId;
    
    const modal = new bootstrap.Modal(document.getElementById('addServiceModal'));
    modal.show();
}

function editServiceOption(categoryId, optionId) {
    const service = services[categoryId];
    if (!service || !service.options) {
        showNotification('Layanan tidak ditemukan', 'error');
        return;
    }
    
    const option = service.options.find(opt => opt.id === optionId);
    if (!option) {
        showNotification('Opsi layanan tidak ditemukan', 'error');
        return;
    }
    
    // Populate form with existing data
    document.getElementById('newOptionService').value = categoryId;
    document.getElementById('newOptionId').value = optionId;
    document.getElementById('newOptionId').disabled = true; // Prevent changing ID
    document.getElementById('newOptionName').value = option.name || '';
    document.getElementById('newOptionPrice').value = option.price || '';
    document.getElementById('newOptionImage').value = option.image || '';
    
    // Change modal title and button text
    const modalTitle = document.querySelector('#addServiceOptionModal .modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Edit Layanan';
    }
    
    const submitBtn = document.querySelector('#addServiceOptionForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save me-1"></i> Update Layanan';
    }
    
    // Store editing state
    editingOptionData = {
        categoryId: categoryId,
        optionId: optionId
    };
    
    const modal = new bootstrap.Modal(document.getElementById('addServiceOptionModal'));
    modal.show();
}

async function deleteService(serviceId) {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori layanan ini? Semua layanan dalam kategori ini juga akan dihapus.')) {
        return;
    }
    
    try {
        await deleteServiceAPI(serviceId);
        displayServiceCategories();
        displayServiceOptions();
        displayDashboardData();
        
        showNotification('Kategori layanan berhasil dihapus', 'success');
    } catch (error) {
        showNotification('Gagal menghapus layanan: ' + error.message, 'error');
    }
}

async function deleteServiceOption(categoryId, optionId) {
    if (!confirm('Apakah Anda yakin ingin menghapus layanan ini?')) {
        return;
    }
    
    try {
        await deleteServiceAPI(optionId);
        displayServiceOptions();
        displayServiceCategories();
        displayDashboardData();
        
        showNotification('Layanan berhasil dihapus', 'success');
    } catch (error) {
        showNotification('Gagal menghapus layanan: ' + error.message, 'error');
    }
}

// ===== FORM HANDLING =====
function setupForms() {
    // Add Booking Form
    const addBookingForm = document.getElementById('addBookingForm');
    if (addBookingForm) {
        addBookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const serviceId = document.getElementById('newService').value;
            const service = services[serviceId];
            
            if (!service) {
                showNotification('Pilih layanan yang valid', 'error');
                return;
            }
            
            const bookingData = {
                patient_name: document.getElementById('newPatientName').value,
                patient_phone: document.getElementById('newPatientPhone').value,
                patient_address: document.getElementById('newPatientAddress').value,
                patient_notes: document.getElementById('newPatientNotes').value || 'Tidak ada catatan',
                appointment_date: document.getElementById('newAppointmentDate').value,
                appointment_time: document.getElementById('newAppointmentTime').value,
                selected_services: [{
                    service_id: serviceId,
                    service_name: service.title,
                    service_price: 'Rp 0'
                }]
            };
            
            try {
                await saveBooking(bookingData);
                displayAllBookings();
                displayRecentBookings();
                displayDashboardData();
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('addBookingModal'));
                modal.hide();
                this.reset();
                
                showNotification('Booking berhasil ditambahkan', 'success');
            } catch (error) {
                showNotification('Gagal menambahkan booking: ' + error.message, 'error');
            }
        });
    }
    
    // Add/Edit Service Form
    const addServiceForm = document.getElementById('addServiceForm');
    if (addServiceForm) {
        addServiceForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const serviceId = document.getElementById('newServiceId').value.trim();
            const serviceTitle = document.getElementById('newServiceTitle').value.trim();
            const serviceDescription = document.getElementById('newServiceDescription').value.trim();
            
            if (!serviceId || !serviceTitle) {
                showNotification('ID dan nama kategori harus diisi', 'error');
                return;
            }
            
            // Check if editing or creating new
            if (editingServiceId) {
                // Update existing service category
                // Note: This would require an update endpoint for categories
                showNotification('Update kategori layanan belum didukung oleh API', 'warning');
                editingServiceId = null;
                document.getElementById('newServiceId').disabled = false;
                return;
            }
            
            if (services[serviceId]) {
                showNotification('ID layanan sudah ada', 'error');
                return;
            }
            
            const serviceData = {
                service_id: serviceId,
                title: serviceTitle,
                description: serviceDescription,
                type: "checkbox",
                options: []
            };
            
            try {
                await saveServiceCategory(serviceData);
                displayServiceCategories();
                displayServiceOptions();
                displayDashboardData();
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('addServiceModal'));
                modal.hide();
                this.reset();
                document.getElementById('newServiceId').disabled = false;
                editingServiceId = null;
                
                showNotification('Kategori layanan berhasil ditambahkan', 'success');
            } catch (error) {
                showNotification('Gagal menambahkan layanan: ' + error.message, 'error');
            }
        });
    }
    
    // Add/Edit Service Option Form
    const addServiceOptionForm = document.getElementById('addServiceOptionForm');
    if (addServiceOptionForm) {
        addServiceOptionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const serviceId = document.getElementById('newOptionService').value;
            const optionId = document.getElementById('newOptionId').value.trim();
            const optionName = document.getElementById('newOptionName').value.trim();
            const optionPrice = document.getElementById('newOptionPrice').value.trim();
            const optionImage = document.getElementById('newOptionImage').value.trim();
            
            if (!services[serviceId]) {
                showNotification('Kategori layanan tidak valid', 'error');
                return;
            }
            
            if (!optionId || !optionName || !optionPrice) {
                showNotification('ID, nama, dan harga layanan harus diisi', 'error');
                return;
            }
            
            // Check if editing or creating new
            if (editingOptionData) {
                // Update existing service option
                const updateData = {
                    name: optionName,
                    price: optionPrice,
                    image_url: optionImage
                };
                
                try {
                    await updateServiceOption(optionId, updateData);
                    displayServiceOptions();
                    displayDashboardData();
                    
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addServiceOptionModal'));
                    modal.hide();
                    this.reset();
                    document.getElementById('newOptionId').disabled = false;
                    editingOptionData = null;
                    
                    showNotification('Layanan berhasil diupdate', 'success');
                } catch (error) {
                    showNotification('Gagal mengupdate layanan: ' + error.message, 'error');
                }
                return;
            }
            
            // Check if option ID already exists in this service
            if (services[serviceId].options && services[serviceId].options.some(opt => opt.id === optionId)) {
                showNotification('ID layanan sudah ada dalam kategori ini', 'error');
                return;
            }
            
            const optionData = {
                category_id: serviceId,
                name: optionName,
                price: optionPrice,
                price_numeric: parseFloat(optionPrice.replace(/[^0-9]/g, '')),
                image_url: optionImage
            };
            
            try {
                await saveServiceOption(optionData);
                displayServiceOptions();
                displayDashboardData();
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('addServiceOptionModal'));
                modal.hide();
                this.reset();
                
                showNotification('Layanan berhasil ditambahkan', 'success');
            } catch (error) {
                showNotification('Gagal menambahkan layanan: ' + error.message, 'error');
            }
        });
    }
    
    // Add Gallery Form
    const addGalleryForm = document.getElementById('addGalleryForm');
    if (addGalleryForm) {
        addGalleryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const imageTitle = document.getElementById('newImageTitle').value.trim();
            const imageUrl = document.getElementById('newImageUrl').value.trim();
            const imageDescription = document.getElementById('newImageDescription').value.trim();
            
            if (!imageTitle || !imageUrl) {
                showNotification('Judul dan URL gambar harus diisi', 'error');
                return;
            }
            
            const imageData = {
                title: imageTitle,
                image_url: imageUrl,
                description: imageDescription
            };
            
            try {
                await saveGalleryImage(imageData);
                displayGallery();
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('addGalleryModal'));
                modal.hide();
                this.reset();
                
                showNotification('Gambar berhasil ditambahkan ke galeri', 'success');
            } catch (error) {
                showNotification('Gagal menambahkan gambar: ' + error.message, 'error');
            }
        });
    }
    
    // General Settings Form
    const generalSettingsForm = document.getElementById('generalSettingsForm');
    if (generalSettingsForm) {
        generalSettingsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const settingsData = {
                general: {
                    clinicName: document.getElementById('clinicName').value,
                    clinicAddress: document.getElementById('clinicAddress').value,
                    clinicPhone: document.getElementById('clinicPhone').value,
                    clinicEmail: document.getElementById('clinicEmail').value,
                    businessHours: document.getElementById('businessHours').value
                }
            };
            
            try {
                await saveSettings(settingsData);
                showNotification('Pengaturan umum berhasil disimpan', 'success');
            } catch (error) {
                showNotification('Gagal menyimpan pengaturan: ' + error.message, 'error');
            }
        });
    }
    
    // Social Settings Form
    const socialSettingsForm = document.getElementById('socialSettingsForm');
    if (socialSettingsForm) {
        socialSettingsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const settingsData = {
                social: {
                    instagram: document.getElementById('instagramAccounts').value.split(',').map(s => s.trim()).filter(s => s),
                    facebook: document.getElementById('facebookAccounts').value.split(',').map(s => s.trim()).filter(s => s),
                    youtube: document.getElementById('youtubeAccounts').value.split(',').map(s => s.trim()).filter(s => s),
                    tiktok: document.getElementById('tiktokAccounts').value.split(',').map(s => s.trim()).filter(s => s)
                }
            };
            
            try {
                await saveSettings(settingsData);
                showNotification('Pengaturan media sosial berhasil disimpan', 'success');
            } catch (error) {
                showNotification('Gagal menyimpan pengaturan: ' + error.message, 'error');
            }
        });
    }
}

function loadSettingsIntoForms() {
    // Load general settings
    if (settings.general) {
        const clinicName = document.getElementById('clinicName');
        const clinicAddress = document.getElementById('clinicAddress');
        const clinicPhone = document.getElementById('clinicPhone');
        const clinicEmail = document.getElementById('clinicEmail');
        const businessHours = document.getElementById('businessHours');
        
        if (clinicName && settings.general.clinic_name) clinicName.value = settings.general.clinic_name;
        if (clinicAddress && settings.general.clinic_address) clinicAddress.value = settings.general.clinic_address;
        if (clinicPhone && settings.general.clinic_phone) clinicPhone.value = settings.general.clinic_phone;
        if (clinicEmail && settings.general.clinic_email) clinicEmail.value = settings.general.clinic_email;
        if (businessHours && settings.general.business_hours) businessHours.value = settings.general.business_hours;
    }
    
    // Load social settings
    if (settings.social) {
        const instagramAccounts = document.getElementById('instagramAccounts');
        const facebookAccounts = document.getElementById('facebookAccounts');
        const youtubeAccounts = document.getElementById('youtubeAccounts');
        const tiktokAccounts = document.getElementById('tiktokAccounts');
        
        if (instagramAccounts && settings.social.social_instagram) {
            try {
                const accounts = JSON.parse(settings.social.social_instagram);
                instagramAccounts.value = accounts.join(', ');
            } catch (e) {
                instagramAccounts.value = settings.social.social_instagram;
            }
        }
        if (facebookAccounts && settings.social.social_facebook) {
            try {
                const accounts = JSON.parse(settings.social.social_facebook);
                facebookAccounts.value = accounts.join(', ');
            } catch (e) {
                facebookAccounts.value = settings.social.social_facebook;
            }
        }
        if (youtubeAccounts && settings.social.social_youtube) {
            try {
                const accounts = JSON.parse(settings.social.social_youtube);
                youtubeAccounts.value = accounts.join(', ');
            } catch (e) {
                youtubeAccounts.value = settings.social.social_youtube;
            }
        }
        if (tiktokAccounts && settings.social.social_tiktok) {
            try {
                const accounts = JSON.parse(settings.social.social_tiktok);
                tiktokAccounts.value = accounts.join(', ');
            } catch (e) {
                tiktokAccounts.value = settings.social.social_tiktok;
            }
        }
    }
}

// ===== UTILITY FUNCTIONS =====
function getStatusText(status) {
    const statusMap = {
        'pending': 'Menunggu',
        'confirmed': 'Dikonfirmasi',
        'cancelled': 'Dibatalkan'
    };
    return statusMap[status] || status || 'Menunggu';
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        
        // Remove existing alert classes
        notification.classList.remove('alert-primary', 'alert-success', 'alert-warning', 'alert-danger');
        
        // Set alert class based on type
        if (type === 'error') {
            notification.classList.add('alert-danger');
        } else if (type === 'success') {
            notification.classList.add('alert-success');
        } else if (type === 'warning') {
            notification.classList.add('alert-warning');
        } else {
            notification.classList.add('alert-primary');
        }
        
        // Show notification using Bootstrap Toast
        const toast = new bootstrap.Toast(notification);
        toast.show();
    }
}

function showAllBookings() {
    // Switch to bookings page
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const bookingsLink = document.querySelector('.nav-link[data-page="bookings"]');
    if (bookingsLink) {
        bookingsLink.classList.add('active');
    }
    
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const bookingsPage = document.getElementById('bookings');
    if (bookingsPage) {
        bookingsPage.classList.add('active');
        displayAllBookings();
    }
}

function exportBookings() {
    if (bookings.length === 0) {
        showNotification('Tidak ada data booking untuk diekspor', 'warning');
        return;
    }
    
    // Simple CSV export
    let csv = 'ID Booking,Nama Pasien,Telepon,Layanan,Tanggal,Jam,Status\n';
    
    bookings.forEach(booking => {
        csv += `"${booking.bookingId || ''}","${booking.patientInfo?.name || ''}","${booking.patientInfo?.phone || ''}","${booking.serviceInfo?.serviceName || ''}","${booking.appointmentInfo?.date || ''}","${booking.appointmentInfo?.time || ''}","${getStatusText(booking.status)}"\n`;
    });
    
    try {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings-alracare-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Data booking berhasil diekspor', 'success');
    } catch (error) {
        console.error('Error exporting bookings:', error);
        showNotification('Error saat mengekspor data', 'error');
    }
}

function printBookingDetails(bookingId) {
    const booking = bookings.find(b => b.bookingId === bookingId);
    if (!booking) {
        showNotification('Booking tidak ditemukan', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showNotification('Tidak dapat membuka jendela print. Pastikan pop-up diizinkan.', 'error');
        return;
    }
    
    const servicesHTML = booking.serviceInfo?.selectedOptions ? 
        booking.serviceInfo.selectedOptions.map(option => `
            <div style="background: #f9f9f9; padding: 12px; margin: 8px 0; border-radius: 8px; border-left: 4px solid #3498db;">
                <div style="font-weight: bold; font-size: 14px;">${option.name || option.service_name || 'N/A'}</div>
                <div style="color: #666; font-size: 13px;">${option.price || option.service_price || 'N/A'}</div>
            </div>
        `).join('') : '';
    
    const printContent = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Booking Details - ${booking.bookingId}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.6; color: #333; }
                    .header { text-align: center; border-bottom: 4px solid #3498db; padding-bottom: 20px; margin-bottom: 30px; }
                    .details { margin: 30px 0; }
                    .detail-item { margin: 15px 0; padding: 12px 0; border-bottom: 2px solid #eee; display: flex; justify-content: space-between; font-size: 14px; }
                    .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; padding-top: 20px; border-top: 2px solid #ddd; }
                    .status { background: #fff3e0; color: #f39c12; padding: 6px 15px; border-radius: 25px; font-weight: bold; font-size: 12px; border: 2px solid #f39c12; display: inline-block; }
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
                    <h2 style="margin: 10px 0; color: #333; font-size: 22px;">Detail Booking</h2>
                    <p style="margin: 0; color: #666; font-size: 16px;">Kesehatan & Kecantikan Profesional</p>
                </div>
                <div class="details">
                    <div class="detail-item"><strong>Nomor Booking:</strong> <span>${booking.bookingId || 'N/A'}</span></div>
                    <div class="detail-item"><strong>Nama Pasien:</strong> <span>${booking.patientInfo?.name || 'N/A'}</span></div>
                    <div class="detail-item"><strong>Telepon:</strong> <span>${booking.patientInfo?.phone || 'N/A'}</span></div>
                    <div class="detail-item"><strong>Alamat:</strong> <span>${booking.patientInfo?.address || 'N/A'}</span></div>
                    <div class="detail-item"><strong>Tanggal:</strong> <span>${booking.appointmentInfo?.date || 'N/A'}</span></div>
                    <div class="detail-item"><strong>Jam:</strong> <span>${booking.appointmentInfo?.time || 'N/A'}</span></div>
                    <div class="detail-item">
                        <strong>Layanan:</strong> 
                        <span>${booking.serviceInfo?.serviceName || 'N/A'}</span>
                    </div>
                    ${servicesHTML}
                    <div class="detail-item"><strong>Catatan:</strong> <span>${booking.patientInfo?.notes || 'Tidak ada catatan'}</span></div>
                    <div class="detail-item"><strong>Status:</strong> <span class="status">${getStatusText(booking.status)}</span></div>
                </div>
                <div class="footer">
                    <p style="font-weight: bold; font-size: 14px;">Harap datang 15 menit sebelum jadwal perawatan</p>
                    <p>Bawa bukti booking ini saat datang ke klinik</p>
                    <p>Terima kasih atas kepercayaan Anda kepada Alra Care</p>
                    <p>Jl. Akcaya, Pontianak • 0813-8122-3811</p>
                    <p>www.alracare.com • rahmadramadhanaswin@gmail.com</p>
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
}

// Export functions for global access
window.viewBooking = viewBooking;
window.updateBookingStatus = updateBookingStatus;
window.deleteBooking = deleteBooking;
window.showAddBookingModal = showAddBookingModal;
window.showAddServiceModal = showAddServiceModal;
window.showAddServiceOptionModal = showAddServiceOptionModal;
window.showAddGalleryModal = showAddGalleryModal;
window.deleteGalleryImage = deleteGalleryImage;
window.exportBookings = exportBookings;
window.showAllBookings = showAllBookings;
window.printBookingDetails = printBookingDetails;
window.editService = editService;
window.deleteService = deleteService;
window.editServiceOption = editServiceOption;
window.deleteServiceOption = deleteServiceOption;