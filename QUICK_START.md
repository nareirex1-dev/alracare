# 🚀 QUICK START GUIDE - Alra Care Deployment

## ⚡ 5 Menit untuk Deploy ke Production

### Prerequisite (sudah siap)
- ✅ Semua code sudah fixed
- ✅ Dependencies sudah installed
- ✅ .env sudah configured
- ✅ Server tested locally

---

## 📝 STEP 1: Final Local Test (2 menit)

```bash
# Buka terminal di folder project
cd d:\rexsa\codex\New folder\alra02

# Test server start
npm start

# Verifikasi output:
# ✅ Environment variables validated successfully
# ✅ Server mendapat listen port messages
```

**Jika ada error**: Baca [FIXES_SUMMARY.md](FIXES_SUMMARY.md)

---

## 📤 STEP 2: Push ke GitHub (1 menit)

```bash
# Setup git (jika belum)
git init
git add .
git commit -m "Production ready - Alra Care v3.0.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/alra-care.git
git push -u origin main
```

**Notes**:
- Ganti `YOUR_USERNAME` dengan GitHub username Anda
- Pastikan `.env` di `.gitignore` (sudah ada)
- Public keys tidak akan ter-upload

---

## ☁️ STEP 3: Deploy ke Vercel (2 menit)

### Option A: Automatic (RECOMMENDED)

1. **Buka https://vercel.com**
2. **Login dengan GitHub account**
3. **Click "New Project"**
4. **Select repository "alra-care"**
5. **Framework: `Other`**
6. **Build Command: `npm run build`**
7. **Click "Deploy"** ✅

### Option B: Manual via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 🔑 STEP 4: Set Environment Variables (1 menit)

**Di Vercel Dashboard**:

1. Open Project > Settings > Environment Variables
2. **Add these variables** (copy dari .env atau .env.example):

```
NAME                        VALUE
════════════════════════════════════════════════════
SUPABASE_URL                https://goqqz...supabase.co
SUPABASE_ANON_KEY           eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY   eyJhbGc...
JWT_SECRET                  qJH1fNjduO3dz...
JWT_EXPIRES_IN              24h
PORT                        3000
NODE_ENV                    production
ALLOWED_ORIGINS             https://yourdomain.vercel.app
COOKIE_DOMAIN               .vercel.app
COOKIE_SECURE               true
RATE_LIMIT_MAX              100
RATE_LIMIT_WINDOW           900000
```

**CRITICAL**: Jangan menggunakan `.env` file di production, set via Vercel UI!

---

## ✅ STEP 5: Verifikasi Deployment (1 menit)

### Timeout: Wait ~2-3 minutes untuk build selesai

Setelah deployment selesai, Vercel akan berikan URL seperti:
```
https://alra-care-abc123.vercel.app
```

### Test API Health
```bash
curl https://alra-care-abc123.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-19T...",
  "environment": "production"
}
```

### Test Pages
- Portal: `https://alra-care-abc123.vercel.app/`
- Public Site: `https://alra-care-abc123.vercel.app/public-site.html`
- Admin Login: `https://alra-care-abc123.vercel.app/admin-login.html`

---

## 🎯 EXPECTED OUTPUT After Deployment

### ✅ Success Indicators
```
✅ Vercel shows "Deployment Successful"
✅ /api/health returns 200 OK
✅ Portal page loads
✅ Admin login page accessible
✅ API endpoints responding
✅ Database connected to Supabase
```

### ❌ Common Issues & Fixes

**Issue 1: "Deployment Failed"**
- Check Vercel logs: Project > Deployments > View Logs
- Most common: Missing environment variable
- Solution: Add missing var & redeploy

**Issue 2: "Cannot find module"**
- Check: `npm install` ran successfully
- Solution: Clear build cache > Redeploy

**Issue 3: "API returning 500 error"**
- Check: Vercel Function logs
- Check: Supabase credentials correct
- Solution: Verify SUPABASE_URL & keys in Vercel

**Issue 4: "CORS Error in browser"**
- Check: ALLOWED_ORIGINS includes your domain
- Solution: Update ALLOWED_ORIGINS in Vercel env vars

---

## 📊 Monitoring Post-Deployment

### Vercel Monitoring
```
Project > Analytics
├── Requests per minute
├── Response time
├── Error rate
└── Deployment history
```

### Database Monitoring
```
Supabase Dashboard > Logs
├── Query logs
├── Auth events
└── Error messages
```

### Health Check
```bash
# Run daily to verify:
curl https://yourdomain.vercel.app/api/health
```

---

## 🔄 Updating After Deployment

### Make Code Changes Locally
```bash
# 1. Edit files locally
# 2. Test locally
npm start

# 3. Commit & push
git add .
git commit -m "Fix: description"
git push origin main

# 4. Vercel auto-deploys (wait ~2 min)
```

### Update Environment Variables
```
Vercel Dashboard > Settings > Environment Variables
├── Make changes
└── Redeploy (Vercel auto-redeploys on env change)
```

---

## 📞 Troubleshooting Commands

### View Vercel Logs
```bash
vercel logs --prod
```

### Rollback Deployment
```
Vercel Dashboard > Deployments > Select old deployment > Click "Redeploy"
```

### Clear Cache
```
Vercel Dashboard > Settings > Git > Clear Git cache
Then redeploy
```

---

## 💡 Pro Tips

1. **Always test locally first**
   ```bash
   npm start  # Test before pushing
   ```

2. **Keep .env.example updated**
   - After adding new env vars, update .env.example
   - Helps team members setup

3. **Use meaningful commit messages**
   ```bash
   git commit -m "Fix: regex pattern in helpers.js"
   git commit -m "Feature: add notification center"
   ```

4. **Monitor first 24 hours**
   - Check Vercel analytics
   - Check error logs
   - Test all features in production

5. **Setup custom domain** (optional)
   ```
   Vercel Dashboard > Domains > Add Domain
   Update DNS records per Vercel instructions
   ```

---

## 🎉 DEPLOYMENT COMPLETED!

Aplikasi Anda sekarang berjalan di production! 

### Apa yang dapat diakses:
- 🏠 **Portal**: https://yourdomain.vercel.app/
- 🏥 **Public Site**: https://yourdomain.vercel.app/public-site.html
- 👤 **Admin Panel**: https://yourdomain.vercel.app/admin-login.html
- 📊 **API Docs**: /api-docs (jika enabled)
- ❤️ **Health Check**: https://yourdomain.vercel.app/api/health

---

## 📚 Dokumentasi Lengkap

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Detail deployment
- [FIXES_SUMMARY.md](FIXES_SUMMARY.md) - Apa yang sudah diperbaiki
- [README-FIXED.md](README-FIXED.md) - Feature documentation
- [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md) - Checklist lengkap

---

## ⚡ TL;DR - Ringkas Banget

```bash
# 1. Test lokal
npm start

# 2. Push ke GitHub
git add . && git commit -m "prod ready" && git push

# 3. Di Vercel Dashboard
# - Import repository
# - Framework: Other
# - Build: npm run build
# - Add env vars
# - Deploy

# 4. Verifikasi
# - Tunggu 2-3 menit
# - Test https://yourdomain.vercel.app/api/health

# 5. Selesai! 🎉
```

---

**Status**: ✅ READY FOR PRODUCTION
**Last Updated**: February 19, 2026
**Version**: 3.0.0