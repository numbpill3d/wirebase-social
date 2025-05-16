/**
 * Database health check utility
 * Provides functions to check database connection health and perform maintenance
 */

const { knex } = require('../../server');
const dbMonitor = require('./db-monitor');

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
    await knex.raw('SELECT 1 as health_check');
    
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
      poolStatus: dbMonitor.getPoolStatus()
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
      poolStatus: dbMonitor.getPoolStatus()
    };
  }
};

/**
 * Get current health status
 * @returns {Object} Current health status
 */
const getHealthStatus = () => {
  return {
    ...healthCheckStatus,
    poolStatus: dbMonitor.getPoolStatus()
  };
};

/**
 * Perform database maintenance
 * @returns {Promise<Object>} Maintenance result
 */
const performMaintenance = async () => {
  try {
    // Get pool status before maintenance
    const beforeStatus = dbMonitor.getPoolStatus();
    
    // Force a pool refresh by destroying and recreating the pool
    if (healthCheckStatus.consecutiveFailures >= 3) {
      console.log('Performing database pool reset due to consecutive failures');
      
      // Destroy and recreate the pool
      await knex.destroy();
      await knex.initialize();
      
      // Reset health check status
      healthCheckStatus.consecutiveFailures = 0;
      dbMonitor.resetMetrics();
      dbMonitor.setupPoolMonitoring();
    }
    
    // Get pool status after maintenance
    const afterStatus = dbMonitor.getPoolStatus();
    
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
 * @param {number} interval - Check interval in milliseconds
 * @returns {Object} Timer object
 */
const startPeriodicHealthChecks = (interval = 60000) => {
  // Perform initial health check
  checkHealth();
  
  // Schedule periodic health checks
  const timer = setInterval(async () => {
    const result = await checkHealth();
    
    // Perform maintenance if needed
    if (!result.healthy || healthCheckStatus.consecutiveFailures >= 3) {
      await performMaintenance();
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
