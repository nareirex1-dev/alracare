# Deployment Guide - Alra Care

Panduan lengkap untuk deploy Alra Care Clinic Management System ke production.

## 📋 Prerequisites

- Node.js 14+ installed
- Supabase account (free tier OK)
- Domain name (optional, bisa pakai subdomain gratis)
- Git installed

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign up / Login
3. Click "New Project"
4. Fill in:
   - Name: `alracare-clinic`
   - Database Password: (save this!)
   - Region: Southeast Asia (Singapore)
5. Wait for project to be ready (~2 minutes)

### 2. Run Database Schema

1. Go to SQL Editor in Supabase dashboard
2. Click "New Query"
3. Copy entire content from `database/notifications_schema.sql`
4. Paste and click "Run"
5. Verify success (should see "Success. No rows returned")

### 3. Get API Keys

1. Go to Project Settings > API
2. Copy these values:
   - Project URL (SUPABASE_URL)
   - anon public key (SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_KEY)

## 🔐 Environment Setup

### 1. Create .env File

```bash
# Copy example
cp .env.example .env

# Edit with your values
nano .env
```

### 2. Fill Environment Variables

```env
# Server
PORT=3000
NODE_ENV=production

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Admin (for first login)
ADMIN_EMAIL=admin@alracare.com
ADMIN_PASSWORD=change-this-password-immediately
```

**⚠️ IMPORTANT**: 
- Never commit .env to git
- Use strong passwords
- Change default admin password after first login

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login
```bash
vercel login
```

#### Step 3: Deploy
```bash
# From project root
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? alracare-clinic
# - Directory? ./
# - Override settings? No
```

#### Step 4: Set Environment Variables
```bash
# In Vercel dashboard:
# 1. Go to your project
# 2. Settings > Environment Variables
# 3. Add all variables from .env
# 4. Redeploy
```

#### Step 5: Configure Build
Create `vercel.json`:
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
      "dest": "public-site-enhanced.html"
    }
  ]
}
```

### Option 2: Heroku

#### Step 1: Install Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

#### Step 2: Login
```bash
heroku login
```

#### Step 3: Create App
```bash
heroku create alracare-clinic
```

#### Step 4: Set Environment Variables
```bash
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_ANON_KEY=your-key
heroku config:set SUPABASE_SERVICE_KEY=your-key
heroku config:set JWT_SECRET=your-secret
```

#### Step 5: Deploy
```bash
git push heroku main
```

#### Step 6: Open App
```bash
heroku open
```

### Option 3: DigitalOcean App Platform

#### Step 1: Connect GitHub
1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Connect your GitHub repository

#### Step 2: Configure App
- **Name**: alracare-clinic
- **Region**: Singapore
- **Branch**: main
- **Build Command**: `npm install`
- **Run Command**: `npm start`

#### Step 3: Add Environment Variables
Add all variables from .env in the Environment Variables section

#### Step 4: Deploy
Click "Create Resources" and wait for deployment

### Option 4: VPS (Ubuntu)

#### Step 1: Connect to VPS
```bash
ssh root@your-server-ip
```

#### Step 2: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Step 3: Install PM2
```bash
npm install -g pm2
```

#### Step 4: Clone Repository
```bash
cd /var/www
git clone https://github.com/yourusername/alracare-clinic.git
cd alracare-clinic
```

#### Step 5: Install Dependencies
```bash
npm install --production
```

#### Step 6: Create .env
```bash
nano .env
# Paste your environment variables
```

#### Step 7: Start with PM2
```bash
pm2 start api/server.js --name alracare
pm2 save
pm2 startup
```

#### Step 8: Setup Nginx
```bash
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/alracare
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

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

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/alracare /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 9: Setup SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## ✅ Post-Deployment Checklist

### 1. Test API Health
```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Alra Care API is running",
  "timestamp": "2025-01-17T..."
}
```

### 2. Test Public Site
- Visit https://your-domain.com
- Check all sections load
- Test booking form
- Test notification center

### 3. Test Admin Panel
- Visit https://your-domain.com/admin-site.html
- Login with admin credentials
- Check dashboard loads
- Test all admin features

### 4. Test Notifications
- Create a test booking
- Confirm booking (admin)
- Check notification appears in notification center
- Verify auto-notification trigger worked

### 5. Monitor Logs
```bash
# Vercel
vercel logs

# Heroku
heroku logs --tail

# VPS with PM2
pm2 logs alracare
```

## 🔧 Troubleshooting

### Issue: API returns 500 errors
**Solution**: Check environment variables are set correctly

### Issue: Database connection fails
**Solution**: Verify Supabase URL and keys are correct

### Issue: Notifications not working
**Solution**: 
1. Check database triggers are created
2. Verify RLS policies are enabled
3. Check Supabase logs

### Issue: Admin login fails
**Solution**: 
1. Check JWT_SECRET is set
2. Verify admin credentials in database
3. Check browser console for errors

## 📊 Monitoring

### Setup Monitoring (Optional)

#### 1. Uptime Monitoring
Use services like:
- UptimeRobot (free)
- Pingdom
- StatusCake

#### 2. Error Tracking
Use services like:
- Sentry
- Rollbar
- LogRocket

#### 3. Analytics
- Google Analytics
- Plausible
- Umami

## 🔄 Updates & Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart application
pm2 restart alracare  # VPS
# or redeploy on Vercel/Heroku
```

### Database Maintenance
```bash
# Run in Supabase SQL Editor monthly
SELECT cleanup_old_notifications();
```

### Backup Database
```bash
# In Supabase dashboard:
# Database > Backups > Create Backup
```

## 🆘 Support

If you encounter issues:

1. Check logs first
2. Review this guide
3. Check PHASE_PROGRESS.md for known issues
4. Contact: rahmadramadhanaswin@gmail.com

## 🎉 Success!

Your Alra Care system is now live! 🚀

**Next Steps:**
1. Change default admin password
2. Add your clinic's real data
3. Test all features thoroughly
4. Train staff on using the system
5. Announce to customers

---

**Need Help?** Contact support at rahmadramadhanaswin@gmail.com
