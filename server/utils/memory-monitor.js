const v8 = require('v8');
const logger = require('./logger');

let monitorTimer = null;

const memoryMonitor = {
  getMemoryUsage() {
    const heapStats = v8.getHeapStatistics();
    const memoryUsage = process.memoryUsage();

    return {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      heapSizeLimit: Math.round(heapStats.heap_size_limit / 1024 / 1024)
    };
  },

  logMemoryUsage(threshold = 80) {
    const stats = this.getMemoryUsage();
    const usagePercent = (stats.heapUsed / stats.heapSizeLimit) * 100;

    if (usagePercent > threshold) {
      logger.warn(`⚠️ High memory usage: ${usagePercent.toFixed(2)}%`);
      logger.warn('📊 Memory stats:', stats);

      if (usagePercent > 90) {
        if (global.gc) {
          global.gc();
          logger.debug('🧹 Forced garbage collection triggered');
        } else {
          logger.warn('🚫 Garbage collection unavailable — run with --expose-gc');
        }
      }
    }
  },

  start(interval = 300000, threshold = 80) {
    if (monitorTimer) {
      logger.warn('🔁 Memory monitor is already running');
      return false;
    }

    monitorTimer = setInterval(() => {
      this.logMemoryUsage(threshold);
    }, interval);

    logger.info(`🟢 Memory monitor started (every ${interval / 1000}s)`);
    return true;
  },

  stop() {
    if (monitorTimer) {
      clearInterval(monitorTimer);
      monitorTimer = null;
      logger.info('🛑 Memory monitor stopped');
      return true;
    }
    logger.warn('⛔ Memory monitor is not running');
    return false;
  }
};

module.exports = memoryMonitor;
