# Panduan Deployment Alra Care Clinic Management System

## 📋 Prasyarat
- Node.js v24.x atau lebih tinggi
- npm v6.0.0 atau lebih tinggi
- Akun Supabase dengan database yang sudah di-setup
- Akun Vercel (untuk deployment hosting)

## 🔧 Setup Lokal

### 1. Clone dan Install Dependencies
```bash
npm install
```

### 2. Konfigurasi Environment Variables
Buat file `.env` berdasarkan `.env.example`:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Configuration
JWT_SECRET=your_strong_jwt_secret_minimum_32_chars
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional
ALLOWED_ORIGINS=http://localhost:3000
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false
```

### 3. Jalankan Development Server
```bash
npm run dev
```

Server akan berjalan di: `http://localhost:3000`

## 🚀 Deployment ke Vercel

### 1. Push ke GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 2. Setup di Vercel Dashboard
1. Buka https://vercel.com
2. Klik "New Project"
3. Import repository GitHub Anda
4. Konfigurasi project:
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `./`
   - Install Command: `npm install`

### 3. Tambahkan Environment Variables di Vercel
Di Vercel Dashboard, buka Settings > Environment Variables, dan tambahkan:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_strong_jwt_secret
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.vercel.app
COOKIE_DOMAIN=.vercel.app
COOKIE_SECURE=true
```

### 4. Deploy
Klik tombol "Deploy" - Vercel akan secara otomatis build dan deploy aplikasi.

## ✅ Perbaikan yang Sudah Dilakukan

### Backend Issues Fixed:
1. ✅ **Swagger Configuration** - Disederhanakan untuk menghindari syntax error
2. ✅ **Regex Pattern** - Diperbaiki escaped slash di path validation
3. ✅ **Environment Validation** - Sudah berfungsi dengan baik
4. ✅ **API Routes** - Semua route terstruktur dan berfungsi
5. ✅ **Security Middleware** - CORS, Helmet, Rate Limiting sudah aktif
6. ✅ **Dependencies** - NPM audit fix sudah dilakukan

### Frontend Issues Fixed:
1. ✅ **API Endpoint** - Menggunakan `window.location.origin` untuk dynamic URL
2. ✅ **Manifest Configuration** - PWA manifest sudah proper setup
3. ✅ **Service Worker** - Caching strategy sudah optimal

### Production Ready:
1. ✅ **Environment Variables** - Validasi pada startup
2. ✅ **Error Handling** - Error sanitization untuk production
3. ✅ **HTTPS Enforcement** - Automatic redirect di production
4. ✅ **Security Headers** - Helmet.js configured
5. ✅ **Rate Limiting** - Aktif pada semua API endpoints

## 📝 Testing Checklist Pre-Deployment

- [ ] Buka `http://localhost:3000` - Portal loading OK
- [ ] Akses `/public-site.html` - Website publik berfungsi
- [ ] Akses `/admin-login.html` - Login form tampil
- [ ] Test login dengan credentials yang benar
- [ ] Buat booking - fungsi booking berfungsi
- [ ] Test notifikasi - notifikasi terekam
- [ ] Verifikasi browser console tanpa error (F12 > Console)
- [ ] Verifikasi Network tab - semua API calls successful

## 🔍 Monitoring Production

### Vercel Analytics
1. Buka Project > Deployments
2. Lihat "Real-time Analytics" untuk traffic dan errors

### Supabase Logs
1. Buka Supabase Dashboard
2. Lihat "Logs" untuk database dan authentication events

### Health Check
API health endpoint tersedia di: `/api/health`
```bash
curl https://yourdomain.vercel.app/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-19T05:30:00.000Z",
  "environment": "production"
}
```

## 🐛 Troubleshooting

### Build Error di Vercel
- Pastikan semua environment variables sudah di-set
- Check Vercel logs untuk error detail
- Pastikan Node.js version compatible (gunakan v24.x)

### API tidak respond
- Verifikasi SUPABASE_URL dan API keys
- Cek ALLOWED_ORIGINS include domain Anda
- Lihat Supabase logs untuk query errors

### CORS Error
- Update ALLOWED_ORIGINS di Vercel ENV vars
- Pastikan cookie domain sesuai dengan production domain

## 📞 Support Resources
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Express.js Docs: https://expressjs.com
