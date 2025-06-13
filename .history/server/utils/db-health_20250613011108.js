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
const getHealthStatus = () => {
  return healthCheckStatus;
};

/**
 * Start periodic health checks
 * @param {number} interval - Check interval in milliseconds
 * @returns {Object} Timer object
 */
const startPeriodicHealthChecks = (interval = 60000) => {
  // Perform initial health check
  checkHealth();

  // Schedule periodic health checks
  const timer = setInterval(() => {
    checkHealth();
  }, interval);

  console.log(`Supabase health checks started (interval: ${interval}ms)`);

  return timer;
};

// Export functions
module.exports = {
  checkHealth,
  getHealthStatus,
  startPeriodicHealthChecks
};
