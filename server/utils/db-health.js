/**
 * Database health check utility
 * Provides functions to check database connection health and perform maintenance
 */

const dbMonitor = require('./db-monitor');

// Store knex instance and config to avoid circular dependency
let knexInstance = null;
let knexConfig = null;

// Track health check status
let healthCheckStatus = {
  lastCheck: null,
  healthy: false,
  error: null,
  responseTime: 0,
  checkCount: 0,
  failCount: 0,
  consecutiveFailures: 0
};

/**
 * Perform a database health check
 * @param {Object} knexInstance - The knex instance to use
 * @returns {Promise<Object>} Health check result
 */
const checkHealth = async (knex = null) => {
  const kInstance = knex || knexInstance || global.knex;

  if (!kInstance || typeof kInstance.raw !== 'function') {
    console.error('ERROR: No valid knex instance available for health check');
    return {
      healthy: false,
      error: 'No valid knex instance available'
    };
  }

  const startTime = Date.now();

  try {
    await kInstance.raw('SELECT 1 as health_check');
    const responseTime = Date.now() - startTime;

    healthCheckStatus = {
      ...healthCheckStatus,
      lastCheck: new Date(),
      healthy: true,
      error: null,
      responseTime,
      checkCount: healthCheckStatus.checkCount + 1,
      consecutiveFailures: 0
    };

    return {
      healthy: true,
      responseTime,
      poolStatus: dbMonitor.getPoolStatus(kInstance)
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    healthCheckStatus = {
      ...healthCheckStatus,
      lastCheck: new Date(),
      healthy: false,
      error: error.message,
      responseTime,
      checkCount: healthCheckStatus.checkCount + 1,
      failCount: healthCheckStatus.failCount + 1,
      consecutiveFailures: healthCheckStatus.consecutiveFailures + 1
    };

    console.error('Database health check failed:', error.message);

    return {
      healthy: false,
      error: error.message,
      responseTime,
      poolStatus: dbMonitor.getPoolStatus(kInstance)
    };
  }
};

/**
 * Get current health status
 * @param {Object} knexInstance - The knex instance to use
 * @returns {Object} Current health status
 */
const getHealthStatus = (knex = null) => {
  const kInstance = knex || knexInstance || global.knex;

  if (!kInstance) {
    console.warn('WARN: No knex instance available to get health status');
    return { ...healthCheckStatus, poolStatus: null };
  }

  return {
    ...healthCheckStatus,
    poolStatus: dbMonitor.getPoolStatus(kInstance)
  };
};

/**
 * Perform database maintenance
 * @param {Object} knexInstance - The knex instance to use
 * @returns {Promise<Object>} Maintenance result
 */
const performMaintenance = async (knex = null) => {
  const kInstance = knex || knexInstance || global.knex;

  if (!kInstance) {
    console.error('ERROR: No knex instance available for maintenance');
    return {
      success: false,
      error: 'No knex instance available'
    };
  }

  try {
    const beforeStatus = dbMonitor.getPoolStatus(kInstance);

    if (healthCheckStatus.consecutiveFailures >= 3) {
      console.log('Performing database pool reset due to consecutive failures');

      if (typeof kInstance.destroy === 'function') {
        await kInstance.destroy();
      } else {
        console.warn('WARN: kInstance.destroy is not a function — skipping destroy');
      }

      if (!knexConfig) {
        throw new Error('Missing knex configuration — cannot recreate pool');
      }

      const newKnex = require('knex')(knexConfig);
      knexInstance = newKnex;
      global.knex = newKnex;

      healthCheckStatus.consecutiveFailures = 0;
      dbMonitor.resetMetrics();
      dbMonitor.setupPoolMonitoring(newKnex);
    }

    const afterStatus = dbMonitor.getPoolStatus(knexInstance);

    return {
      success: true,
      message: 'Maintenance completed successfully',
      before: beforeStatus,
      after: afterStatus
    };
  } catch (error) {
    console.error('Database maintenance failed:', error);

    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Start periodic health checks
 * @param {Object} knexInstance - The knex instance to use
 * @param {number} interval - Check interval in milliseconds
 * @returns {Object} Object containing the timer and a stop function
 */
const startPeriodicHealthChecks = (knex = null, interval = 60000) => {
  const kInstance = knex || knexInstance || global.knex;

  if (!kInstance) {
    console.error('ERROR: No knex instance available for health checks');
    return { timer: null, stop: () => {} };
  }

  if (knex && !knexInstance) {
    knexInstance = knex;
  }

  checkHealth(kInstance);

  const timer = setInterval(async () => {
    const result = await checkHealth(kInstance);

    if (!result.healthy || healthCheckStatus.consecutiveFailures >= 3) {
      await performMaintenance(kInstance);
    }
  }, interval);

  console.log(`Database health checks started (interval: ${interval}ms)`);

  const stop = () => {
    clearInterval(timer);
    console.log('Database health checks stopped');
  };

  return { timer, stop };
};

/**
 * Initialize the health check utility with a knex instance
 * @param {Object} knex - The knex instance to use
 */
const initialize = (knex) => {
  if (knex) {
    knexInstance = knex;
    knexConfig = knex.client.config;
    console.log('Database health check utility initialized with knex instance');
  }
};

module.exports = {
  checkHealth,
  getHealthStatus,
  performMaintenance,
  startPeriodicHealthChecks,
  initialize
};
