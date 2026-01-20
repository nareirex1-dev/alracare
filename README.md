# Alra Care - Clinic Management System

Sistem manajemen klinik lengkap dengan fitur booking online, notification center, dan admin panel.

## 🎯 Features

### Phase 1: Admin Panel ✅
- ✅ Edit dan tambah layanan
- ✅ Manajemen galeri
- ✅ Pengaturan klinik
- ✅ Dashboard statistik
- ✅ Manajemen booking

### Phase 2: Public Site Features ✅
- ✅ Cek status booking
- ✅ Riwayat booking
- ✅ Reschedule booking
- ✅ Download bukti booking (PDF)
- ✅ Booking online

### Phase 3: Notification Center ✅
- ✅ Real-time notifications
- ✅ Auto-notification triggers
- ✅ Filter dan mark as read
- ✅ Notification badge
- ✅ Mobile responsive

## 📁 Project Structure

```
alracare-clinic-clean/
├── api/                          # Backend API
│   ├── routes/
│   │   ├── auth.js              # Authentication
│   │   ├── bookings.js          # Booking management
│   │   ├── services.js          # Service management
│   │   ├── gallery.js           # Gallery management
│   │   ├── settings.js          # Settings management
│   │   └── notifications.js     # Notification system (Phase 3)
│   ├── config/
│   │   └── supabase.js          # Supabase configuration
│   ├── middleware/
│   │   └── auth.js              # Auth middleware
│   └── server.js                # Express server
├── database/
│   └── notifications_schema.sql # Notification system schema
├── frontend/
│   ├── admin-script.js          # Admin panel logic
│   ├── public-script-api.js     # Public site API calls
│   ├── public-script-enhanced.js # Phase 2 features
│   ├── notification-center.js   # Phase 3 notification center
│   ├── public-style.css         # Main styles
│   └── notification-styles.css  # Notification styles
├── config.js                     # API endpoints configuration
├── public-site-enhanced.html    # Main public site (with all phases)
├── admin-site.html              # Admin panel
├── PHASE_PROGRESS.md            # Development progress tracking
└── README.md                    # This file
```

## 🚀 Quick Start

### 1. Database Setup

Run the SQL schema in Supabase SQL Editor:

```bash
# Copy and execute the contents of:
database/notifications_schema.sql
```

### 2. Environment Variables

Create `.env` file:

```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

### 5. Access Application

- **Public Site**: http://localhost:3000/public-site-enhanced.html
- **Admin Panel**: http://localhost:3000/admin-site.html
- **API Health**: http://localhost:3000/api/health

## 📋 API Endpoints

### Bookings
- `GET /api/bookings` - Get all bookings (admin)
- `GET /api/bookings/:id` - Get single booking
- `GET /api/bookings/check/:bookingId` - Check booking status (public)
- `GET /api/bookings/history/:phone` - Get booking history (public)
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id/status` - Update status (admin)
- `PUT /api/bookings/:id/reschedule` - Reschedule booking (public)
- `DELETE /api/bookings/:id` - Delete booking (admin)

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Create service (admin)
- `PUT /api/services/:id` - Update service (admin)
- `DELETE /api/services/:id` - Delete service (admin)

### Gallery
- `GET /api/gallery` - Get all images
- `POST /api/gallery` - Add image (admin)
- `DELETE /api/gallery/:id` - Delete image (admin)

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings (admin)

### Notifications (Phase 3)
- `GET /api/notifications/phone/:phone` - Get notifications
- `GET /api/notifications/phone/:phone/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/phone/:phone/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications` - Create notification

## 🎨 Features Detail

### Public Site Features

#### 1. Cek Status Booking
- Input nomor booking
- Timeline status visual
- Detail booking lengkap
- Tombol reschedule dan download

#### 2. Riwayat Booking
- Input nomor telepon
- Filter by status
- List semua booking
- Quick actions per booking

#### 3. Reschedule Booking
- Pilih tanggal dan jam baru
- Validasi availability
- Security verification
- Auto-notification

#### 4. Download Bukti Booking
- Print-friendly receipt
- QR code untuk verifikasi
- Professional format
- Contact information

#### 5. Notification Center
- Real-time updates (30s interval)
- Filter unread/all
- Mark as read
- Delete notifications
- Notification badge
- Color-coded by type

### Admin Panel Features

#### 1. Dashboard
- Total bookings
- Today's bookings
- Monthly revenue
- Available services
- Recent bookings table

#### 2. Booking Management
- View all bookings
- Filter by status/date
- Update status
- Delete bookings
- Export to CSV

#### 3. Service Management
- Add/edit/delete categories
- Add/edit/delete services
- Upload service images
- Set pricing

#### 4. Gallery Management
- Upload images
- Add descriptions
- Delete images
- Sync with public site

#### 5. Settings
- Clinic information
- Business hours
- Social media accounts
- Contact details

## 🔔 Notification Types

1. **booking_confirmed** 🟢 - Auto-triggered when admin confirms booking
2. **booking_completed** 🟢 - Auto-triggered when booking is completed
3. **reschedule_approved** 🔵 - Auto-triggered when user reschedules
4. **booking_reminder** 🟡 - Manual trigger for appointment reminder
5. **reschedule_rejected** 🔴 - Manual trigger if reschedule is rejected
6. **general** 🔵 - Manual trigger for announcements/promos

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Phone number verification for user operations
- JWT authentication for admin operations
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 📱 Responsive Design

- Mobile-first approach
- Tablet optimization
- Desktop enhancement
- Touch-friendly UI
- Adaptive layouts

## 🧪 Testing Checklist

### Database
- [ ] Run SQL schema
- [ ] Verify tables created
- [ ] Test helper functions
- [ ] Test triggers

### API
- [ ] Test all endpoints with Postman
- [ ] Verify authentication
- [ ] Test error handling
- [ ] Check response formats

### Frontend
- [ ] Test all modals
- [ ] Test form validations
- [ ] Test responsive design
- [ ] Test auto-refresh
- [ ] Test notification badge

### Integration
- [ ] Create test booking
- [ ] Confirm booking → Check notification
- [ ] Complete booking → Check notification
- [ ] Reschedule booking → Check notification

## 🚀 Deployment

### Prerequisites
- Node.js 14+
- Supabase account
- Domain (optional)

### Steps

1. **Database**
   ```bash
   # Run in Supabase SQL Editor
   database/notifications_schema.sql
   ```

2. **Environment**
   ```bash
   # Set environment variables
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Build**
   ```bash
   npm install
   npm run build
   ```

4. **Deploy**
   ```bash
   # Deploy to your hosting platform
   # (Vercel, Netlify, Heroku, etc.)
   ```

5. **Verify**
   - Check API health endpoint
   - Test public site
   - Test admin panel
   - Monitor error logs

## 📊 Monitoring

### Metrics to Track
- Total notifications created per day
- Average unread count per user
- Notification read rate
- API response times
- Database query performance
- Error rates

### Maintenance Tasks

**Weekly:**
- Monitor notification count growth
- Check for failed triggers
- Review error logs

**Monthly:**
- Run `cleanup_old_notifications()`
- Analyze engagement metrics
- Optimize queries

**Quarterly:**
- Update notification templates
- Optimize database indexes
- Update documentation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is proprietary software for Alra Care clinic.

## 📞 Support

- **Email**: rahmadramadhanaswin@gmail.com
- **Phone**: 0813-8122-3811
- **Address**: Jl. Akcaya, Pontianak, Kalimantan Barat

## 🎉 Acknowledgments

- Supabase for database and authentication
- Express.js for backend framework
- Font Awesome for icons
- All contributors and testers

---

**Version**: 3.0.0 (All Phases Complete)  
**Last Updated**: January 2025  
**Status**: Production Ready ✅
