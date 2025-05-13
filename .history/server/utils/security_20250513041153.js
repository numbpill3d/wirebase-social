/**
 * Enhanced security utilities for Wirebase
 */
// Try to load helmet module, fallback to a simple middleware if not available
let helmet;
try {
  helmet = require('helmet');
} catch (err) {
  console.warn('Helmet module not found, using fallback implementation');
  // Simple fallback implementation
  helmet = (config) => (req, res, next) => {
    // Set some basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  };
}
// Try to load rate-limit module, fallback to a simple middleware if not available
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (err) {
  console.warn('Express-rate-limit module not found, using fallback implementation');
  // Simple fallback implementation
  rateLimit = (config) => (req, res, next) => next();
}

// Try to load xss-clean module, fallback to a simple middleware if not available
let xss;
try {
  xss = require('xss-clean');
} catch (err) {
  console.warn('XSS-clean module not found, using fallback implementation');
  // Simple fallback implementation
  xss = () => (req, res, next) => next();
}
const crypto = require('crypto');

/**
 * Enhanced Content Security Policy configuration
 */
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.SUPABASE_URL],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"]
    }
  },
  // Enable other security headers
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: 15552000, // 180 days in seconds
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  }
};

/**
 * Rate limiting configuration
 */
const rateLimiterConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  // Skip rate limiting for trusted IPs
  skip: (req) => {
    const trustedIps = (process.env.TRUSTED_IPS || '').split(',');
    return trustedIps.includes(req.ip);
  }
};

/**
 * Generate a secure random token
 * @param {number} length - Length of the token
 * @returns {string} - Random token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a password securely
 * @param {string} password - Password to hash
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  const bcrypt = require('bcrypt');
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Verify a password against a hash
 * @param {string} password - Password to verify
 * @param {string} hash - Hash to verify against
 * @returns {Promise<boolean>} - Whether the password matches
 */
const verifyPassword = async (password, hash) => {
  const bcrypt = require('bcrypt');
  return await bcrypt.compare(password, hash);
};

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  const xss = require('xss');
  return xss(input);
};

/**
 * Middleware to validate and sanitize request parameters
 * @param {Object} schema - Joi schema for validation
 * @returns {Function} - Express middleware
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (error) {
      return res.status(400).render('error', {
        title: 'Validation Error',
        errorCode: 400,
        message: error.details.map(x => x.message).join(', '),
        theme: 'broken-scroll'
      });
    }

    // Replace request values with validated and sanitized values
    req.body = value.body;
    req.query = value.query;
    req.params = value.params;

    next();
  };
};

/**
 * Middleware to ensure user is authenticated
 */
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  req.session.returnTo = req.originalUrl;
  res.redirect('/users/login');
};

/**
 * Middleware to ensure user has required role
 * @param {string|string[]} roles - Required role(s)
 */
const ensureRole = (roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      req.session.returnTo = req.originalUrl;
      return res.redirect('/users/login');
    }

    const userRole = req.user.role || 'user';
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    if (requiredRoles.includes(userRole) || userRole === 'admin') {
      return next();
    }

    res.status(403).render('error', {
      title: 'Access Denied',
      errorCode: 403,
      message: 'You do not have permission to access this resource.',
      theme: 'locked-dungeon'
    });
  };
};

module.exports = {
  helmetMiddleware: helmet(helmetConfig),
  rateLimiter: rateLimit(rateLimiterConfig),
  xssMiddleware: xss(),
  generateSecureToken,
  hashPassword,
  verifyPassword,
  sanitizeInput,
  validateRequest,
  ensureAuthenticated,
  ensureRole
};
