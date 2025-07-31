/**
 * Query timeout middleware
 * Provides middleware to handle database query timeouts
 */

// Break circular dependency by removing direct import
const dbMonitor = require('../utils/db-monitor');
const dbHealth = require('../utils/db-health');
const logger = require('../utils/logger');

logger.info('Query timeout middleware loaded');

/**
 * Create a middleware that adds query timeout handling
 * @param {Object} knexInstance - The knex instance to use
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Function} Express middleware
 */
const queryTimeoutMiddleware = (knexInstance, timeout = 30000) => {
  if (!knexInstance) {
    logger.error('ERROR: knexInstance not provided to queryTimeoutMiddleware');
    return (req, res, next) => next();
  }

  logger.debug('Creating query timeout middleware with knex:', knexInstance ? 'defined' : 'undefined');
  logger.debug('knex.client:', knexInstance?.client ? 'defined' : 'undefined');

  return (req, res, next) => {
    if (!knexInstance || typeof knexInstance.raw !== 'function') {
      logger.error('ERROR: Invalid knex instance or knex.raw is undefined in query timeout middleware execution');
      return next();
    }

    const originalRaw = knexInstance.raw.bind(knexInstance);

    knexInstance.raw = (...args) => {
      const queryBuilder = originalRaw(...args);

      if (typeof queryBuilder.timeout === 'function') {
        queryBuilder.timeout(timeout, { cancel: true });
      }

      const queryPromise = Promise.resolve(queryBuilder);

      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          const poolStatus = dbMonitor.getPoolStatus(knexInstance);
          logger.error('Query timeout detected', {
            query: args[0],
            timeout,
            poolStatus
          });

          dbHealth.checkHealth(knexInstance).catch((err) => logger.error(err));
          reject(new Error(`Query timeout after ${timeout}ms`));
        }, timeout);

        queryPromise.finally(() => clearTimeout(id));
      });

      return Promise.race([queryPromise, timeoutPromise]);
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
    logger.error('ERROR: knexInstance not provided to transactionTimeoutMiddleware');
    return (req, res, next) => next();
  }

  return (req, res, next) => {
    const originalTransaction = knexInstance.transaction;

    knexInstance.transaction = (...args) => {
      const options = args[0] || {};
      const newOptions = {
        ...options,
        timeout
      };

      return originalTransaction.call(knexInstance, newOptions);
    };

    next();

    res.on('finish', () => {
      knexInstance.transaction = originalTransaction;
    });
  };
};

module.exports = {
  queryTimeoutMiddleware,
  transactionTimeoutMiddleware
};
