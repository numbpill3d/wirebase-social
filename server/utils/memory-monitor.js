const v8 = require('v8');

let timer = null;

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
      console.warn(`High memory usage: ${usagePercent.toFixed(2)}%`);
      console.warn('Memory stats:', stats);

      if (usagePercent > 90) {
        global.gc && global.gc();
        console.log('Forced garbage collection');
      }
    }
  }
};

// Start monitoring memory usage
const start = (interval = 300000, threshold = 80) => {
  if (timer) {
    console.warn('Memory monitor is already running');
    return false;
  }
  timer = setInterval(() => {
    memoryMonitor.logMemoryUsage(threshold);
  }, interval);
  return true;
};

// Stop monitoring memory usage
const stop = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = {
  ...memoryMonitor,
  start,
  stop
};
