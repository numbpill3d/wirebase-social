/**
 * Tests for memory-monitor utility
 */
const v8 = require('v8');

// Mock the v8 module
jest.mock('v8', () => ({
  getHeapStatistics: jest.fn().mockReturnValue({
    heap_size_limit: 1024 * 1024 * 100 // 100MB
  })
}));

// Mock process.memoryUsage
const originalMemoryUsage = process.memoryUsage;
process.memoryUsage = jest.fn().mockReturnValue({
  heapUsed: 1024 * 1024 * 50, // 50MB
  heapTotal: 1024 * 1024 * 80, // 80MB
  external: 1024 * 1024 * 10 // 10MB
});

// Mock logger methods
const logger = require('../../../server/utils/logger');
jest.spyOn(logger, 'warn').mockImplementation(() => {});
jest.spyOn(logger, 'info').mockImplementation(() => {});
jest.spyOn(logger, 'debug').mockImplementation(() => {});

// Import the module under test
const memoryMonitor = require('../../../server/utils/memory-monitor');

describe('Memory Monitor', () => {

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterAll(() => {
    memoryMonitor.stop();
    process.memoryUsage = originalMemoryUsage;
    jest.restoreAllMocks();
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage statistics', () => {
      const stats = memoryMonitor.getMemoryUsage();
      
      expect(stats).toHaveProperty('heapUsed');
      expect(stats).toHaveProperty('heapTotal');
      expect(stats).toHaveProperty('external');
      expect(stats).toHaveProperty('heapSizeLimit');
      
      expect(stats.heapUsed).toBe(50);
      expect(stats.heapTotal).toBe(80);
      expect(stats.external).toBe(10);
      expect(stats.heapSizeLimit).toBe(100);
    });
  });

  describe('logMemoryUsage', () => {
    it('should log a warning when memory usage exceeds threshold', () => {
      // Set up memory usage to be 60% of limit
      process.memoryUsage.mockReturnValueOnce({
        heapUsed: 1024 * 1024 * 60, // 60MB
        heapTotal: 1024 * 1024 * 80, // 80MB
        external: 1024 * 1024 * 10 // 10MB
      });
      
      memoryMonitor.logMemoryUsage(50); // Threshold of 50%
      
      expect(logger.warn).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledWith('⚠️ High memory usage: 60.00%');
    });
    
    it('should not log a warning when memory usage is below threshold', () => {
      // Set up memory usage to be 40% of limit
      process.memoryUsage.mockReturnValueOnce({
        heapUsed: 1024 * 1024 * 40, // 40MB
        heapTotal: 1024 * 1024 * 80, // 80MB
        external: 1024 * 1024 * 10 // 10MB
      });
      
      memoryMonitor.logMemoryUsage(50); // Threshold of 50%
      
      expect(logger.warn).not.toHaveBeenCalled();
    });
    
    it('should force garbage collection when memory usage exceeds 90%', () => {
      // Mock global.gc
      global.gc = jest.fn();
      
      // Set up memory usage to be 95% of limit
      process.memoryUsage.mockReturnValueOnce({
        heapUsed: 1024 * 1024 * 95, // 95MB
        heapTotal: 1024 * 1024 * 100, // 100MB
        external: 1024 * 1024 * 10 // 10MB
      });
      
      memoryMonitor.logMemoryUsage(50); // Threshold of 50%
      
      expect(logger.warn).toHaveBeenCalledTimes(2);
      expect(global.gc).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith(
        '🧹 Forced garbage collection triggered'
      );
      
      // Clean up
      delete global.gc;
    });
  });

  describe('start and stop', () => {
    it('should start and stop the monitoring interval', () => {
      jest.useFakeTimers();
      const setSpy = jest.spyOn(global, 'setInterval');
      const clearSpy = jest.spyOn(global, 'clearInterval');

      memoryMonitor.start(1000);

      expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

      memoryMonitor.stop();

      expect(clearSpy).toHaveBeenCalled();

      setSpy.mockRestore();
      clearSpy.mockRestore();
      jest.useRealTimers();
    });
  });
});
