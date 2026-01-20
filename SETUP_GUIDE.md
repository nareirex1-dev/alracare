# Alracare Clinic - Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- npm or pnpm
- Supabase account
- Git (optional)

## Installation Steps

### 1. Clone or Download the Project

```bash
git clone <repository-url>
cd alracare-clinic-clean
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Environment Configuration

1. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

2. Fill in the required environment variables in `.env`:

**Required Variables:**
- `SUPABASE_URL`: Your Supabase project URL (from Supabase dashboard)
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key (from Supabase dashboard)
- `JWT_SECRET`: A secure random string (minimum 32 characters)
  - Generate using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `NODE_ENV`: Set to `development` for local, `production` for deployment
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS

**Example:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `database/database.sql`
4. Verify that all tables and functions are created

### 5. Update Admin Password

**IMPORTANT:** Change the default admin password immediately!

1. After running the database script, log in to the admin panel
2. Navigate to Settings
3. Change the password from `admin123` to a secure password

### 6. Run the Application

**Development Mode:**
```bash
npm run dev
# or
pnpm dev
```

**Production Mode:**
```bash
npm start
# or
pnpm start
```

The application will be available at `http://localhost:3000`

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env`

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `NODE_ENV=production`
- `ALLOWED_ORIGINS` (your production domain)

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong JWT_SECRET (minimum 32 characters)
- [ ] Configured ALLOWED_ORIGINS for production
- [ ] Enabled HTTPS for production
- [ ] Set up database backups in Supabase
- [ ] Reviewed and tested all API endpoints
- [ ] Enabled Row Level Security (RLS) in Supabase
- [ ] Set up monitoring and logging

## Troubleshooting

### Common Issues

**1. "JWT_SECRET must be defined" error**
- Make sure `.env` file exists and contains `JWT_SECRET`
- Restart the server after adding environment variables

**2. CORS errors**
- Check `ALLOWED_ORIGINS` includes your frontend URL
- Verify the origin matches exactly (including protocol and port)

**3. Database connection errors**
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check Supabase project is active and accessible

**4. Booking creation fails**
- Verify all required fields are filled
- Check phone number format (08xxxxxxxxxx)
- Ensure appointment date is not in the past

**5. Images not loading**
- Check image URLs are accessible
- Verify CORS settings allow image loading
- Clear browser cache

## API Endpoints

### Public Endpoints
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/phone/:phone` - Get bookings by phone

### Protected Endpoints (Require Authentication)
- `GET /api/bookings` - Get all bookings (admin)
- `PATCH /api/bookings/:id/status` - Update booking status (admin)
- `PUT /api/bookings/:id` - Update booking (admin)
- `DELETE /api/bookings/:id` - Delete booking (admin)

## Support

For issues or questions:
1. Check this setup guide
2. Review error logs in console
3. Check Supabase logs
4. Contact support team

## License

[Your License Here]