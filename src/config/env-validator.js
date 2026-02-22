/**
 * Environment Variables Validator
 * Validates all required environment variables on application startup
 */

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET',
  'NODE_ENV'
];

const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'PORT',
  'ALLOWED_ORIGINS',
  'COOKIE_DOMAIN',
  'COOKIE_SECURE',
  'JWT_EXPIRATION',
  'RATE_LIMIT_MAX',
  'RATE_LIMIT_WINDOW',
  'LOG_LEVEL'
];

/**
 * Validate environment variables
 * @throws {Error} if required variables are missing
 */
function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
      missing.map(v => `  - ${v}`).join('\n') +
      `\n\nPlease check .env.example for reference.`
    );
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security.\n' +
      'Generate a strong secret with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  // Validate NODE_ENV
  const validEnvs = ['development', 'staging', 'production', 'test'];
  if (!validEnvs.includes(process.env.NODE_ENV)) {
    throw new Error(
      `NODE_ENV must be one of: ${validEnvs.join(', ')}\n` +
      `Current value: ${process.env.NODE_ENV}`
    );
  }

  // Production-specific validations
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS === 'http://localhost:3000') {
      warnings.push('ALLOWED_ORIGINS should be set to your production domain(s) for security');
    }

    if (process.env.COOKIE_SECURE !== 'true') {
      warnings.push('COOKIE_SECURE should be set to true in production (requires HTTPS)');
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      warnings.push('SUPABASE_SERVICE_ROLE_KEY is recommended for admin operations');
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Configuration Warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
    console.warn('');
  }

  // Log success
  console.log('✅ Environment variables validated successfully');
  
  // Log optional missing vars in development
  if (process.env.NODE_ENV === 'development') {
    const missingOptional = optionalEnvVars.filter(v => !process.env[v]);
    if (missingOptional.length > 0) {
      console.log('\nℹ️  Optional environment variables not set:');
      missingOptional.forEach(v => console.log(`   - ${v}`));
      console.log('   (Using default values)\n');
    }
  }
}

/**
 * Get configuration with defaults
 */
function getConfig() {
  return {
    supabase: {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiration: process.env.JWT_EXPIRATION || '24h'
    },
    server: {
      port: parseInt(process.env.PORT) || 3000,
      nodeEnv: process.env.NODE_ENV
    },
    security: {
      allowedOrigins: process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : ['http://localhost:3000'],
      cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',
      cookieSecure: process.env.COOKIE_SECURE === 'true',
      rateLimit: {
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000
      }
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info'
    }
  };
}

module.exports = {
  validateEnv,
  getConfig
};