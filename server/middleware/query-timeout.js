/**
 * Query timeout middleware
 * Provides middleware to handle database query timeouts
 */

// Break circular dependency by removing direct import
const dbMonitor = require('../utils/db-monitor');
const dbHealth = require('../utils/db-health');

console.log('Query timeout middleware loaded');

/**
 * Create a middleware that adds query timeout handling
 * @param {Object} knexInstance - The knex instance to use
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Function} Express middleware
 */
const queryTimeoutMiddleware = (knexInstance, timeout = 30000) => {
  if (!knexInstance) {
    console.error('ERROR: knexInstance not provided to queryTimeoutMiddleware');
    // Return a dummy middleware that just calls next()
    return (req, res, next) => next();
  }

  console.log('Creating query timeout middleware with knex:', knexInstance ? 'defined' : 'undefined');
  console.log('knex.client:', knexInstance?.client ? 'defined' : 'undefined');

  return (req, res, next) => {
    if (!knexInstance || typeof knexInstance.raw !== 'function') {
      console.error('ERROR: Invalid knex instance in query timeout middleware execution');
      return next();
    }

    // Store original raw method
    const originalRaw = knexInstance.raw.bind(knexInstance);

    // Override raw method with timeout wrapper
    knexInstance.raw = (...args) => {
      const query = originalRaw(...args).timeout(timeout, { cancel: true });

      // Promise that rejects after the timeout period
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);

          const poolStatus = dbMonitor.getPoolStatus(knexInstance);
          console.error('Query timeout detected', {
            query: args[0],
            timeout,
            poolStatus
          });

          dbHealth.checkHealth(knexInstance).catch(console.error);

          reject(new Error(`Query timeout after ${timeout}ms`));
        }, timeout);

        query
          .then(() => clearTimeout(id))
          .catch(() => clearTimeout(id));
      });

      return Promise.race([query, timeoutPromise]);
    };

    next();

    res.on('finish', () => {
      knexInstance.raw = originalRaw;
    });
  };
};

/**
 * Create a middleware that adds transaction timeout handling
 * @param {Object} knexInstance - The knex instance to use
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Function} Express middleware
 */
const transactionTimeoutMiddleware = (knexInstance, timeout = 60000) => {
  if (!knexInstance) {
    console.error('ERROR: knexInstance not provided to transactionTimeoutMiddleware');
    // Return a dummy middleware that just calls next()
    return (req, res, next) => next();
  }

  return (req, res, next) => {
    // Store original transaction method
    const originalTransaction = knexInstance.transaction;

    // Override transaction method with timeout
    knexInstance.transaction = (...args) => {
      // Get transaction options
      const options = args[0] || {};

      // Add timeout to options
      const newOptions = {
        ...options,
        timeout
      };

      // Call original transaction method with new options
      return originalTransaction.call(knexInstance, newOptions);
    };

    // Continue to next middleware
    next();

    // Restore original transaction method after request is complete
    res.on('finish', () => {
      knexInstance.transaction = originalTransaction;
    });
  };
};

module.exports = {
  queryTimeoutMiddleware,
  transactionTimeoutMiddleware
};
