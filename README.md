# Alra Care Clinic Management System

Sistem manajemen klinik lengkap dengan fitur booking, notifikasi, dan panel admin.

## 🏗️ Struktur Aplikasi

Aplikasi ini terdiri dari 3 bagian utama:

### 1. Portal Utama (`index.html`)
Halaman landing yang menyediakan 2 pilihan:
- **Website Publik** - Untuk pasien/pengunjung
- **Admin Panel** - Untuk administrator (memerlukan login)

### 2. Website Publik (`public-site.html`)
Halaman publik yang dapat diakses siapa saja, berisi:
- Informasi layanan klinik
- Galeri klinik
- Sistem booking online
- Cek status booking
- Riwayat booking
- Pusat notifikasi

### 3. Admin Panel (`admin-login.html` & `admin-panel.html`)
Portal khusus administrator dengan sistem login, berisi:
- Dashboard statistik
- Manajemen booking
- Manajemen layanan
- Manajemen galeri
- Pengaturan klinik

## 🚀 Cara Menjalankan

### Prerequisites
- Node.js >= 18.x
- npm >= 6.0.0
- Supabase account (untuk database)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
Buat file `.env` di root directory:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h

# Server Configuration
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

# Security
COOKIE_SECURE=false
COOKIE_DOMAIN=localhost
```

3. Setup database:
Jalankan SQL scripts di folder `database/`:
- `database.sql` - Schema utama
- `notifications_schema.sql` - Schema notifikasi

4. Jalankan server:
```bash
npm start
```

Atau untuk development dengan auto-reload:
```bash
npm run dev
```

5. Akses aplikasi:
- Portal: http://localhost:3000
- Website Publik: http://localhost:3000/public-site.html
- Admin Login: http://localhost:3000/admin-login.html

## 📁 Struktur Folder

```
alra02/
├── index.html                  # Portal utama
├── public-site.html           # Website publik
├── admin-login.html           # Halaman login admin
├── admin-panel.html           # Dashboard admin
├── config.js                  # Konfigurasi frontend
├── api/
│   └── server.js             # Express server
├── src/
│   ├── config/               # Konfigurasi backend
│   ├── middleware/           # Middleware (auth, security, validation)
│   ├── routes/               # API routes
│   └── utils/                # Utility functions
├── frontend/
│   ├── images/               # Gambar klinik
│   ├── public-style.css      # Style untuk website publik
│   ├── admin-style.css       # Style untuk admin panel
│   ├── public-script-api.js  # Script API publik
│   ├── public-script-enhanced.js  # Script enhanced publik
│   ├── admin-script.js       # Script admin panel
│   └── notification-center.js # Script notifikasi
└── database/
    ├── database.sql          # Schema database utama
    └── notifications_schema.sql  # Schema notifikasi
```

## 🔐 Login Admin

Default credentials (harap ubah di database):
- Username: admin
- Password: (sesuai yang di-set di database)

## 🌟 Fitur Utama

### Website Publik
- ✅ Tampilan layanan lengkap dengan gambar
- ✅ Galeri klinik
- ✅ Booking online dengan validasi
- ✅ Cek status booking dengan nomor booking
- ✅ Riwayat booking dengan nomor telepon
- ✅ Pusat notifikasi real-time
- ✅ Responsive design

### Admin Panel
- ✅ Dashboard dengan statistik
- ✅ Manajemen booking (CRUD)
- ✅ Manajemen layanan (CRUD)
- ✅ Manajemen galeri (CRUD)
- ✅ Pengaturan klinik
- ✅ Sistem autentikasi dengan JWT
- ✅ Secure httpOnly cookies

## 🔒 Keamanan

- JWT authentication dengan httpOnly cookies
- Password hashing dengan bcrypt
- Input validation dan sanitization
- CORS protection
- Rate limiting
- SQL injection prevention

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login admin
- `POST /api/auth/logout` - Logout admin
- `GET /api/auth/verify` - Verifikasi token

### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Gallery
- `GET /api/gallery` - Get all gallery items
- `POST /api/gallery` - Create gallery item
- `DELETE /api/gallery/:id` - Delete gallery item

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read

## 🛠️ Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build static files

## 📞 Support

Untuk pertanyaan atau bantuan, hubungi:
- Email: rahmadramadhanaswin@gmail.com
- Phone: 62813-8122-3811

## 📄 License

PROPRIETARY - © 2025 Alra Care. All rights reserved.