// ===== NOTIFICATION CENTER =====
// Phase 3: Real-time notification system for users

let notificationPhone = null;
let notificationInterval = null;
let unreadCount = 0;

// ===== SHOW NOTIFICATION CENTER =====
function showNotificationCenter() {
    const content = `
        <div class="booking-form-modal">
            <div class="booking-header">
                <h2><i class="fas fa-bell me-2"></i>Pusat Notifikasi</h2>
                <p class="form-description">Lihat semua notifikasi dan update terkait booking Anda</p>
            </div>
            
            <form id="notificationPhoneForm" class="booking-form">
                <div class="form-group">
                    <label for="notificationPhone">Nomor Telepon *</label>
                    <input type="tel" id="notificationPhone" name="notificationPhone" required 
                           placeholder="Contoh: 081234567890"
                           pattern="[0-9]{10,13}">
                    <small class="form-hint">Masukkan nomor telepon yang Anda gunakan saat booking</small>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cta-button secondary" onclick="modalManager.closeAll()">
                        <i class="fas fa-times"></i> Batal
                    </button>
                    <button type="submit" class="cta-button">
                        <i class="fas fa-bell"></i> Lihat Notifikasi
                    </button>
                </div>
            </form>
        </div>
    `;
    
    const modalContent = document.getElementById('notificationCenterContent');
    if (modalContent) {
        modalContent.innerHTML = content;
        modalManager.openModal('notificationCenterModal');
        
        // Setup form submission
        const form = document.getElementById('notificationPhoneForm');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                const phone = document.getElementById('notificationPhone').value.trim();
                await loadNotifications(phone);
            });
        }
    }
}

// ===== LOAD NOTIFICATIONS =====
async function loadNotifications(phone, filter = 'all') {
    try {
        notificationPhone = phone;
        
        showNotification('⏳ Memuat notifikasi...', 'info');
        
        const endpoint = filter === 'unread' 
            ? API_CONFIG.ENDPOINTS.NOTIFICATIONS_BY_PHONE(phone) + '?status=unread'
            : API_CONFIG.ENDPOINTS.NOTIFICATIONS_BY_PHONE(phone);
        
        const response = await apiCall(endpoint);
        
        if (response.success) {
            // Also get unread count
            const countResponse = await apiCall(API_CONFIG.ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT(phone));
            unreadCount = countResponse.success ? countResponse.count : 0;
            
            displayNotifications(response.data, phone, filter);
            
            // Start auto-refresh
            startNotificationAutoRefresh(phone, filter);
        } else {
            throw new Error(response.message || 'Gagal memuat notifikasi');
        }
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

// ===== DISPLAY NOTIFICATIONS =====
function displayNotifications(notifications, phone, currentFilter = 'all') {
    const content = `
        <div class="booking-form-modal">
            <div class="booking-header">
                <h2><i class="fas fa-bell me-2"></i>Notifikasi</h2>
                <p class="form-description">Nomor Telepon: <strong>${phone}</strong></p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                    <p class="form-description">
                        Total: <strong>${notifications.length}</strong> notifikasi
                        ${unreadCount > 0 ? ` • <span style="color: var(--primary-color);">${unreadCount} belum dibaca</span>` : ''}
                    </p>
                    ${notifications.length > 0 && unreadCount > 0 ? `
                    <button class="cta-button btn-sm" onclick="markAllNotificationsRead('${phone}')">
                        <i class="fas fa-check-double"></i> Tandai Semua Dibaca
                    </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="filter-buttons">
                <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" 
                        onclick="loadNotifications('${phone}', 'all')">
                    <i class="fas fa-list"></i> Semua
                </button>
                <button class="filter-btn ${currentFilter === 'unread' ? 'active' : ''}" 
                        onclick="loadNotifications('${phone}', 'unread')">
                    <i class="fas fa-envelope"></i> Belum Dibaca ${unreadCount > 0 ? `(${unreadCount})` : ''}
                </button>
            </div>
            
            <div class="notifications-list" style="max-height: 500px; overflow-y: auto;">
                ${notifications.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-bell-slash"></i>
                        <h3>Tidak Ada Notifikasi</h3>
                        <p>Anda belum memiliki notifikasi</p>
                        <button class="cta-button" onclick="modalManager.closeAll(); showQuickBooking()">
                            <i class="fas fa-plus"></i> Buat Booking Baru
                        </button>
                    </div>
                ` : notifications.map(notif => {
                    const createdDate = new Date(notif.created_at);
                    const timeAgo = getTimeAgo(createdDate);
                    
                    const typeIcons = {
                        'booking_confirmed': { icon: 'check-circle', color: '#27ae60' },
                        'booking_reminder': { icon: 'clock', color: '#f39c12' },
                        'booking_completed': { icon: 'check-double', color: '#27ae60' },
                        'reschedule_approved': { icon: 'calendar-check', color: '#3498db' },
                        'reschedule_rejected': { icon: 'times-circle', color: '#e74c3c' },
                        'general': { icon: 'info-circle', color: '#3498db' }
                    };
                    
                    const typeInfo = typeIcons[notif.type] || typeIcons['general'];
                    
                    return `
                        <div class="notification-item ${notif.is_read ? 'read' : 'unread'}" 
                             onclick="markNotificationRead('${notif.id}', '${phone}')">
                            <div class="notification-icon" style="background: ${typeInfo.color}20; color: ${typeInfo.color};">
                                <i class="fas fa-${typeInfo.icon}"></i>
                            </div>
                            <div class="notification-content">
                                <div class="notification-header">
                                    <h4>${notif.title}</h4>
                                    ${!notif.is_read ? '<span class="unread-badge">Baru</span>' : ''}
                                </div>
                                <p class="notification-message">${notif.message}</p>
                                <div class="notification-footer">
                                    <span class="notification-time">
                                        <i class="fas fa-clock"></i> ${timeAgo}
                                    </span>
                                    ${notif.booking_id ? `
                                    <button class="notification-action" onclick="event.stopPropagation(); checkBookingStatus('${notif.booking_id}')">
                                        <i class="fas fa-eye"></i> Lihat Booking
                                    </button>
                                    ` : ''}
                                </div>
                            </div>
                            <button class="notification-delete" onclick="event.stopPropagation(); deleteNotification('${notif.id}', '${phone}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="form-actions" style="margin-top: 2rem;">
                <button type="button" class="cta-button secondary" onclick="stopNotificationAutoRefresh(); showNotificationCenter()">
                    <i class="fas fa-arrow-left"></i> Ganti Nomor
                </button>
                <button type="button" class="cta-button" onclick="loadNotifications('${phone}', '${currentFilter}')">
                    <i class="fas fa-sync"></i> Refresh
                </button>
            </div>
        </div>
    `;
    
    const modalContent = document.getElementById('notificationCenterContent');
    if (modalContent) {
        modalContent.innerHTML = content;
    }
}

// ===== MARK NOTIFICATION AS READ =====
async function markNotificationRead(notificationId, phone) {
    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.NOTIFICATION_MARK_READ(notificationId), {
            method: 'PUT',
            body: JSON.stringify({ phone })
        });
        
        if (response.success) {
            // Reload notifications to update UI
            const currentFilter = document.querySelector('.filter-btn.active')?.textContent.includes('Belum Dibaca') ? 'unread' : 'all';
            await loadNotifications(phone, currentFilter);
        }
        
    } catch (error) {
        console.error('Error marking notification read:', error);
    }
}

// ===== MARK ALL NOTIFICATIONS AS READ =====
async function markAllNotificationsRead(phone) {
    try {
        showNotification('⏳ Menandai semua notifikasi...', 'info');
        
        const response = await apiCall(API_CONFIG.ENDPOINTS.NOTIFICATIONS_MARK_ALL_READ(phone), {
            method: 'PUT'
        });
        
        if (response.success) {
            showNotification('✅ Semua notifikasi ditandai sebagai dibaca', 'success');
            await loadNotifications(phone, 'all');
        } else {
            throw new Error(response.message || 'Gagal menandai notifikasi');
        }
        
    } catch (error) {
        console.error('Error marking all read:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

// ===== DELETE NOTIFICATION =====
async function deleteNotification(notificationId, phone) {
    if (!confirm('Hapus notifikasi ini?')) {
        return;
    }
    
    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.NOTIFICATION_BY_ID(notificationId), {
            method: 'DELETE',
            body: JSON.stringify({ phone })
        });
        
        if (response.success) {
            showNotification('✅ Notifikasi berhasil dihapus', 'success');
            const currentFilter = document.querySelector('.filter-btn.active')?.textContent.includes('Belum Dibaca') ? 'unread' : 'all';
            await loadNotifications(phone, currentFilter);
        } else {
            throw new Error(response.message || 'Gagal menghapus notifikasi');
        }
        
    } catch (error) {
        console.error('Error deleting notification:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

// ===== AUTO-REFRESH NOTIFICATIONS =====
function startNotificationAutoRefresh(phone, filter) {
    // Clear existing interval
    stopNotificationAutoRefresh();
    
    // Refresh every 30 seconds
    notificationInterval = setInterval(async () => {
        try {
            const endpoint = filter === 'unread' 
                ? API_CONFIG.ENDPOINTS.NOTIFICATIONS_BY_PHONE(phone) + '?status=unread'
                : API_CONFIG.ENDPOINTS.NOTIFICATIONS_BY_PHONE(phone);
            
            const response = await apiCall(endpoint);
            
            if (response.success) {
                const countResponse = await apiCall(API_CONFIG.ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT(phone));
                const newUnreadCount = countResponse.success ? countResponse.count : 0;
                
                // Only update if there are new notifications
                if (newUnreadCount !== unreadCount) {
                    unreadCount = newUnreadCount;
                    displayNotifications(response.data, phone, filter);
                    
                    // Show notification badge if there are new unread
                    if (newUnreadCount > 0) {
                        updateNotificationBadge(newUnreadCount);
                    }
                }
            }
        } catch (error) {
            console.error('Auto-refresh error:', error);
        }
    }, 30000); // 30 seconds
}

function stopNotificationAutoRefresh() {
    if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
    }
}

// ===== UPDATE NOTIFICATION BADGE =====
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'block' : 'none';
    }
}

// ===== HELPER: TIME AGO =====
function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Baru saja';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' menit yang lalu';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' jam yang lalu';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' hari yang lalu';
    
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// ===== CLEANUP ON MODAL CLOSE =====
// Stop auto-refresh when modal is closed
const originalCloseAll = modalManager.closeAll;
modalManager.closeAll = function() {
    stopNotificationAutoRefresh();
    originalCloseAll.call(this);
};

// Export functions for global access
window.showNotificationCenter = showNotificationCenter;
window.loadNotifications = loadNotifications;
window.markNotificationRead = markNotificationRead;
window.markAllNotificationsRead = markAllNotificationsRead;
window.deleteNotification = deleteNotification;

console.log('✅ Phase 3 Notification Center loaded');
