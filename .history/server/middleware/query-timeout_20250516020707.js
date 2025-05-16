/**
 * Query timeout middleware
 * Provides middleware to handle database query timeouts
 */

const { knex } = require('../../server');
const dbMonitor = require('../utils/db-monitor');
const dbHealth = require('../utils/db-health');

/**
 * Create a middleware that adds query timeout handling
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Function} Express middleware
 */
const queryTimeoutMiddleware = (timeout = 30000) => {
  return (req, res, next) => {
    // Store original query method
    const originalQuery = knex.client.query;
    
    // Override query method with timeout
    knex.client.query = (...args) => {
      // Create a promise that resolves with the query result
      const queryPromise = originalQuery.apply(knex.client, args);
      
      // Create a promise that rejects after the timeout
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          
          // Log pool status on timeout
          const poolStatus = dbMonitor.getPoolStatus();
          console.error('Query timeout detected', {
            query: args[0],
            timeout,
            poolStatus
          });
          
          // Trigger health check on timeout
          dbHealth.checkHealth().catch(console.error);
          
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
      knex.client.query = originalQuery;
    });
  };
};

/**
 * Create a middleware that adds transaction timeout handling
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Function} Express middleware
 */
const transactionTimeoutMiddleware = (timeout = 60000) => {
  return (req, res, next) => {
    // Store original transaction method
    const originalTransaction = knex.transaction;
    
    // Override transaction method with timeout
    knex.transaction = (...args) => {
      // Get transaction options
      const options = args[0] || {};
      
      // Add timeout to options
      const newOptions = {
        ...options,
        timeout
      };
      
      // Call original transaction method with new options
      return originalTransaction.call(knex, newOptions);
    };
    
    // Continue to next middleware
    next();
    
    // Restore original transaction method after request is complete
    res.on('finish', () => {
      knex.transaction = originalTransaction;
    });
  };
};

module.exports = {
  queryTimeoutMiddleware,
  transactionTimeoutMiddleware
};
