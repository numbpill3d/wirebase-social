/**
 * Performance optimization utilities for Wirebase
 */
// Try to load compression module, fallback to a simple middleware if not available
const logger = require('./logger');
let compression;
try {
  compression = require('compression');
} catch (err) {
  logger.warn('Compression module not found, using fallback implementation');
  // Simple fallback implementation
  compression = () => (req, res, next) => next();
  compression.filter = () => true;
}

// Try to load node-cache module, fallback to a simple cache implementation if not available
let NodeCache;
try {
  NodeCache = require('node-cache');
} catch (err) {
  logger.warn('NodeCache module not found, using fallback implementation');
  // Simple fallback implementation
  NodeCache = class SimpleCache {
    constructor(options = {}) {
      this.cache = new Map();
      this.stdTTL = options.stdTTL || 0;
      this.checkperiod = options.checkperiod || 0;

      if (this.checkperiod > 0) {
        this.cleanupTimer = setInterval(() => {
          const now = Date.now();
          for (const [key, entry] of this.cache.entries()) {
            if (entry.expires && now > entry.expires) {
              this.cache.delete(key);
            }
          }
        }, this.checkperiod * 1000);
      }
    }

    set(key, value, ttl) {
      const effectiveTtl = ttl !== undefined ? ttl : this.stdTTL;
      this.cache.set(key, {
        value,
        expires: effectiveTtl ? Date.now() + (effectiveTtl * 1000) : null
      });
      return true;
    }

    get(key) {
      const item = this.cache.get(key);
      if (!item) {
        return undefined;
      }

      if (item.expires && Date.now() > item.expires) {
        this.cache.delete(key);
        return undefined;
      }

      return item.value;
    }

    del(key) {
      return this.cache.delete(key);
    }

    keys() {
      return Array.from(this.cache.keys());
    }

    close() {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }
    }
  };
}

// Create a cache instance
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false // Don't clone objects when storing/retrieving (for better performance)
});

/**
 * Compression middleware with enhanced settings
 */
const compressionMiddleware = compression({
  level: 6, // Compression level (0-9, where 9 is best compression but slowest)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress responses for older browsers without proper support
    if (req.headers['user-agent'] &&
        req.headers['user-agent'].includes('MSIE 6')) {
      return false;
    }

    // Use compression for all other requests
    return compression.filter(req, res);
  }
});

/**
 * Cache middleware for API responses
 * @param {number} duration - Cache duration in seconds
 */
const apiCache = (duration = 60) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests or authenticated routes
    if (req.method !== 'GET' || req.isAuthenticated()) {
      return next();
    }

    const key = `api:${req.originalUrl}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    // Store the original json method
    const originalJson = res.json;

    // Override the json method
    res.json = function(data) {
      // Store in cache
      cache.set(key, data, duration);

      // Set cache header
      res.set('X-Cache', 'MISS');

      // Call the original method
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Clear cache for specific patterns
 * @param {string|RegExp} pattern - Pattern to match cache keys
 */
const clearCache = (pattern) => {
  const keys = cache.keys();
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);

  keys.forEach(key => {
    if (regex.test(key)) {
      cache.del(key);
    }
  });
};

/**
 * Resource hints middleware to add preload/prefetch headers
 */
const resourceHints = (req, res, next) => {
  // Common assets to preload
  const criticalAssets = [
    { url: '/css/styles.css', as: 'style' },
    { url: '/css/accessibility.css', as: 'style' },
    { url: '/js/main.js', as: 'script' },
    { url: '/fonts/gothic-pixels.woff2', as: 'font', crossorigin: 'anonymous' }
  ];

  // Add Link headers for resource hints
  const linkHeaders = criticalAssets.map(asset => {
    let header = `<${asset.url}>; rel=preload; as=${asset.as}`;
    if (asset.crossorigin) {
      header += `; crossorigin=${asset.crossorigin}`;
    }
    return header;
  });

  if (linkHeaders.length > 0) {
    res.setHeader('Link', linkHeaders.join(', '));
  }

  next();
};

/**
 * Middleware to set appropriate cache control headers
 */
const cacheControl = (req, res, next) => {
  // Static assets can be cached longer
  if (req.path.match(/\.(css|js|jpg|jpeg|png|gif|ico|woff2|svg)$/i)) {
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
  } else {
    // HTML responses should revalidate
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  }

  next();
};

module.exports = {
  compressionMiddleware,
  apiCache,
  clearCache,
  resourceHints,
  cacheControl,
  cache
};
