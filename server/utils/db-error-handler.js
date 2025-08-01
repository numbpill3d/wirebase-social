/**
 * Database error handler utility
 * Provides functions to handle and log database errors
 */

const dbMonitor = require('./db-monitor');
const dbHealth = require('./db-health');
const logger = require('./logger');

// Store knex instance to avoid circular dependency
let knexInstance = null;

// Track error statistics
let errorStats = {
  totalErrors: 0,
  connectionErrors: 0,
  queryErrors: 0,
  timeoutErrors: 0,
  transactionErrors: 0,
  otherErrors: 0,
  errorsByCode: {},
  lastError: null,
  lastErrorTime: null
};

/**
 * Handle database error
 * @param {Error} error - Database error
 * @param {string} context - Error context
 * @returns {Error} Original error with additional context
 */
const handleError = async (error, context = 'unknown') => {
  // Update error statistics
  errorStats.totalErrors++;
  errorStats.lastError = error;
  errorStats.lastErrorTime = new Date();

  // Categorize error
  if (error.message.includes('timeout') || error.message.includes('Timeout')) {
    errorStats.timeoutErrors++;
  } else if (error.message.includes('connection') || error.message.includes('Connection')) {
    errorStats.connectionErrors++;
  } else if (error.message.includes('transaction') || error.message.includes('Transaction')) {
    errorStats.transactionErrors++;
  } else if (error.message.includes('query') || error.message.includes('Query')) {
    errorStats.queryErrors++;
  } else {
    errorStats.otherErrors++;
  }

  // Track errors by code
  const errorCode = error.code || 'UNKNOWN';
  errorStats.errorsByCode[errorCode] = (errorStats.errorsByCode[errorCode] || 0) + 1;

  // Get pool status - use stored knex instance or fallback to global
  const kInstance = knexInstance || global.knex;

  if (!kInstance) {
    logger.warn('WARN: No knex instance available for error handling');
    return error;
  }

  const poolStatus = dbMonitor.getPoolStatus(kInstance);

  // Log error with context and pool status
  logger.error(`Database error in ${context}:`, {
    message: error.message,
    code: errorCode,
    stack: error.stack,
    poolStatus
  });

  // Check database health on connection errors
  if (errorStats.connectionErrors > 0 && errorStats.connectionErrors % 5 === 0) {
    logger.info('Triggering health check due to connection errors');
    dbHealth.checkHealth(kInstance).catch((err) => logger.error(err));
  }

  // Add context to error
  error.context = context;
  error.poolStatus = poolStatus;

  return error;
};

/**
 * Get error statistics
 * @returns {Object} Error statistics
 */
const getErrorStats = (knex = null) => {
  const kInstance = knex || knexInstance || global.knex;

  if (!kInstance) {
    logger.warn('WARN: No knex instance available for error statistics');
    return { ...errorStats, poolStatus: null };
  }

  return {
    ...errorStats,
    poolStatus: dbMonitor.getPoolStatus(kInstance)
  };
};

/**
 * Reset error statistics
 */
const resetErrorStats = () => {
  errorStats = {
    totalErrors: 0,
    connectionErrors: 0,
    queryErrors: 0,
    timeoutErrors: 0,
    transactionErrors: 0,
    otherErrors: 0,
    errorsByCode: {},
    lastError: null,
    lastErrorTime: null
  };
};

/**
 * Create middleware to handle database errors
 * @returns {Function} Express middleware
 */
const errorHandlerMiddleware = () => {
  return (err, req, res, next) => {
    // Check if error is a database error
    if (err && (
      err.code === 'ECONNREFUSED' ||
      err.code === 'ETIMEDOUT' ||
      err.code === '08006' ||
      err.code === '08001' ||
      err.code === '57P01' ||
      err.message.includes('database') ||
      err.message.includes('Database') ||
      err.message.includes('connection') ||
      err.message.includes('Connection') ||
      err.message.includes('knex') ||
      err.message.includes('Knex')
    )) {
      // Handle database error
      handleError(err, `${req.method} ${req.path}`);

      // Send appropriate response
      return res.status(503).json({
        error: 'Database error',
        message: 'A database error occurred. Please try again later.'
      });
    }

    // Pass to next error handler
    next(err);
  };
};

/**
 * Initialize the error handler with a knex instance
 * @param {Object} knex - The knex instance to use
 */
const initialize = (knex) => {
  if (knex) {
    knexInstance = knex;
    logger.info('Database error handler initialized with knex instance');
  }
};

module.exports = {
  handleError,
  getErrorStats,
  resetErrorStats,
  errorHandlerMiddleware,
  initialize
};
