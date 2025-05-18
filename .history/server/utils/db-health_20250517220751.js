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
    const beforeStatus = dbMonitor.getPoolStatus(knexInstance);

    // Force a pool refresh by destroying and recreating the pool
    if (healthCheckStatus.consecutiveFailures >= 3) {
      console.log('Performing database pool reset due to consecutive failures');

      // Destroy and recreate the pool
      await knexInstance.destroy();
      await knexInstance.initialize();

      // Reset health check status
      healthCheckStatus.consecutiveFailures = 0;
      dbMonitor.resetMetrics();
      dbMonitor.setupPoolMonitoring(knexInstance);
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
const startPeriodicHealthChecks = (knexInstance, interval = 60000) => {
  if (!knexInstance) {
    console.error('ERROR: knexInstance not provided to startPeriodicHealthChecks');
    return null;
  }

  // Perform initial health check
  checkHealth(knexInstance);

  // Schedule periodic health checks
  const timer = setInterval(async () => {
    const result = await checkHealth(knexInstance);

    // Perform maintenance if needed
    if (!result.healthy || healthCheckStatus.consecutiveFailures >= 3) {
      await performMaintenance(knexInstance);
    }
  }, interval);

  console.log(`Database health checks started (interval: ${interval}ms)`);

  return timer;
};

// Export functions
module.exports = {
  checkHealth,
  getHealthStatus,
  performMaintenance,
  startPeriodicHealthChecks
};
