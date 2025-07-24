const v8 = require('v8');

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
      console.warn(`⚠️ High memory usage: ${usagePercent.toFixed(2)}%`);
      console.warn('📊 Memory stats:', stats);

      if (usagePercent > 90) {
        if (global.gc) {
          global.gc();
          console.log('🧹 Forced garbage collection triggered');
        } else {
          console.warn('🚫 Garbage collection unavailable — run with --expose-gc');
        }
      }
    }
  },

  start(interval = 300000, threshold = 80) {
    if (monitorTimer) {
      console.warn('🔁 Memory monitor is already running');
      return false;
    }

    monitorTimer = setInterval(() => {
      this.logMemoryUsage(threshold);
    }, interval);

    console.log(`🟢 Memory monitor started (every ${interval / 1000}s)`);
    return true;
  },

  stop() {
    if (monitorTimer) {
      clearInterval(monitorTimer);
      monitorTimer = null;
      console.log('🛑 Memory monitor stopped');
      return true;
    }
    console.warn('⛔ Memory monitor is not running');
    return false;
  }
};

module.exports = memoryMonitor;
