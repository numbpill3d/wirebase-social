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
    // Check if knex and knex.client are defined before accessing
    if (!knexInstance || !knexInstance.client) {
      console.error('ERROR: knex or knex.client is undefined in query timeout middleware execution');
      return next();
    }

    // Store original query method
    const originalQuery = knexInstance.client.query;

    // Override query method with timeout
    knexInstance.client.query = (...args) => {
      // Create a promise that resolves with the query result
      const queryPromise = originalQuery.apply(knexInstance.client, args);

      // Create a promise that rejects after the timeout
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);

          // Log pool status on timeout
          const poolStatus = dbMonitor.getPoolStatus(knexInstance);
          console.error('Query timeout detected', {
            query: args[0],
            timeout,
            poolStatus
          });

          // Trigger health check on timeout
          dbHealth.checkHealth(knexInstance).catch(console.error);

          reject(new Error(`Query timeout after ${timeout}ms`));
        }, timeout);

        // Clear timeout if query resolves or rejects
        queryPromise
          .then(() => clearTimeout(id))
          .catch(() => clearTimeout(id));
      });

      // Race the query against the timeout
      return Promise.race([queryPromise, timeoutPromise]);
    };

    // Continue to next middleware
    next();

    // Restore original query method after request is complete
    res.on('finish', () => {
      knexInstance.client.query = originalQuery;
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
