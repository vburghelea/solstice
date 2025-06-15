/**
 * Security configuration for the application
 * Centralizes all security-related settings
 */

export const securityConfig = {
  // Cookie settings for Better Auth
  cookies: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    httpOnly: true,
    path: "/",
    // Set domain only in production
    ...(process.env.NODE_ENV === "production" && process.env.COOKIE_DOMAIN
      ? { domain: process.env.COOKIE_DOMAIN }
      : {}),
  },

  // Session configuration
  session: {
    // 7 days in seconds
    maxAge: 7 * 24 * 60 * 60,
    // Update session if it expires in less than 1 day
    updateAge: 24 * 60 * 60,
    // Enable cookie caching for performance
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // CORS configuration
  cors: {
    origin: process.env.VITE_BASE_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },

  // Rate limiting configuration
  rateLimit: {
    // Auth endpoints
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 requests per window
      message: "Too many authentication attempts, please try again later.",
    },
    // API endpoints
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: "Too many requests, please try again later.",
    },
  },

  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  // OAuth providers allowed domains
  oauth: {
    allowedDomains: process.env.OAUTH_ALLOWED_DOMAINS?.split(",") || [],
  },
} as const;

// Type exports
export type SecurityConfig = typeof securityConfig;
export type CookieConfig = typeof securityConfig.cookies;
export type SessionConfig = typeof securityConfig.session;
