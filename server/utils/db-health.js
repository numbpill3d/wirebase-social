/**
 * Database health check utility
 * Provides functions to check database connection health and perform maintenance
 */

// Remove direct import of knex to break circular dependency
const dbMonitor = require('./db-monitor');

// Store knex instance to avoid circular dependency
let knexInstance = null;

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
  // Use provided knex instance, stored instance, or global
  const kInstance = knex || knexInstance || global.knex;

  if (!kInstance) {
    console.error('ERROR: No knex instance available for health check');
    return {
      healthy: false,
      error: 'No knex instance available'
    };
  }

  const startTime = Date.now();

  try {
    // Simple query to check database connectivity
    await kInstance.raw('SELECT 1 as health_check');

    const responseTime = Date.now() - startTime;

    // Update health status
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

    // Update health status
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
    // Get pool status before maintenance
    const beforeStatus = dbMonitor.getPoolStatus(kInstance);

    // Force a pool refresh by destroying and recreating the pool
    if (healthCheckStatus.consecutiveFailures >= 3) {
      console.log('Performing database pool reset due to consecutive failures');

      // Destroy and recreate the pool
      await kInstance.destroy();

      // Recreate knex instance using original configuration
      const newKnex = require('knex')(kInstance.client.config);
      knexInstance = newKnex;
      global.knex = newKnex;

      // Reset health check status
      healthCheckStatus.consecutiveFailures = 0;
      dbMonitor.resetMetrics();
      dbMonitor.setupPoolMonitoring(newKnex);
    }

    // Get pool status after maintenance
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
 * @returns {Object} Timer object
 */
const startPeriodicHealthChecks = (knex = null, interval = 60000) => {
  const kInstance = knex || knexInstance || global.knex;

  if (!kInstance) {
    console.error('ERROR: No knex instance available for health checks');
    return null;
  }

  // Store the instance for future use
  if (knex && !knexInstance) {
    knexInstance = knex;
  }

  // Perform initial health check
  checkHealth(kInstance);

  // Schedule periodic health checks
  const timer = setInterval(async () => {
    const result = await checkHealth(kInstance);

    // Perform maintenance if needed
    if (!result.healthy || healthCheckStatus.consecutiveFailures >= 3) {
      await performMaintenance(kInstance);
    }
  }, interval);

  console.log(`Database health checks started (interval: ${interval}ms)`);

  return timer;
};

/**
 * Initialize the health check utility with a knex instance
 * @param {Object} knex - The knex instance to use
 */
const initialize = (knex) => {
  if (knex) {
    knexInstance = knex;
    console.log('Database health check utility initialized with knex instance');
  }
};

// Export functions
module.exports = {
  checkHealth,
  getHealthStatus,
  performMaintenance,
  startPeriodicHealthChecks,
  initialize
};
