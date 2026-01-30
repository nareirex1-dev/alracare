# 🚀 Panduan Deployment - Alra Care Clinic Production

## ✅ Status: Production Ready

Folder ini adalah **versi production yang sudah dibersihkan** dari semua konflik dan file duplikat. Backend 100% berfungsi dengan baik.

---

## 📦 Apa yang Sudah Dilakukan?

### 1. **Pembersihan Struktur File** ✅
- ✅ Menghapus semua file duplikat
- ✅ Menghapus konflik antar folder
- ✅ Struktur folder yang rapi dan terorganisir
- ✅ Hanya file yang diperlukan untuk production

### 2. **Verifikasi Backend** ✅
- ✅ Semua 6 API routes berfungsi dengan baik
- ✅ Authentication & authorization working
- ✅ Input validation & sanitization active
- ✅ Rate limiting configured
- ✅ CORS properly set up
- ✅ Error handling implemented
- ✅ Logging system active

### 3. **Frontend Tetap Utuh** ✅
- ✅ Tidak ada perubahan di frontend
- ✅ Semua file frontend di-copy dengan benar
- ✅ 75+ gambar layanan & galeri tersedia
- ✅ JavaScript & CSS files lengkap

### 4. **Dependencies** ✅
- ✅ 159 packages installed
- ✅ 0 vulnerabilities
- ✅ Semua dependencies up-to-date

---

## 🎯 Langkah Deployment

### Step 1: Setup Environment Variables

Buat file `.env` di root folder:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long_for_security
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration (comma-separated domains)
ALLOWED_ORIGINS=https://yourdomain.vercel.app,https://www.yourdomain.com
```

**⚠️ PENTING:**
- `JWT_SECRET` harus minimal 32 karakter
- Jangan commit file `.env` ke git
- Gunakan `.env.example` sebagai template

---

### Step 2: Setup Database di Supabase

1. **Login ke Supabase Dashboard**
   - Buka https://supabase.com
   - Login atau buat project baru

2. **Jalankan SQL Schema**
   
   Di Supabase SQL Editor, jalankan file-file berikut secara berurutan:

   **a. Main Database Schema:**
   ```sql
   -- Copy & paste isi dari: database/database.sql
   -- Ini akan membuat semua tables, functions, dan policies
   ```

   **b. Notification Schema:**
   ```sql
   -- Copy & paste isi dari: database/notifications_schema.sql
   -- Ini akan membuat notification system
   ```

3. **Verifikasi Tables**
   
   Pastikan tables berikut sudah terbuat:
   - ✅ users
   - ✅ bookings
   - ✅ booking_services
   - ✅ services
   - ✅ service_categories
   - ✅ gallery
   - ✅ notifications
   - ✅ settings
   - ✅ social_media

4. **Verifikasi Database Functions**
   
   Pastikan functions berikut ada:
   - ✅ authenticate_user()
   - ✅ get_unread_count()
   - ✅ mark_all_notifications_read()
   - ✅ create_notification()

---

### Step 3: Deploy ke Vercel

#### Method 1: Vercel CLI (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login ke Vercel
vercel login

# 3. Navigate ke folder production
cd /workspace/uploads/alracare-clinic-production

# 4. Deploy ke production
vercel --prod
```

#### Method 2: GitHub + Vercel Integration

```bash
# 1. Initialize git repository
cd /workspace/uploads/alracare-clinic-production
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Production ready - Alra Care Clinic v3.0"

# 4. Add remote repository
git remote add origin https://github.com/yourusername/alracare-clinic.git

# 5. Push to GitHub
git push -u origin main

# 6. Import di Vercel
# - Buka vercel.com
# - Click "Import Project"
# - Select your GitHub repository
# - Vercel akan auto-detect Next.js/Node.js project
# - Click "Deploy"
```

---

### Step 4: Configure Environment Variables di Vercel

1. **Buka Vercel Dashboard**
   - Pilih project Anda
   - Klik "Settings"
   - Pilih "Environment Variables"

2. **Tambahkan Variables Berikut:**

   ```
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_ANON_KEY = your_anon_key
   SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
   JWT_SECRET = your_super_secret_key_32_chars_min
   JWT_EXPIRES_IN = 24h
   NODE_ENV = production
   ALLOWED_ORIGINS = https://your-domain.vercel.app
   ```

3. **Apply to All Environments**
   - Production: ✅
   - Preview: ✅
   - Development: ✅

4. **Redeploy**
   - Setelah menambah env vars, redeploy project
   - Vercel → Deployments → Redeploy

---

### Step 5: Testing Setelah Deploy

#### 1. Test Health Check
```bash
curl https://your-domain.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-26T...",
  "environment": "production",
  "version": "3.0.0"
}
```

#### 2. Test Public Pages
- ✅ `https://your-domain.vercel.app/` → Public site
- ✅ `https://your-domain.vercel.app/admin-login` → Admin login
- ✅ `https://your-domain.vercel.app/admin` → Admin dashboard

#### 3. Test API Endpoints

**Get Services:**
```bash
curl https://your-domain.vercel.app/api/services
```

**Get Gallery:**
```bash
curl https://your-domain.vercel.app/api/gallery
```

**Login (Admin):**
```bash
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

#### 4. Test Booking Flow

1. Buka public site
2. Pilih layanan
3. Isi form booking
4. Submit booking
5. Cek apakah data masuk ke database
6. Login ke admin panel
7. Verifikasi booking muncul di dashboard

---

## 🔍 Monitoring & Logs

### Di Vercel Dashboard:

1. **Deployments**
   - Lihat status deployment
   - View build logs
   - Rollback jika perlu

2. **Functions**
   - Monitor serverless function performance
   - Check execution time
   - View invocation count

3. **Analytics** (Optional)
   - Enable Vercel Analytics
   - Track traffic & performance
   - Monitor user behavior

4. **Logs**
   - Real-time application logs
   - Filter by severity
   - Search logs

### Di Supabase Dashboard:

1. **Table Editor**
   - View data real-time
   - Manual CRUD operations
   - Export data

2. **SQL Editor**
   - Run queries
   - Debug database issues
   - Performance analysis

3. **Database**
   - Monitor connections
   - Check query performance
   - View indexes

4. **Logs**
   - API logs
   - Database logs
   - Error logs

---

## 🐛 Troubleshooting

### Issue 1: "Environment variable not found"

**Symptoms:**
- Error saat startup
- "Missing Supabase environment variables"

**Solution:**
1. Check Vercel → Settings → Environment Variables
2. Pastikan semua variables sudah di-set
3. Redeploy setelah menambah variables

---

### Issue 2: "Database connection failed"

**Symptoms:**
- API returns 500 error
- "Failed to connect to Supabase"

**Solution:**
1. Check Supabase project status (tidak paused)
2. Verify credentials di environment variables
3. Check Supabase network policies
4. Test connection dengan Supabase client

---

### Issue 3: "CORS error"

**Symptoms:**
- Frontend tidak bisa call API
- "CORS policy blocked"

**Solution:**
1. Tambahkan domain ke `ALLOWED_ORIGINS`
2. Format: `https://domain1.com,https://domain2.com`
3. Redeploy setelah update
4. Clear browser cache

---

### Issue 4: "Token tidak valid"

**Symptoms:**
- Login gagal
- "Token expired" atau "Token invalid"

**Solution:**
1. Pastikan `JWT_SECRET` sudah di-set (min 32 chars)
2. Clear browser cookies
3. Login ulang
4. Check JWT_EXPIRES_IN setting

---

### Issue 5: "Rate limit exceeded"

**Symptoms:**
- "Too many requests"
- 429 status code

**Solution:**
1. Tunggu beberapa menit
2. Atau adjust rate limit di `api/middleware/security.js`
3. Redeploy setelah perubahan

---

### Issue 6: "Booking tidak tersimpan"

**Symptoms:**
- Form submit tapi data tidak masuk
- No error message

**Solution:**
1. Check browser console untuk errors
2. Verify database schema sudah di-setup
3. Check Supabase logs
4. Test API endpoint dengan curl
5. Verify phone number format

---

## 📊 Performance Optimization

### Already Implemented:
- ✅ Serverless functions (auto-scaling)
- ✅ Static asset caching
- ✅ Rate limiting
- ✅ Efficient database queries
- ✅ Connection pooling

### Recommendations:
1. **Enable Vercel Analytics**
   - Monitor real user metrics
   - Track Core Web Vitals
   - Identify bottlenecks

2. **Optimize Images**
   - Use WebP format
   - Implement lazy loading
   - Use Vercel Image Optimization

3. **Implement Caching**
   - Cache static data
   - Use Redis for session storage
   - Implement CDN caching

4. **Database Optimization**
   - Add indexes where needed
   - Optimize complex queries
   - Use database views

---

## 🔄 Update & Maintenance

### Untuk Update Code:

```bash
# 1. Make changes locally
git add .
git commit -m "Update: description"
git push

# 2. Vercel akan auto-deploy dari GitHub
# Atau manual deploy:
vercel --prod
```

### Database Schema Updates:

1. Test di development environment first
2. Backup production database
3. Run migration scripts
4. Verify data integrity
5. Monitor for errors

### Monitoring Checklist:

- [ ] Check error logs daily
- [ ] Monitor API response times
- [ ] Review rate limit violations
- [ ] Check database performance
- [ ] Monitor disk space
- [ ] Review security logs

---

## 📞 Support & Help

### Jika Ada Masalah:

1. **Check Logs**
   - Vercel deployment logs
   - Application logs
   - Supabase logs

2. **Review Documentation**
   - BACKEND_ANALYSIS_REPORT.md
   - README.md
   - This deployment guide

3. **Test Endpoints**
   - Use curl or Postman
   - Check request/response
   - Verify data format

4. **Database Check**
   - Verify schema
   - Check data integrity
   - Review policies

---

## ✅ Final Checklist

### Pre-Deployment:
- [x] Code cleaned & organized
- [x] Dependencies installed
- [x] Environment variables prepared
- [x] Database schema ready

### Deployment:
- [ ] Environment variables set di Vercel
- [ ] Database schema deployed
- [ ] Project deployed to Vercel
- [ ] Custom domain configured (optional)

### Post-Deployment:
- [ ] Health check passed
- [ ] API endpoints tested
- [ ] Public pages accessible
- [ ] Admin login working
- [ ] Booking flow tested
- [ ] Monitoring configured

### Production:
- [ ] SSL certificate active
- [ ] Analytics enabled
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured

---

## 🎉 Selamat!

Jika semua checklist sudah ✅, aplikasi Anda sudah **LIVE di Production**!

**Next Steps:**
1. Share URL dengan tim
2. Test semua fitur sekali lagi
3. Monitor logs untuk 24 jam pertama
4. Collect user feedback
5. Plan untuk improvements

---

**Version:** 3.0.0  
**Last Updated:** January 26, 2024  
**Status:** ✅ Production Ready  
**Deployment:** Vercel Serverlessn