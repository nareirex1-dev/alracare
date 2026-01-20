# Struktur File - Alra Care

Dokumentasi lengkap struktur file dan fungsi masing-masing file.

## 📁 Root Directory

```
alracare-clinic-clean/
├── api/                    # Backend API
├── database/               # Database schemas
├── frontend/               # Frontend files
├── docs/                   # Documentation
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── package.json           # NPM dependencies
├── vercel.json            # Vercel deployment config
├── config.js              # API endpoints configuration
├── README.md              # Main documentation
├── QUICK_START.md         # Quick start guide
├── PHASE_PROGRESS.md      # Development progress
└── STRUKTUR_FILE.md       # This file
```

## 🔧 API Directory (`api/`)

### `api/server.js`
**Fungsi**: Express server utama
- Setup middleware (cors, json parser)
- Mount all routes
- Error handling
- Start server

**Digunakan oleh**: npm start/dev

### `api/config/supabase.js`
**Fungsi**: Supabase client configuration
- Initialize Supabase client
- Initialize Supabase admin client
- Export for use in routes

**Digunakan oleh**: Semua routes

### `api/middleware/auth.js`
**Fungsi**: Authentication middleware
- Verify JWT token
- Protect admin routes
- Extract user info from token

**Digunakan oleh**: Admin routes

### `api/routes/auth.js`
**Fungsi**: Authentication endpoints
- POST `/api/auth/login` - Admin login
- POST `/api/auth/logout` - Admin logout
- GET `/api/auth/verify` - Verify token

**Digunakan oleh**: Admin panel

### `api/routes/bookings.js`
**Fungsi**: Booking management endpoints
- GET `/api/bookings` - Get all bookings (admin)
- GET `/api/bookings/:id` - Get single booking
- GET `/api/bookings/check/:bookingId` - Check status (public)
- GET `/api/bookings/history/:phone` - Get history (public)
- POST `/api/bookings` - Create booking
- PUT `/api/bookings/:id/status` - Update status (admin)
- PUT `/api/bookings/:id/reschedule` - Reschedule (public)
- DELETE `/api/bookings/:id` - Delete booking (admin)

**Digunakan oleh**: Public site, Admin panel

### `api/routes/services.js`
**Fungsi**: Service management endpoints
- GET `/api/services` - Get all services
- POST `/api/services` - Create service (admin)
- PUT `/api/services/:id` - Update service (admin)
- DELETE `/api/services/:id` - Delete service (admin)

**Digunakan oleh**: Public site, Admin panel

### `api/routes/gallery.js`
**Fungsi**: Gallery management endpoints
- GET `/api/gallery` - Get all images
- POST `/api/gallery` - Add image (admin)
- DELETE `/api/gallery/:id` - Delete image (admin)

**Digunakan oleh**: Public site, Admin panel

### `api/routes/settings.js`
**Fungsi**: Settings management endpoints
- GET `/api/settings` - Get all settings
- PUT `/api/settings` - Update settings (admin)

**Digunakan oleh**: Public site, Admin panel

### `api/routes/notifications.js` (Phase 3)
**Fungsi**: Notification system endpoints
- GET `/api/notifications/phone/:phone` - Get notifications
- GET `/api/notifications/phone/:phone/unread-count` - Get unread count
- PUT `/api/notifications/:id/read` - Mark as read
- PUT `/api/notifications/phone/:phone/read-all` - Mark all as read
- DELETE `/api/notifications/:id` - Delete notification
- POST `/api/notifications` - Create notification

**Digunakan oleh**: Public site

## 🗄️ Database Directory (`database/`)

### `database/notifications_schema.sql`
**Fungsi**: Complete notification system schema
- Create `notifications` table
- Create indexes for performance
- Create RLS policies for security
- Create helper functions:
  - `create_notification()`
  - `mark_notification_read()`
  - `mark_all_notifications_read()`
  - `get_unread_count()`
  - `cleanup_old_notifications()`
- Create auto-triggers:
  - Booking confirmed → Create notification
  - Booking completed → Create notification
  - Booking rescheduled → Create notification

**Digunakan oleh**: Run manually di Supabase SQL Editor

## 🎨 Frontend Directory (`frontend/`)

### `frontend/admin-script.js` (Phase 1 - Fixed)
**Fungsi**: Admin panel logic
- Dashboard statistics
- Booking management (CRUD)
- Service management (CRUD) - FIXED
- Gallery management (CRUD) - FIXED
- Settings management - FIXED
- Authentication
- CSV export

**Digunakan oleh**: admin-site.html

### `frontend/admin-style.css`
**Fungsi**: Admin panel styling
- Dashboard layout
- Tables styling
- Forms styling
- Modals styling
- Responsive design

**Digunakan oleh**: admin-site.html

### `frontend/public-script-api.js`
**Fungsi**: Public site API calls helper
- apiCall() function
- Error handling
- Token management

**Digunakan oleh**: public-site-enhanced.html

### `frontend/public-script-enhanced.js` (Phase 2)
**Fungsi**: Phase 2 features implementation
- Check booking status
- Booking history
- Reschedule booking
- Download booking receipt (PDF)
- Modal management
- Form validations

**Digunakan oleh**: public-site-enhanced.html

### `frontend/notification-center.js` (Phase 3)
**Fungsi**: Notification center implementation
- Show notification center modal
- Load notifications
- Display notifications with filters
- Mark as read (single/all)
- Delete notification
- Auto-refresh (30s interval)
- Notification badge update
- Time ago helper

**Digunakan oleh**: public-site-enhanced.html

### `frontend/public-style.css`
**Fungsi**: Main public site styling
- Hero section
- Services grid
- Gallery grid
- Footer
- Modals
- Forms
- Responsive design

**Digunakan oleh**: public-site-enhanced.html

### `frontend/notification-styles.css` (Phase 3)
**Fungsi**: Notification center styling
- Notification list
- Notification items (read/unread)
- Notification icons
- Notification badge
- Filter buttons
- Responsive design

**Digunakan oleh**: public-site-enhanced.html

### `frontend/images/`
**Fungsi**: Static images directory
- Service images (A_*.webp, S_*.webp, H_*.webp, etc.)
- Gallery images (ruang_*.webp, TimMedis.webp)
- Logo (image_logo.webp)

**Digunakan oleh**: Public site, Admin panel

## 📄 Root Files

### `config.js`
**Fungsi**: API endpoints configuration
- Define all API endpoints
- apiCall() helper function
- Export for use in frontend

**Digunakan oleh**: All frontend scripts

### `public-site-enhanced.html`
**Fungsi**: Main public site (with all 3 phases)
- Hero section
- Features section (Phase 2 & 3)
- Services section
- Gallery section
- Footer
- Modals:
  - Service details
  - Quick booking
  - Check booking (Phase 2)
  - Booking history (Phase 2)
  - Notification center (Phase 3)

**Scripts loaded**:
1. config.js
2. frontend/public-script-api.js
3. frontend/public-script-enhanced.js (Phase 2)
4. frontend/notification-center.js (Phase 3)

**Styles loaded**:
1. frontend/public-style.css
2. frontend/notification-styles.css (Phase 3)

### `admin-site.html`
**Fungsi**: Admin panel
- Login page
- Dashboard
- Bookings management
- Services management
- Gallery management
- Settings

**Scripts loaded**:
1. config.js
2. frontend/admin-script.js

**Styles loaded**:
1. frontend/admin-style.css

### `package.json`
**Fungsi**: NPM configuration
- Project metadata
- Dependencies:
  - express
  - cors
  - dotenv
  - @supabase/supabase-js
  - jsonwebtoken
  - bcryptjs
- Scripts:
  - `npm start` - Production mode
  - `npm run dev` - Development mode (nodemon)

### `vercel.json`
**Fungsi**: Vercel deployment configuration
- Build settings
- Routes configuration
- API routing

**Digunakan oleh**: Vercel deployment

### `.env.example`
**Fungsi**: Environment variables template
- Server config
- Supabase config
- JWT config
- Admin config

**Cara pakai**: Copy ke `.env` dan isi dengan values sebenarnya

### `.gitignore`
**Fungsi**: Git ignore rules
- node_modules/
- .env files
- Build outputs
- IDE files
- OS files

## 📚 Documentation Files

### `README.md`
**Fungsi**: Main project documentation
- Features overview
- Project structure
- Quick start guide
- API endpoints
- Testing checklist
- Deployment guide

### `QUICK_START.md`
**Fungsi**: Quick start guide (5 minutes)
- Step-by-step setup
- Verification tests
- Troubleshooting

### `PHASE_PROGRESS.md`
**Fungsi**: Development progress tracking
- Phase 1: Admin fixes
- Phase 2: Public features
- Phase 3: Notification center
- Known issues
- Success metrics

### `docs/DEPLOYMENT_GUIDE.md`
**Fungsi**: Complete deployment guide
- Prerequisites
- Database setup
- Environment setup
- 4 deployment options:
  - Vercel (recommended)
  - Heroku
  - DigitalOcean
  - VPS (Ubuntu)
- Post-deployment checklist
- Troubleshooting
- Monitoring

## 🔄 File Dependencies

### Public Site Flow:
```
public-site-enhanced.html
  ├── config.js (API endpoints)
  ├── frontend/public-style.css
  ├── frontend/notification-styles.css
  ├── frontend/public-script-api.js (API calls)
  ├── frontend/public-script-enhanced.js (Phase 2)
  └── frontend/notification-center.js (Phase 3)
```

### Admin Panel Flow:
```
admin-site.html
  ├── config.js (API endpoints)
  ├── frontend/admin-style.css
  └── frontend/admin-script.js (All admin logic)
```

### API Flow:
```
api/server.js
  ├── api/config/supabase.js
  ├── api/middleware/auth.js
  └── api/routes/
      ├── auth.js
      ├── bookings.js
      ├── services.js
      ├── gallery.js
      ├── settings.js
      └── notifications.js
```

## 🎯 File Checklist

Sebelum deploy, pastikan semua file ini ada:

**Backend (API):**
- [x] api/server.js
- [x] api/config/supabase.js
- [x] api/middleware/auth.js
- [x] api/routes/auth.js
- [x] api/routes/bookings.js
- [x] api/routes/services.js
- [x] api/routes/gallery.js
- [x] api/routes/settings.js
- [x] api/routes/notifications.js

**Database:**
- [x] database/notifications_schema.sql

**Frontend:**
- [x] frontend/admin-script.js
- [x] frontend/admin-style.css
- [x] frontend/public-script-api.js
- [x] frontend/public-script-enhanced.js
- [x] frontend/notification-center.js
- [x] frontend/public-style.css
- [x] frontend/notification-styles.css
- [x] frontend/images/ (semua gambar)

**Root:**
- [x] config.js
- [x] public-site-enhanced.html
- [x] admin-site.html
- [x] package.json
- [x] .env.example
- [x] .gitignore
- [x] vercel.json

**Documentation:**
- [x] README.md
- [x] QUICK_START.md
- [x] PHASE_PROGRESS.md
- [x] STRUKTUR_FILE.md
- [x] docs/DEPLOYMENT_GUIDE.md

## ✅ Total: 30+ files

Semua file sudah lengkap dan siap digunakan!

---

**Last Updated**: January 2025  
**Version**: 3.0.0 (All Phases Complete)
