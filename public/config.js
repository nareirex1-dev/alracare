// API Configuration
const API_CONFIG = {
    BASE_URL: window.location.origin + '/api',
    ENDPOINTS: {
        // Bookings
        BOOKINGS: '/bookings',
        BOOKING_BY_ID: (id) => `/bookings/${id}`,
        BOOKING_STATUS: (id) => `/bookings/${id}/status`,
        BOOKING_CHECK: (id) => `/bookings/check/${id}`,
        BOOKING_HISTORY: (phone) => `/bookings/history/${phone}`,
        BOOKING_RESCHEDULE: (id) => `/bookings/${id}/reschedule`,
        
        // Services
        SERVICES: '/services',
        SERVICE_BY_ID: (id) => `/services/${id}`,
        
        // Gallery
        GALLERY: '/gallery',
        GALLERY_BY_ID: (id) => `/gallery/${id}`,
        
        // Settings
        SETTINGS: '/settings',
        SETTING_BY_ID: (id) => `/settings/${id}`,
        
        // Notifications (Phase 3)
        NOTIFICATIONS_BY_PHONE: (phone) => `/notifications/phone/${phone}`,
        NOTIFICATIONS_UNREAD_COUNT: (phone) => `/notifications/phone/${phone}/unread-count`,
        NOTIFICATION_BY_ID: (id) => `/notifications/${id}`,
        NOTIFICATION_MARK_READ: (id) => `/notifications/${id}/read`,
        NOTIFICATIONS_MARK_ALL_READ: (phone) => `/notifications/phone/${phone}/read-all`,
        NOTIFICATIONS_CREATE: '/notifications',
        
        // Auth
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        VERIFY: '/auth/verify'
    }
};

// API Call Helper Function
async function apiCall(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('admin_token');
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        
        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        const url = API_CONFIG.BASE_URL + endpoint;
        const response = await fetch(url, finalOptions);
        
        // Handle 401 Unauthorized
        if (response.status === 401 && window.location.pathname.includes('admin')) {
            localStorage.removeItem('admin_token');
            window.location.href = '/admin-login.html';
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
        
    } catch (error) {
        console.error('API Call Error:', error);
        throw error;
    }
}

// Make functions available globally for browser usage
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
    window.apiCall = apiCall;
}

// Export for Node.js modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, apiCall };
}