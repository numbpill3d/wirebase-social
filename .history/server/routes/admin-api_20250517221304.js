/**
 * Admin API routes for Wirebase
 * Provides endpoints for system administration and monitoring
 */

const express = require('express');
const router = express.Router();
const dbMonitor = require('../utils/db-monitor');
const dbHealth = require('../utils/db-health');
const dbErrorHandler = require('../utils/db-error-handler');
const dbLeakDetector = require('../utils/db-leak-detector');

// Middleware to ensure user is authenticated and is an admin
const ensureAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!req.user.role || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  next();
};

// Get database status
router.get('/db/status', ensureAdmin, (req, res) => {
  try {
    // Use global.knex as a fallback if needed
    const knex = global.knex;
    const poolStatus = dbMonitor.getPoolStatus(knex);
    const healthStatus = dbHealth.getHealthStatus(knex);
    const errorStats = dbErrorHandler.getErrorStats(knex);
    const leakStatus = {
      history: dbLeakDetector.getConnectionHistory(),
      potentialLeaks: dbLeakDetector.getPotentialLeaks()
    };

    res.json({
      pool: poolStatus,
      health: healthStatus,
      errors: errorStats,
      leaks: leakStatus,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting database status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Perform database health check
router.post('/db/health-check', ensureAdmin, async (req, res) => {
  try {
    const result = await dbHealth.checkHealth();
    res.json(result);
  } catch (error) {
    console.error('Error performing health check:', error);
    res.status(500).json({ error: error.message });
  }
});

// Perform database maintenance
router.post('/db/maintenance', ensureAdmin, async (req, res) => {
  try {
    const result = await dbHealth.performMaintenance();
    res.json(result);
  } catch (error) {
    console.error('Error performing maintenance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check for connection leaks
router.get('/db/leaks', ensureAdmin, (req, res) => {
  try {
    const result = dbLeakDetector.checkForLeaks();
    res.json(result);
  } catch (error) {
    console.error('Error checking for leaks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fix connection leaks
router.post('/db/fix-leaks', ensureAdmin, async (req, res) => {
  try {
    const force = req.body.force === true;
    const result = await dbLeakDetector.fixLeaks(force);
    res.json(result);
  } catch (error) {
    console.error('Error fixing leaks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset error statistics
router.post('/db/reset-errors', ensureAdmin, (req, res) => {
  try {
    dbErrorHandler.resetErrorStats();
    res.json({ success: true, message: 'Error statistics reset' });
  } catch (error) {
    console.error('Error resetting error stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset connection metrics
router.post('/db/reset-metrics', ensureAdmin, (req, res) => {
  try {
    dbMonitor.resetMetrics();
    res.json({ success: true, message: 'Connection metrics reset' });
  } catch (error) {
    console.error('Error resetting metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
