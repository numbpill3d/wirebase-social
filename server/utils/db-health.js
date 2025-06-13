/**
 * Database health check utility (Supabase version)
 * Provides functions to check database connection health
 */

const { supabase } = require('./database');

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
 * @returns {Promise<Object>} Health check result
 */
const checkHealth = async () => {
  const startTime = Date.now();

  try {
    // Simple query to check database connectivity
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) throw error;

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
      responseTime
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
      responseTime
    };
  }
};

/**
 * Get current health status
 * @returns {Object} Current health status
 */
<<<<<<< HEAD
const getHealthStatus = () => {
  return healthCheckStatus;
=======
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
>>>>>>> 87c60c31d7ec8f0bd44342014052fb5b73e4e77c
};

/**
 * Start periodic health checks
 * @param {number} interval - Check interval in milliseconds
 * @returns {Object} Object containing the timer and a stop function
 */
<<<<<<< HEAD
const startPeriodicHealthChecks = (interval = 60000) => {
=======
const startPeriodicHealthChecks = (knex = null, interval = 60000) => {
  const kInstance = knex || knexInstance || global.knex;

  if (!kInstance) {
    console.error('ERROR: No knex instance available for health checks');
    return { timer: null, stop: () => {} };
  }

  // Store the instance for future use
  if (knex && !knexInstance) {
    knexInstance = knex;
  }

>>>>>>> 87c60c31d7ec8f0bd44342014052fb5b73e4e77c
  // Perform initial health check
  checkHealth();

  // Schedule periodic health checks
  const timer = setInterval(() => {
    checkHealth();
  }, interval);

  console.log(`Supabase health checks started (interval: ${interval}ms)`);

  const stop = () => {
    clearInterval(timer);
    console.log('Database health checks stopped');
  };

  return { timer, stop };
};

// Export functions
module.exports = {
  checkHealth,
  getHealthStatus,
  startPeriodicHealthChecks
};
