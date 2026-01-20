# Quick Start Guide - Alra Care

Panduan cepat untuk menjalankan Alra Care Clinic Management System.

## 🚀 Setup dalam 5 Menit

### Step 1: Clone/Download Project ✅
Anda sudah memiliki project ini!

### Step 2: Setup Database (Supabase)

1. **Buat Supabase Project**
   - Kunjungi: https://supabase.com
   - Sign up / Login
   - Click "New Project"
   - Isi:
     - Name: `alracare-clinic`
     - Database Password: (simpan ini!)
     - Region: Southeast Asia (Singapore)
   - Tunggu ~2 menit

2. **Run Database Schema**
   - Buka Supabase Dashboard
   - Klik "SQL Editor" di sidebar
   - Click "New Query"
   - Copy SEMUA isi file: `database/notifications_schema.sql`
   - Paste dan click "Run"
   - Pastikan muncul "Success. No rows returned"

3. **Get API Keys**
   - Klik "Project Settings" (icon gear)
   - Klik "API"
   - Copy 3 values ini:
     - Project URL → `SUPABASE_URL`
     - anon public → `SUPABASE_ANON_KEY`
     - service_role → `SUPABASE_SERVICE_KEY`

### Step 3: Setup Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit dengan text editor favorit Anda
nano .env
# atau
code .env
```

Isi dengan values dari Supabase:

```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

JWT_SECRET=buatlah-string-random-minimal-32-karakter-untuk-keamanan

ADMIN_EMAIL=admin@alracare.com
ADMIN_PASSWORD=GantiPasswordIni123!
```

### Step 4: Install Dependencies

```bash
npm install
```

Tunggu sampai selesai (~2-3 menit)

### Step 5: Start Server

```bash
# Development mode (auto-reload)
npm run dev

# atau Production mode
npm start
```

Tunggu sampai muncul:
```
🚀 Alra Care API server running on port 3000
📍 Health check: http://localhost:3000/api/health
```

### Step 6: Akses Aplikasi

Buka browser dan kunjungi:

1. **Public Site**: http://localhost:3000/public-site-enhanced.html
   - Halaman utama untuk customer
   - Booking online
   - Cek status booking
   - Riwayat booking
   - Notification center

2. **Admin Panel**: http://localhost:3000/admin-site.html
   - Login dengan:
     - Email: admin@alracare.com
     - Password: (yang Anda set di .env)
   - Dashboard
   - Manajemen booking
   - Manajemen layanan
   - Settings

3. **API Health Check**: http://localhost:3000/api/health
   - Untuk cek API berjalan dengan baik

## ✅ Verifikasi Setup

### Test 1: API Health
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Alra Care API is running",
  "timestamp": "2025-01-17T..."
}
```

### Test 2: Public Site
- Buka http://localhost:3000/public-site-enhanced.html
- Scroll ke "Fitur Layanan Kami"
- Klik "Cek Status Booking" → Modal harus muncul
- Klik "Riwayat Booking" → Modal harus muncul
- Klik "Pusat Notifikasi" → Modal harus muncul

### Test 3: Admin Panel
- Buka http://localhost:3000/admin-site.html
- Login dengan credentials dari .env
- Dashboard harus muncul dengan statistik

### Test 4: Create Test Booking
1. Di Public Site, klik "Booking Sekarang"
2. Isi form booking:
   - Nama: Test User
   - Telepon: 081234567890
   - Alamat: Jl. Test
   - Tanggal: Besok
   - Jam: 10:00
   - Pilih layanan
3. Submit
4. Catat nomor booking yang muncul

### Test 5: Notification System
1. Login ke Admin Panel
2. Klik "Bookings" di sidebar
3. Cari booking test tadi
4. Klik "Confirm" untuk konfirmasi booking
5. Kembali ke Public Site
6. Klik "Pusat Notifikasi"
7. Input nomor telepon: 081234567890
8. Harus muncul notifikasi "Booking Dikonfirmasi"

## 🎉 Success!

Jika semua test di atas berhasil, sistem Anda sudah berjalan dengan sempurna!

## 🔧 Troubleshooting

### Issue: npm install gagal
**Solution**: 
```bash
# Clear cache
npm cache clean --force

# Install ulang
rm -rf node_modules package-lock.json
npm install
```

### Issue: Server tidak start
**Solution**:
1. Check .env file sudah benar
2. Check port 3000 tidak dipakai aplikasi lain:
   ```bash
   # Mac/Linux
   lsof -i :3000
   
   # Windows
   netstat -ano | findstr :3000
   ```
3. Ganti PORT di .env jika perlu

### Issue: Database connection error
**Solution**:
1. Check SUPABASE_URL dan keys di .env
2. Check internet connection
3. Check Supabase project status di dashboard

### Issue: Notification tidak muncul
**Solution**:
1. Check database schema sudah di-run
2. Check di Supabase SQL Editor:
   ```sql
   SELECT * FROM notifications LIMIT 5;
   ```
3. Check triggers sudah dibuat:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%notification%';
   ```

## 📚 Next Steps

1. **Customize Data**
   - Login ke Admin Panel
   - Update Settings (info klinik, jam buka, dll)
   - Tambah/edit layanan sesuai klinik Anda
   - Upload gambar ke Gallery

2. **Test Semua Fitur**
   - Buat beberapa test booking
   - Test reschedule
   - Test notification
   - Test download bukti booking

3. **Deploy ke Production**
   - Baca: `docs/DEPLOYMENT_GUIDE.md`
   - Pilih platform: Vercel (recommended), Heroku, atau VPS
   - Follow deployment steps

4. **Training Staff**
   - Ajarkan cara pakai Admin Panel
   - Ajarkan cara konfirmasi booking
   - Ajarkan cara update status

## 🆘 Butuh Bantuan?

- **Documentation**: Baca `README.md` dan `docs/DEPLOYMENT_GUIDE.md`
- **Issues**: Check `PHASE_PROGRESS.md` untuk known issues
- **Support**: Email ke rahmadramadhanaswin@gmail.com

---

**Selamat! Sistem Alra Care siap digunakan!** 🎊
