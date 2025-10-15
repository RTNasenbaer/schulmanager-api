import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application Configuration
 * Zentrale Konfiguration für die gesamte Anwendung
 */
export const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Schulmanager Configuration
  schulmanager: {
    baseUrl: process.env.SCHULMANAGER_BASE_URL || 'https://www.schulmanager-online.de',
    loginUrl: process.env.SCHULMANAGER_LOGIN_URL || 'https://login.schulmanager-online.de/',
    email: process.env.SCHULMANAGER_EMAIL || '',
    password: process.env.SCHULMANAGER_PASSWORD || '',
    timeout: 30000, // 30 Sekunden
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiry: process.env.JWT_EXPIRY || '24h',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // API Security
  api: {
    key: process.env.API_KEY || 'nVDlr2QzHS7qZN4sjo8mfBGpEXxvIyKP',
  },

  // Caching Configuration
  cache: {
    ttl: {
      timetable: parseInt(process.env.CACHE_TTL_TIMETABLE || '21600', 10),
      substitutions: parseInt(process.env.CACHE_TTL_SUBSTITUTIONS || '1800', 10),
      userData: parseInt(process.env.CACHE_TTL_USER_DATA || '3600', 10),
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Encryption
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
} as const;

/**
 * Validate required environment variables
 */
export function validateConfig(): void {
  const required = [
    'JWT_SECRET',
    'API_KEY',
    'ENCRYPTION_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0 && config.server.isProduction) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('');
    console.error('Please set these in Render Dashboard:');
    console.error('   1. Go to your service → Environment');
    console.error('   2. Add these secret variables:');
    missing.forEach(key => {
      console.error(`      - ${key}=your-secret-value`);
    });
    console.error('');
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Set them in Render Dashboard → Environment tab'
    );
  }

  if (missing.length > 0) {
    console.warn(
      `⚠️  Warning: Using default values for: ${missing.join(', ')}\n` +
      'Please set these in your .env file for production.'
    );
  }

  // Warn about Schulmanager credentials
  if (!config.schulmanager.email || !config.schulmanager.password) {
    console.warn('⚠️  Warning: Schulmanager credentials not set!');
    console.warn('   Set SCHULMANAGER_EMAIL and SCHULMANAGER_PASSWORD in .env');
    console.warn('   Scraping functionality will not work without these.');
  }
}
