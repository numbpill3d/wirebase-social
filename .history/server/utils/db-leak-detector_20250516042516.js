/**
 * Database connection leak detector
 * Monitors for potential connection leaks and takes corrective action
 */

// Remove direct import of knex to break circular dependency
const dbMonitor = require('./db-monitor');

// Track connection usage over time
const connectionHistory = [];
const MAX_HISTORY_LENGTH = 100;

// Track potential leaks
let potentialLeaks = {
  count: 0,
  lastDetected: null,
  autoFixCount: 0,
  lastAutoFix: null
};

/**
 * Check for potential connection leaks
 * @param {Object} knexInstance - The knex instance to use
 * @returns {Object} Leak check result
 */
const checkForLeaks = (knexInstance) => {
  if (!knexInstance) {
    return { error: 'No knex instance provided' };
  }
  
  try {
    // Get current pool status
    const status = dbMonitor.getPoolStatus(knexInstance);
    
    if (status.error) {
      return { error: status.error };
    }
    
    // Add to history
    connectionHistory.push({
      timestamp: Date.now(),
      used: status.used,
      free: status.free,
      total: status.total,
      pending: status.pending
    });
    
    // Trim history if needed
    if (connectionHistory.length > MAX_HISTORY_LENGTH) {
      connectionHistory.shift();
    }
    
    // Need at least 10 data points to detect leaks
    if (connectionHistory.length < 10) {
      return { 
        leakDetected: false,
        message: 'Not enough history to detect leaks',
        status
      };
    }
    
    // Check if used connections are consistently high
    const recentHistory = connectionHistory.slice(-10);
    const highUsageCount = recentHistory.filter(h => h.used / status.max > 0.7).length;
    
    // Check if free connections are consistently low
    const lowFreeCount = recentHistory.filter(h => h.free === 0).length;
    
    // Check if connections are growing over time
    const oldestInSample = recentHistory[0];
    const newest = recentHistory[recentHistory.length - 1];
    const growingConnections = newest.used > oldestInSample.used && 
                              newest.free <= oldestInSample.free;
    
    // Detect potential leak
    const leakDetected = (highUsageCount >= 8 || lowFreeCount >= 8) && growingConnections;
    
    if (leakDetected) {
      potentialLeaks.count++;
      potentialLeaks.lastDetected = new Date();
      
      console.warn('Potential database connection leak detected', {
        highUsageCount,
        lowFreeCount,
        growingConnections,
        oldestUsed: oldestInSample.used,
        newestUsed: newest.used,
        status
      });
    }
    
    return {
      leakDetected,
      highUsageCount,
      lowFreeCount,
      growingConnections,
      history: recentHistory,
      status,
      potentialLeaks
    };
  } catch (error) {
    console.error('Error checking for connection leaks:', error);
    return { error: error.message };
  }
};

/**
 * Fix potential connection leaks
 * @param {Object} knexInstance - The knex instance to use
 * @param {boolean} force - Force fix even if no leak is detected
 * @returns {Promise<Object>} Fix result
 */
const fixLeaks = async (knexInstance, force = false) => {
  if (!knexInstance) {
    return { error: 'No knex instance provided' };
  }
  
  try {
    // Check for leaks first
    const leakCheck = checkForLeaks(knexInstance);
    
    if (leakCheck.error) {
      return { error: leakCheck.error };
    }
    
    // Only fix if leak detected or forced
    if (!leakCheck.leakDetected && !force) {
      return { 
        fixed: false,
        message: 'No leak detected, no action taken',
        leakCheck
      };
    }
    
    console.log('Attempting to fix database connection leaks');
    
    // Get pool
    const pool = knexInstance.client.pool;
    
    // Force pool to release idle connections
    if (pool && typeof pool.drain === 'function') {
      await pool.drain();
      console.log('Pool drained successfully');
    }
    
    // Update stats
    potentialLeaks.autoFixCount++;
    potentialLeaks.lastAutoFix = new Date();
    
    // Get new status
    const newStatus = dbMonitor.getPoolStatus(knexInstance);
    
    return {
      fixed: true,
      message: 'Connection leak fix attempted',
      before: leakCheck.status,
      after: newStatus
    };
  } catch (error) {
    console.error('Error fixing connection leaks:', error);
    return { error: error.message };
  }
};

/**
 * Start periodic leak detection
 * @param {Object} knexInstance - The knex instance to use
 * @param {number} checkInterval - Check interval in milliseconds
 * @param {number} fixInterval - Fix interval in milliseconds
 * @returns {Object} Timer objects
 */
const startLeakDetection = (knexInstance, checkInterval = 30000, fixInterval = 300000) => {
  if (!knexInstance) {
    console.error('ERROR: knexInstance not provided to startLeakDetection');
    return { checkTimer: null, fixTimer: null };
  }
  
  // Perform initial check
  checkForLeaks(knexInstance);
  
  // Schedule periodic checks
  const checkTimer = setInterval(() => {
    checkForLeaks(knexInstance);
  }, checkInterval);
  
  // Schedule periodic fixes if leaks detected
  const fixTimer = setInterval(async () => {
    const leakCheck = checkForLeaks(knexInstance);
    
    // Auto-fix if persistent leaks detected
    if (leakCheck.leakDetected && potentialLeaks.count >= 3) {
      await fixLeaks(knexInstance);
    }
  }, fixInterval);
  
  console.log(`Database connection leak detection started (check: ${checkInterval}ms, fix: ${fixInterval}ms)`);
  
  return { checkTimer, fixTimer };
};

module.exports = {
  checkForLeaks,
  fixLeaks,
  startLeakDetection,
  getConnectionHistory: () => connectionHistory,
  getPotentialLeaks: () => potentialLeaks
};
