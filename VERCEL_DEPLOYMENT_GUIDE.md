# 🚀 Panduan Deployment Vercel - Alra Care Clinic

## ✅ Masalah yang Telah Diperbaiki

### 1. **File admin-login.html tidak ada** ✅
- **Masalah:** vercel.json merujuk ke `/admin-login.html` yang tidak ada
- **Solusi:** File `admin-login.html` telah dibuat dengan halaman login yang lengkap

### 2. **Server.js routing error** ✅
- **Masalah:** Catch-all route mencari file yang tidak ada
- **Solusi:** Server.js telah diupdate untuk hanya handle API routes

### 3. **Vercel configuration** ✅
- **Masalah:** Routing rules tidak optimal
- **Solusi:** vercel.json telah dioptimalkan dengan routing yang benar

---

## 📋 Langkah-Langkah Deployment ke Vercel

### **Step 1: Persiapan Environment Variables**

Sebelum deploy, pastikan Anda sudah menyiapkan environment variables berikut:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-jwt-secret-minimum-32-characters
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.vercel.app
```

**Cara Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### **Step 2: Setup Vercel Project**

#### **Option A: Deploy via Vercel CLI**

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login ke Vercel:**
```bash
vercel login
```

3. **Deploy dari directory project:**
```bash
cd /path/to/alracare-clinic-clean
vercel
```

4. **Set Environment Variables:**
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add JWT_SECRET
vercel env add NODE_ENV
vercel env add ALLOWED_ORIGINS
```

5. **Deploy ke Production:**
```bash
vercel --prod
```

---

#### **Option B: Deploy via Vercel Dashboard**

1. **Login ke Vercel Dashboard:**
   - Buka https://vercel.com
   - Login dengan akun Anda

2. **Import Project:**
   - Click "Add New" → "Project"
   - Import dari Git repository atau upload folder

3. **Configure Project:**
   - **Framework Preset:** Other
   - **Root Directory:** ./
   - **Build Command:** (kosongkan)
   - **Output Directory:** (kosongkan)
   - **Install Command:** npm install

4. **Add Environment Variables:**
   - Go to "Settings" → "Environment Variables"
   - Add semua environment variables yang diperlukan:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `JWT_SECRET`
     - `NODE_ENV` = `production`
     - `ALLOWED_ORIGINS` = `https://your-domain.vercel.app`

5. **Deploy:**
   - Click "Deploy"
   - Tunggu proses deployment selesai

---

### **Step 3: Update ALLOWED_ORIGINS**

Setelah deployment berhasil, Anda akan mendapatkan URL Vercel (misalnya: `https://alracare.vercel.app`).

**Update environment variable:**
```bash
vercel env rm ALLOWED_ORIGINS production
vercel env add ALLOWED_ORIGINS production
# Masukkan: https://alracare.vercel.app,https://www.alracare.vercel.app
```

Atau via Dashboard:
- Settings → Environment Variables
- Edit `ALLOWED_ORIGINS`
- Value: `https://alracare.vercel.app,https://www.alracare.vercel.app`

---

### **Step 4: Verifikasi Deployment**

1. **Test Homepage:**
```bash
curl https://your-domain.vercel.app
```

2. **Test API Health:**
```bash
curl https://your-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-20T...",
  "environment": "production"
}
```

3. **Test Admin Login:**
- Buka: `https://your-domain.vercel.app/admin-login`
- Login dengan credentials:
  - Username: `admin`
  - Password: `admin123`

4. **Test Public Site:**
- Buka: `https://your-domain.vercel.app/`
- Pastikan semua layanan tampil
- Test booking form

---

## 🔧 Troubleshooting

### **Error: 404 NOT_FOUND**

**Penyebab:**
- File tidak ditemukan
- Routing salah

**Solusi:**
1. Pastikan semua file HTML ada di root directory
2. Check vercel.json routing configuration
3. Redeploy project

---

### **Error: 500 Internal Server Error**

**Penyebab:**
- Environment variables tidak diset
- Database connection error

**Solusi:**
1. Check environment variables di Vercel Dashboard
2. Verify Supabase credentials
3. Check Vercel logs:
```bash
vercel logs
```

---

### **Error: CORS Policy**

**Penyebab:**
- ALLOWED_ORIGINS tidak include domain Vercel

**Solusi:**
1. Update ALLOWED_ORIGINS:
```bash
ALLOWED_ORIGINS=https://your-domain.vercel.app,https://www.your-domain.vercel.app
```

2. Redeploy:
```bash
vercel --prod
```

---

### **Error: JWT_SECRET must be defined**

**Penyebab:**
- JWT_SECRET environment variable tidak diset

**Solusi:**
1. Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. Add ke Vercel:
```bash
vercel env add JWT_SECRET production
```

---

## 📊 Post-Deployment Checklist

- [ ] Homepage loads successfully
- [ ] Admin login works
- [ ] API endpoints respond correctly
- [ ] Booking form works
- [ ] Gallery images load
- [ ] Service list displays
- [ ] Admin panel accessible
- [ ] Notifications work
- [ ] Database connection stable
- [ ] CORS configured correctly
- [ ] SSL certificate active (HTTPS)
- [ ] Custom domain configured (if applicable)

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is strong (minimum 32 characters)
- [ ] SUPABASE_SERVICE_ROLE_KEY is set (for admin operations)
- [ ] ALLOWED_ORIGINS is restricted to your domain only
- [ ] NODE_ENV is set to "production"
- [ ] .env file is NOT committed to Git
- [ ] Admin password has been changed from default
- [ ] RLS (Row Level Security) is enabled in Supabase
- [ ] Rate limiting is active

---

## 🎯 Custom Domain Setup (Optional)

1. **Add Domain in Vercel:**
   - Settings → Domains
   - Add your custom domain

2. **Configure DNS:**
   - Add CNAME record:
     - Name: `www` or `@`
     - Value: `cname.vercel-dns.com`

3. **Update ALLOWED_ORIGINS:**
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

4. **Redeploy**

---

## 📈 Monitoring & Logs

**View Deployment Logs:**
```bash
vercel logs [deployment-url]
```

**View Real-time Logs:**
```bash
vercel logs --follow
```

**Check Build Logs:**
- Vercel Dashboard → Deployments → Click deployment → View logs

---

## 🔄 Update & Redeploy

**Update Code:**
```bash
git add .
git commit -m "Update: description"
git push origin main
```

Vercel akan otomatis redeploy jika connected ke Git.

**Manual Redeploy:**
```bash
vercel --prod
```

---

## 📞 Support

Jika mengalami masalah:

1. **Check Vercel Logs:**
```bash
vercel logs
```

2. **Check Supabase Logs:**
   - Supabase Dashboard → Logs

3. **Test API Locally:**
```bash
npm run dev
```

4. **Verify Environment Variables:**
```bash
vercel env ls
```

---

## ✅ Deployment Berhasil!

Setelah semua langkah di atas, aplikasi Alra Care Clinic Anda sudah live di Vercel! 🎉

**URLs:**
- Homepage: `https://your-domain.vercel.app/`
- Admin Login: `https://your-domain.vercel.app/admin-login`
- Admin Panel: `https://your-domain.vercel.app/admin`
- API Health: `https://your-domain.vercel.app/api/health`

---

**Last Updated:** 2026-01-20  
**Version:** 1.0.0