# 🚀 DEPLOYMENT CHECKLIST - ALRA CARE CLINIC MANAGEMENT SYSTEM

**Project:** Alra Care Clinic Management System  
**Version:** 3.0.0  
**Target Environment:** Production  
**Deployment Date:** [TO BE FILLED]

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ Phase 1: Code Preparation

#### 1.1 Code Quality
- [ ] All bugs fixed (see BUG_FIXES_LOG.md)
- [ ] Code reviewed and approved
- [ ] No console.log statements in production code
- [ ] All TODO comments resolved
- [ ] Code formatted and linted
  ```bash
  npm run lint
  npm run format
  ```

#### 1.2 Dependencies
- [ ] All dependencies installed
  ```bash
  npm install
  ```
- [ ] No security vulnerabilities
  ```bash
  npm audit
  # Fix any vulnerabilities
  npm audit fix
  ```
- [ ] Dependencies up to date
  ```bash
  npm outdated
  ```
- [ ] Remove unused dependencies
  ```bash
  npm prune
  ```

#### 1.3 Environment Configuration
- [ ] `.env.example` created with template
- [ ] `.env` added to `.gitignore`
- [ ] Production environment variables prepared
- [ ] All sensitive data removed from code
- [ ] API keys and secrets rotated

---

### ✅ Phase 2: Database Setup

#### 2.1 Supabase Configuration
- [ ] Production Supabase project created
- [ ] Database schema deployed
  ```sql
  -- Run in Supabase SQL Editor
  -- 1. Run database/database.sql (if exists)
  -- 2. Run database/notifications_schema.sql
  ```
- [ ] Verify all tables created:
  - [ ] bookings
  - [ ] booking_services
  - [ ] services (or service_categories)
  - [ ] gallery
  - [ ] settings
  - [ ] notifications

#### 2.2 Database Security
- [ ] Row Level Security (RLS) enabled on all tables
  ```sql
  -- Verify RLS
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public';
  ```
- [ ] RLS policies created and tested
  ```sql
  -- Check policies
  SELECT * FROM pg_policies;
  ```
- [ ] Foreign key constraints verified
- [ ] Indexes created for performance
  ```sql
  -- Check indexes
  SELECT * FROM pg_indexes WHERE schemaname = 'public';
  ```

#### 2.3 Database Functions & Triggers
- [ ] All helper functions created:
  - [ ] create_notification()
  - [ ] mark_notification_read()
  - [ ] mark_all_notifications_read()
  - [ ] get_unread_count()
  - [ ] cleanup_old_notifications()
- [ ] All triggers created:
  - [ ] booking_confirmed_notification
  - [ ] booking_completed_notification
  - [ ] booking_rescheduled_notification
- [ ] Test triggers with sample data
  ```sql
  -- Test trigger
  INSERT INTO bookings (...) VALUES (...);
  UPDATE bookings SET status = 'confirmed' WHERE id = 'test_id';
  -- Check if notification created
  SELECT * FROM notifications WHERE booking_id = 'test_id';
  ```

---

### ✅ Phase 3: Security Hardening

#### 3.1 Credentials Rotation
- [ ] Generate new JWT_SECRET
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
  ```
- [ ] Rotate Supabase API keys (if exposed)
  - [ ] Generate new anon key
  - [ ] Generate new service role key
- [ ] Update all environment variables
- [ ] Verify old credentials deactivated

#### 3.2 Environment Variables
Create production `.env` file with:
```env
# ========================
# SUPABASE CONFIGURATION
# ========================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_new_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key

# ========================
# JWT CONFIGURATION
# ========================
JWT_SECRET=your_new_jwt_secret_min_64_chars
JWT_EXPIRES_IN=24h

# ========================
# SERVER CONFIG
# ========================
PORT=3000
NODE_ENV=production

# ========================
# CORS
# ========================
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# ========================
# RATE LIMITING (Optional - adjust for production)
# ========================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

- [ ] All environment variables set
- [ ] No default/example values in production
- [ ] Sensitive data not in code or logs

#### 3.3 Security Headers
- [ ] HTTPS enforced
- [ ] Security headers configured
  ```javascript
  // Add to server.js if not already present
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
  ```
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation active

---

### ✅ Phase 4: Testing

#### 4.1 Unit Testing
- [ ] API endpoints tested
  ```bash
  # Test health endpoint
  curl https://your-domain.com/api/health
  
  # Test bookings endpoint
  curl https://your-domain.com/api/bookings \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```

#### 4.2 Integration Testing
- [ ] Complete booking flow tested:
  1. [ ] Create booking (public)
  2. [ ] Check booking status (public)
  3. [ ] Admin confirms booking
  4. [ ] Notification created automatically
  5. [ ] User receives notification
  6. [ ] Reschedule booking
  7. [ ] Download PDF receipt

#### 4.3 UI Testing
- [ ] Public site tested on:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Mobile browsers
- [ ] Admin panel tested on:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
- [ ] Responsive design verified:
  - [ ] Mobile (320px - 767px)
  - [ ] Tablet (768px - 1023px)
  - [ ] Desktop (1024px+)

#### 4.4 Performance Testing
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Database queries optimized
- [ ] Images optimized and compressed
- [ ] No memory leaks in auto-refresh

#### 4.5 Security Testing
- [ ] SQL injection attempts blocked
- [ ] XSS attacks prevented
- [ ] CSRF protection active
- [ ] Rate limiting working
- [ ] Authentication working
- [ ] Authorization working

---

### ✅ Phase 5: Hosting Setup

#### 5.1 Choose Hosting Platform
Select one:
- [ ] **Vercel** (Recommended for Node.js)
- [ ] **Heroku**
- [ ] **Railway**
- [ ] **DigitalOcean**
- [ ] **AWS**
- [ ] **VPS** (Custom setup)

#### 5.2 Vercel Deployment (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add JWT_SECRET
vercel env add NODE_ENV production

# Deploy to production
vercel --prod
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### 5.3 Alternative: VPS Deployment
```bash
# SSH to server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone your-repo-url
cd alracare-clinic-clean

# Install dependencies
npm install --production

# Create .env file
nano .env
# Paste production environment variables

# Start with PM2
pm2 start api/server.js --name alracare
pm2 save
pm2 startup

# Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/alracare
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/alracare /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 5.4 Domain Configuration
- [ ] Domain purchased
- [ ] DNS records configured:
  - [ ] A record: @ → Server IP
  - [ ] A record: www → Server IP
  - [ ] CNAME record (if using Vercel): @ → cname.vercel-dns.com
- [ ] SSL certificate installed
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS

---

### ✅ Phase 6: Post-Deployment Verification

#### 6.1 Smoke Tests
- [ ] Homepage loads
  ```bash
  curl -I https://yourdomain.com
  # Expected: 200 OK
  ```
- [ ] API health check passes
  ```bash
  curl https://yourdomain.com/api/health
  # Expected: {"status":"ok","timestamp":"..."}
  ```
- [ ] Admin login works
- [ ] Public booking works
- [ ] Notifications work

#### 6.2 Functional Tests
Run through complete user journeys:

**Journey 1: New Booking**
- [ ] User visits public site
- [ ] User fills booking form
- [ ] Booking created successfully
- [ ] Booking ID displayed
- [ ] Confirmation shown

**Journey 2: Check Status**
- [ ] User enters booking ID
- [ ] Status displayed correctly
- [ ] Timeline shows current status
- [ ] Actions available (reschedule, download)

**Journey 3: Admin Workflow**
- [ ] Admin logs in
- [ ] Dashboard shows statistics
- [ ] Admin sees new booking
- [ ] Admin confirms booking
- [ ] Notification created automatically

**Journey 4: Notification Center**
- [ ] User enters phone number
- [ ] Notifications displayed
- [ ] Badge shows unread count
- [ ] Mark as read works
- [ ] Auto-refresh works

#### 6.3 Performance Verification
- [ ] Run Lighthouse audit (score > 80)
  ```bash
  # Install Lighthouse
  npm install -g lighthouse
  
  # Run audit
  lighthouse https://yourdomain.com --view
  ```
- [ ] Check page load times
- [ ] Monitor API response times
- [ ] Verify database query performance

#### 6.4 Security Verification
- [ ] SSL certificate valid
  ```bash
  openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
  ```
- [ ] Security headers present
  ```bash
  curl -I https://yourdomain.com
  # Check for: X-Frame-Options, X-Content-Type-Options, etc.
  ```
- [ ] No sensitive data exposed
- [ ] Rate limiting working
  ```bash
  # Make 100+ requests rapidly
  for i in {1..150}; do curl https://yourdomain.com/api/bookings; done
  # Should get 429 Too Many Requests
  ```

---

### ✅ Phase 7: Monitoring & Logging

#### 7.1 Error Monitoring
- [ ] Setup error tracking (Sentry, LogRocket, etc.)
  ```bash
  npm install @sentry/node
  ```
  ```javascript
  // Add to server.js
  const Sentry = require("@sentry/node");
  Sentry.init({ dsn: "your-sentry-dsn" });
  ```

#### 7.2 Application Monitoring
- [ ] Setup uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure alerts for downtime
- [ ] Monitor API response times
- [ ] Track error rates

#### 7.3 Analytics
- [ ] Google Analytics installed (optional)
- [ ] Track key metrics:
  - [ ] Total bookings per day
  - [ ] Conversion rate
  - [ ] Popular services
  - [ ] User engagement

#### 7.4 Logging
- [ ] Application logs configured
- [ ] Log rotation setup
- [ ] Error logs monitored
- [ ] Access logs enabled

---

### ✅ Phase 8: Documentation

#### 8.1 User Documentation
- [ ] User guide updated (PANDUAN_PENGGUNAAN.md)
- [ ] Admin guide available
- [ ] FAQ created
- [ ] Video tutorials (optional)

#### 8.2 Technical Documentation
- [ ] API documentation complete
- [ ] Database schema documented
- [ ] Architecture diagram created
- [ ] Deployment guide updated

#### 8.3 Operational Documentation
- [ ] Runbook created
- [ ] Incident response plan
- [ ] Backup and recovery procedures
- [ ] Maintenance schedule

---

### ✅ Phase 9: Backup & Recovery

#### 9.1 Database Backup
- [ ] Automated backups configured (Supabase)
- [ ] Backup frequency: Daily
- [ ] Backup retention: 30 days
- [ ] Test restore procedure
  ```sql
  -- Test backup restore
  -- 1. Create test backup
  -- 2. Restore to test environment
  -- 3. Verify data integrity
  ```

#### 9.2 Code Backup
- [ ] Code in version control (Git)
- [ ] Production branch protected
- [ ] Tagged releases
- [ ] Backup repository (GitHub, GitLab)

#### 9.3 Recovery Plan
- [ ] Recovery Time Objective (RTO): < 1 hour
- [ ] Recovery Point Objective (RPO): < 24 hours
- [ ] Disaster recovery plan documented
- [ ] Team trained on recovery procedures

---

### ✅ Phase 10: Go-Live

#### 10.1 Final Checks
- [ ] All checklist items completed
- [ ] Stakeholders notified
- [ ] Support team ready
- [ ] Rollback plan prepared

#### 10.2 Launch
- [ ] Switch DNS to production
- [ ] Monitor for issues (first 24 hours)
- [ ] Be ready for hotfixes
- [ ] Communicate with users

#### 10.3 Post-Launch
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Plan first maintenance window

---

## 📊 DEPLOYMENT METRICS

### Success Criteria
- [ ] Uptime > 99.9%
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Error rate < 0.1%
- [ ] User satisfaction > 4.5/5

### Key Performance Indicators (KPIs)
- Total bookings per day
- Conversion rate (visitors → bookings)
- Average response time
- Error rate
- User retention rate

---

## 🚨 ROLLBACK PLAN

### When to Rollback
- Critical bugs affecting core functionality
- Security vulnerabilities discovered
- Performance degradation > 50%
- Data corruption or loss

### Rollback Procedure
1. **Immediate Actions**
   ```bash
   # Vercel
   vercel rollback
   
   # PM2
   pm2 stop alracare
   git checkout previous-tag
   npm install
   pm2 start api/server.js
   ```

2. **Database Rollback** (if needed)
   ```sql
   -- Restore from backup
   -- Contact Supabase support if needed
   ```

3. **Communication**
   - Notify users of temporary issues
   - Update status page
   - Inform stakeholders

4. **Post-Rollback**
   - Identify root cause
   - Fix issues in development
   - Test thoroughly
   - Redeploy when ready

---

## 📅 MAINTENANCE SCHEDULE

### Daily
- [ ] Monitor error logs
- [ ] Check uptime status
- [ ] Review user feedback

### Weekly
- [ ] Review performance metrics
- [ ] Check database size
- [ ] Update dependencies (if needed)
- [ ] Backup verification

### Monthly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Dependency updates
- [ ] Database cleanup (old notifications)
  ```sql
  SELECT cleanup_old_notifications();
  ```

### Quarterly
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Disaster recovery drill
- [ ] Documentation review

---

## 📞 SUPPORT CONTACTS

### Technical Support
- **Developer**: rahmadramadhanaswin@gmail.com
- **Phone**: 0813-8122-3811
- **Response Time**: 24 hours (critical), 48 hours (normal)

### Infrastructure
- **Hosting Provider**: [Provider Name]
- **Support**: [Support Contact]
- **Database (Supabase)**: support@supabase.com

### Emergency Contacts
- **On-Call Developer**: [Phone Number]
- **System Administrator**: [Phone Number]
- **Business Owner**: [Phone Number]

---

## ✅ SIGN-OFF

### Deployment Team
- [ ] **Developer**: _________________ Date: _______
- [ ] **QA Lead**: _________________ Date: _______
- [ ] **DevOps**: _________________ Date: _______
- [ ] **Project Manager**: _________________ Date: _______

### Stakeholders
- [ ] **Business Owner**: _________________ Date: _______
- [ ] **Clinic Manager**: _________________ Date: _______

---

## 📝 NOTES

**Deployment Date**: _________________  
**Deployment Time**: _________________  
**Deployed By**: _________________  
**Deployment Method**: _________________  

**Issues Encountered**:
- None / [List any issues]

**Resolutions**:
- N/A / [List resolutions]

**Additional Notes**:
- [Any additional notes or observations]

---

**🎉 DEPLOYMENT COMPLETE! 🎉**

Remember to:
- Monitor the system closely for the first 24-48 hours
- Be ready to respond to any issues quickly
- Gather user feedback
- Plan for continuous improvement

**Next Review Date**: [Date + 30 days]

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Maintained By**: Development Team