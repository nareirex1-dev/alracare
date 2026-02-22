# Alra Care - Clinic Management System
## Version 3.0.0 - Production Ready

Sistem manajemen klinik lengkap dengan fitur booking, notifikasi, dan panel admin yang siap untuk production deployment.

## 🎯 Fitur Utama

### 1. **Portal Landing Page** (`/`)
- Interface yang memudahkan navigasi
- Akses ke Website Publik dan Admin Panel
- Design responsive dan modern

### 2. **Website Publik** (`/public-site.html`)
- Informasi layanan klinik
- Galeri klinik
- Sistem booking online
- Cek status booking
- Riwayat booking
- Pusat notifikasi real-time
- Offline capabilities dengan Service Worker

### 3. **Admin Panel** 
- **Login** (`/admin-login.html`) - Autentikasi JWT with httpOnly cookies
- **Dashboard** (`/admin-panel.html`) - Statistik dan manajemen
- Manajemen booking (create, read, update, delete)
- Manajemen layanan/services
- Manajemen galeri
- Pengaturan klinik
- Session management yang aman

## 🏗️ Tech Stack

### Backend
- **Framework**: Express.js 4.x
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with httpOnly cookies
- **Security**: Helmet.js, CORS, Rate Limiting
- **Logging**: Winston
- **Validation**: Input validation middleware

### Frontend
- **HTML5**, **CSS3**, **JavaScript (ES6+)**
- **PWA Support**: Service Worker, Web Manifest
- **Caching**: Client-side caching dengan localStorage
- **Offline Support**: Background sync

### Deployment
- **Hosting**: Vercel (Serverless functions)
- **Database**: Supabase
- **Environment**: Production-ready configuration

## 📦 Installation

### Prerequisites
```bash
- Node.js >= 24.x
- npm >= 6.0.0
- Supabase account with database setup
```

### Setup Lokal
```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env
# Edit .env dengan credentials Anda

# 3. Jalankan development server
npm run dev

# Server akan berjalan di http://localhost:3000
```

## 🚀 Deployment ke Vercel

### Quick Start
1. **Push ke GitHub**
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

2. **Buka Vercel Dashboard**
   - New Project > Import Git Repository
   - Select repository Anda
   - Framework: `Other`
   - Build Command: `npm run build`

3. **Set Environment Variables**
   - Masuk ke Vercel > Settings > Environment Variables
   - Tambahkan semua variables dari `.env`

4. **Deploy**
   - Klik "Deploy"
   - Tunggu hingga selesai (~2-3 menit)

Dokumentasi lengkap: Lihat [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🔒 Security Features

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **httpOnly Cookies** - Prevent XSS attacks
- ✅ **CORS Protection** - Configurable allowed origins
- ✅ **Rate Limiting** - Prevent brute force & abuse
- ✅ **Input Validation** - Sanitize all user inputs
- ✅ **HTTPS Enforcement** - Auto-redirect di production
- ✅ **Security Headers** - Helmet.js CSP, HSTS, etc
- ✅ **Environment Validation** - Startup security check
- ✅ **Error Sanitization** - Safe error messages

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/verify` - Verify token

### Bookings
- `GET /api/bookings` - Get all bookings (admin only)
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Create service (admin only)
- `PUT /api/services/:id` - Update service (admin only)
- `DELETE /api/services/:id` - Delete service (admin only)

### Gallery
- `GET /api/gallery` - Get gallery images
- `POST /api/gallery` - Upload gallery image (admin only)
- `DELETE /api/gallery/:id` - Delete gallery image (admin only)

### Notifications
- `GET /api/notifications/:phone` - Get notifications by phone
- `GET /api/notifications/:phone/unread` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read

### Health
- `GET /api/health` - Server health check

## 🗄️ Database Schema

### Main Tables
- **service_categories** - Kategori layanan
- **services** - Daftar layanan
- **patients** - Data pasien
- **bookings** - Data booking/appointment
- **booking_services** - Detail services per booking
- **gallery** - Galeri foto
- **notifications** - Notifikasi untuk users

Dokumentasi SQL lengkap: Lihat [database/database.sql](./database/database.sql)

## 📁 Project Structure

```
alra02/
├── api/
│   ├── server.js          # Express server setup
│   └── index.js           # Vercel serverless entry point
├── src/
│   ├── config/            # Configuration files
│   │   ├── env-validator.js
│   │   ├── logger.js
│   │   ├── supabase.js
│   │   └── swagger.js
│   ├── middleware/        # Express middleware
│   │   ├── auth.js
│   │   ├── security.js
│   │   └── validation.js
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── bookings.js
│   │   ├── services.js
│   │   ├── gallery.js
│   │   ├── notifications.js
│   │   └── settings.js
│   └── utils/             # Utility functions
│       ├── constants.js
│       └── helpers.js
├── public/                # Frontend static files
│   ├── index.html
│   ├── public-script.js
│   ├── public-style.css
│   ├── service-worker.js
│   └── manifest.json
├── database/              # Database schemas
│   ├── database.sql
│   └── notifications_schema.sql
├── admin-login.html       # Admin login page
├── admin-panel.html       # Admin dashboard
├── public-site.html       # Public website
├── index.html             # Portal landing page
├── package.json
├── .env                   # Environment variables
├── .env.example           # Environment variables example
├── vercel.json            # Vercel configuration
├── DEPLOYMENT_GUIDE.md    # Deployment instructions
└── README.md              # This file
```

## 🧪 Testing

### Manual Testing
1. **Buka Portal**: http://localhost:3000
2. **Akses Public Site**: http://localhost:3000/public-site.html
3. **Admin Login**: http://localhost:3000/admin-login.html
4. **Create Booking**: Submit form booking
5. **Verify Notification**: Check notification center

### API Testing with cURL
```bash
# Health check
curl http://localhost:3000/api/health

# List services
curl http://localhost:3000/api/services

# Create booking (example)
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "patient_name": "John Doe",
    "patient_phone": "081234567890",
    "patient_address": "Jl. Test No. 1",
    "appointment_date": "2026-02-25",
    "appointment_time": "10:00",
    "selected_services": ["SRV001"]
  }'
```

## 📈 Performance Optimization

- ✅ Service Worker caching strategy
- ✅ Client-side caching dengan TTL
- ✅ Database indexes pada query-heavy tables
- ✅ Rate limiting untuk mencegah abuse
- ✅ Gzip compression di server
- ✅ Static file serving optimization

## 🔄 Continuous Improvement

### Recent Updates (v3.0.0)
- ✅ Vercel deployment support
- ✅ JWT authentication implementation
- ✅ httpOnly cookie security
- ✅ Improved error handling
- ✅ Environment validation
- ✅ Fixed regex patterns
- ✅ Swagger API cleanup

### Roadmap
- [ ] Unit tests implementation
- [ ] Integration tests
- [ ] E2E tests with Cypress
- [ ] GraphQL API option
- [ ] Mobile app version
- [ ] SMS notification integration
- [ ] Email notification integration
- [ ] Multi-language support

## 📝 License

PROPRIETARY - Alra Care Clinic Management System
All rights reserved. Unauthorized reproduction prohibited.

## 👥 Support

Untuk pertanyaan dan support, hubungi: support@alracare.com

---

**Status**: Production Ready ✅
**Last Updated**: February 19, 2026
**Version**: 3.0.0