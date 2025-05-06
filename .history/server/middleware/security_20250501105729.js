const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const crypto = require('crypto');

const securityMiddleware = {
  // Rate limiting
  rateLimiter: rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW || 900000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: {
      error: 'Too many spells cast from this location. Please wait before trying again.'
    }
  }),

  // Content Security Policy with nonce for inline scripts
  cspMiddleware: (req, res, next) => {
    // Generate a random nonce for inline scripts
    const nonce = crypto.randomBytes(16).toString('base64');
    res.locals.nonce = nonce;
    
    // Set CSP headers with nonce
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", `'nonce-${nonce}'`],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", process.env.SUPABASE_URL],
          fontSrc: ["'self'", "data:", "https:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"]
        }
      }
    })(req, res, next);
  },

  // XSS Protection
  xssProtection: xss(),

  // Custom headers
  customHeaders: (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  }
};

module.exports = securityMiddleware;
