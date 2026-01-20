# 🚀 QUICK START GUIDE - Security Fixes

Panduan cepat untuk menjalankan aplikasi dengan security fixes yang telah diimplementasikan.

---

## ⚡ Quick Setup (5 Menit)

### 1. Install Dependencies

```bash
cd /workspace/uploads/alracare-clinic-clean
npm install
```

**Dependencies baru yang ditambahkan:**
- `validator` - Input validation
- `express-rate-limit` - Rate limiting
- `helmet` - Security headers
- `cookie-parser` - Cookie management
- `uuid` - Secure ID generation

### 2. Setup Environment Variables

```bash
# Copy template
cp .env.example .env

# Generate JWT secret (PENTING!)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Edit .env
nano .env
```

**Minimal configuration untuk development:**

```bash
# Supabase (dari dashboard Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# JWT (gunakan hasil generate di atas)
JWT_SECRET=your-generated-secret-here

# Server
NODE_ENV=development
PORT=3000

# Security (development)
ALLOWED_ORIGINS=http://localhost:3000
COOKIE_SECURE=false
COOKIE_DOMAIN=localhost
```

### 3. Start Server

```bash
npm run dev
```

**Expected output:**
```
✅ Environment variables validated successfully
🚀 Alra Care API Server
📍 Environment: development
🌐 Server running on port 3000
🔒 CORS allowed origins: http://localhost:3000
⏱️  Rate limit: 100 requests per 15 minutes
✅ Server ready to accept connections
```

### 4. Test Security

```bash
# Run automated tests
bash test-security.sh
```

---

## 🔒 Security Features Enabled

### ✅ What's Protected Now:

1. **Environment Validation**
   - Automatic validation on startup
   - Clear error messages if missing variables
   - JWT_SECRET minimum 32 characters enforced

2. **Input Validation**
   - Phone numbers: 10-13 digits
   - Emails: RFC 5322 compliant
   - Dates: Future dates only
   - Times: Business hours (08:00-17:00)
   - Names: Minimum 2 words
   - All inputs sanitized (XSS prevention)

3. **Rate Limiting**
   - General API: 100 requests / 15 minutes
   - Login: 5 attempts / 15 minutes
   - Bookings: 10 bookings / hour

4. **CORS Protection**
   - Whitelist-based origin checking
   - Credentials support
   - Proper headers

5. **Security Headers**
   - HSTS (HTTPS enforcement)
   - X-Content-Type-Options (MIME sniffing prevention)
   - X-Frame-Options (Clickjacking prevention)
   - CSP (Content Security Policy)
   - XSS Protection

6. **Authentication**
   - JWT with secure secret
   - httpOnly cookies (XSS protection)
   - Token expiration
   - Dual support (cookie + localStorage)

7. **SQL Injection Prevention**
   - UUID-based ID generation
   - Input validation
   - Parameterized queries

8. **Error Sanitization**
   - No sensitive data in error messages
   - Stack traces only in development
   - Security event logging

---

## 🧪 Testing Checklist

### Quick Tests:

```bash
# 1. Test health endpoint
curl http://localhost:3000/api/health

# 2. Test CORS (should fail)
curl -H "Origin: https://evil.com" http://localhost:3000/api/services

# 3. Test rate limiting (run 6 times)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
done
# 6th request should return 429

# 4. Test input validation
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"patient_phone":"123"}'
# Should return 400 with validation error
```

### Manual Tests:

1. **Login Flow:**
   - Open browser DevTools > Network
   - Login dengan credentials valid
   - Check response headers untuk Set-Cookie
   - Verify cookie: HttpOnly=true, SameSite=Strict

2. **Security Headers:**
   - Open browser DevTools > Network
   - Load any page
   - Check response headers:
     - X-Content-Type-Options: nosniff
     - X-Frame-Options: DENY
     - Strict-Transport-Security (production only)

3. **Rate Limiting:**
   - Try login 6 times dengan wrong password
   - 6th attempt should be blocked
   - Wait 15 minutes untuk reset

---

## 🔄 Migration dari Versi Lama

### Frontend Changes Required:

#### Option 1: Keep Using localStorage (No Changes)
```javascript
// Existing code still works
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
const data = await response.json();
localStorage.setItem('admin_token', data.token);
```

#### Option 2: Migrate to Cookies (Recommended)
```javascript
// New code with cookies
const response = await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include', // IMPORTANT!
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

// All subsequent requests
const response = await fetch('/api/bookings', {
  credentials: 'include' // IMPORTANT!
});

// Logout
await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
});
```

**Key change:** Add `credentials: 'include'` to all fetch requests

---

## 🚨 Common Issues & Solutions

### Issue 1: "Missing required environment variables"

**Solution:**
```bash
# Check .env file exists
ls -la .env

# Verify all required variables are set
cat .env | grep -E "SUPABASE_URL|JWT_SECRET|NODE_ENV"

# If missing, copy from template
cp .env.example .env
```

### Issue 2: "JWT_SECRET must be at least 32 characters"

**Solution:**
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env
JWT_SECRET=<paste-generated-secret-here>
```

### Issue 3: "CORS blocked"

**Solution:**
```bash
# Add your origin to .env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Or for development, set NODE_ENV=development
NODE_ENV=development
```

### Issue 4: "Too Many Requests"

**Solution:**
```bash
# Wait for rate limit window to reset
# Auth: 15 minutes
# Bookings: 1 hour

# Or increase limits in .env (development only)
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=60
```

### Issue 5: "Token expired"

**Solution:**
```javascript
// User needs to login again
// Token expires after 24 hours (default)

// To change expiration, update .env
JWT_EXPIRATION=48h // 48 hours
```

---

## 📝 Development vs Production

### Development (.env):
```bash
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
COOKIE_SECURE=false
COOKIE_DOMAIN=localhost
```

### Production (.env):
```bash
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
COOKIE_SECURE=true
COOKIE_DOMAIN=yourdomain.com
```

---

## 🎯 Next Steps

1. **Test all endpoints** dengan automated script
2. **Update frontend** untuk menggunakan cookies (recommended)
3. **Deploy to staging** dan test dengan production config
4. **Monitor logs** untuk suspicious activities
5. **Setup error tracking** (Sentry, Rollbar)

---

## 📚 Additional Resources

- Full Documentation: `SECURITY_FIXES_DOCUMENTATION.md`
- Environment Template: `.env.example`
- Testing Script: `test-security.sh`
- API Routes: `api/routes/`
- Middleware: `api/middleware/`

---

## ✅ Verification Checklist

Before deploying to production:

- [ ] All environment variables set correctly
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] ALLOWED_ORIGINS set to production domains
- [ ] COOKIE_SECURE=true for production
- [ ] All automated tests passing
- [ ] Manual tests completed
- [ ] Frontend updated (if using cookies)
- [ ] Error tracking configured
- [ ] Logs monitoring setup

---

**Status:** ✅ Ready for Development  
**Next:** Test → Update Frontend → Deploy to Staging → Production

Need help? Check `SECURITY_FIXES_DOCUMENTATION.md` for detailed information.