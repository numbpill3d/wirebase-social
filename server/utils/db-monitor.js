/**
 * Database connection pool monitoring utility
 * Provides functions to monitor and report on database connection pool status
 */

const { knex } = require('../../server');

// Store metrics for connection pool
let metrics = {
  totalConnections: 0,
  acquireCount: 0,
  releaseCount: 0,
  createCount: 0,
  destroyCount: 0,
  pendingAcquires: 0,
  pendingCreates: 0,
  failedAcquires: 0,
  failedCreates: 0,
  maxUsedConnections: 0,
  lastChecked: Date.now()
};

/**
 * Get current connection pool status
 * @returns {Object} Current pool status
 */
const getPoolStatus = () => {
  try {
    // Get pool from knex instance
    const pool = knex.client.pool;
    
    if (!pool) {
      return { error: 'Pool not available' };
    }
    
    // Update metrics
    metrics.totalConnections = pool.numUsed() + pool.numFree();
    metrics.pendingAcquires = pool.numPendingAcquires();
    metrics.pendingCreates = pool.numPendingCreates();
    
    // Update max connections if current count is higher
    if (metrics.totalConnections > metrics.maxUsedConnections) {
      metrics.maxUsedConnections = metrics.totalConnections;
    }
    
    metrics.lastChecked = Date.now();
    
    // Return current status
    return {
      used: pool.numUsed(),
      free: pool.numFree(),
      total: metrics.totalConnections,
      pending: metrics.pendingAcquires + metrics.pendingCreates,
      max: pool.max,
      maxEverUsed: metrics.maxUsedConnections,
      utilization: Math.round((metrics.totalConnections / pool.max) * 100) + '%',
      metrics: { ...metrics }
    };
  } catch (error) {
    console.error('Error getting pool status:', error);
    return { error: error.message };
  }
};

/**
 * Setup connection pool event listeners to track metrics
 */
const setupPoolMonitoring = () => {
  try {
    const pool = knex.client.pool;
    
    if (!pool || !pool.on) {
      console.warn('Pool monitoring not available');
      return false;
    }
    
    // Listen for pool events
    pool.on('acquireRequest', () => {
      metrics.acquireCount++;
    });
    
    pool.on('release', () => {
      metrics.releaseCount++;
    });
    
    pool.on('createRequest', () => {
      metrics.createCount++;
    });
    
    pool.on('destroyRequest', () => {
      metrics.destroyCount++;
    });
    
    pool.on('acquireFail', () => {
      metrics.failedAcquires++;
      logPoolWarning();
    });
    
    pool.on('createFail', () => {
      metrics.failedCreates++;
      logPoolWarning();
    });
    
    console.log('Database connection pool monitoring enabled');
    return true;
  } catch (error) {
    console.error('Error setting up pool monitoring:', error);
    return false;
  }
};

/**
 * Log warning when pool is under pressure
 */
const logPoolWarning = () => {
  const status = getPoolStatus();
  if (status.error) return;
  
  // Log warning if pool utilization is high
  if (status.used / status.max > 0.7) {
    console.warn('DATABASE POOL WARNING: High connection utilization', {
      used: status.used,
      free: status.free,
      max: status.max,
      pending: status.pending,
      utilization: status.utilization
    });
  }
};

/**
 * Reset metrics
 */
const resetMetrics = () => {
  metrics = {
    totalConnections: 0,
    acquireCount: 0,
    releaseCount: 0,
    createCount: 0,
    destroyCount: 0,
    pendingAcquires: 0,
    pendingCreates: 0,
    failedAcquires: 0,
    failedCreates: 0,
    maxUsedConnections: 0,
    lastChecked: Date.now()
  };
};

// Initialize monitoring
setupPoolMonitoring();

// Export functions
module.exports = {
  getPoolStatus,
  resetMetrics,
  setupPoolMonitoring
};
