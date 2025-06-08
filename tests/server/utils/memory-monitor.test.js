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

// Mock console methods
const originalConsoleWarn = console.warn;
console.warn = jest.fn();

const originalConsoleLog = console.log;
console.log = jest.fn();

// Import the module under test
const memoryMonitor = require('../../../server/utils/memory-monitor');

describe('Memory Monitor', () => {
  beforeAll(() => {
    memoryMonitor.start(1000); // use shorter interval for tests
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original functions
    process.memoryUsage = originalMemoryUsage;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
    memoryMonitor.stop();
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
      
      expect(console.warn).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledWith('High memory usage: 60.00%');
    });
    
    it('should not log a warning when memory usage is below threshold', () => {
      // Set up memory usage to be 40% of limit
      process.memoryUsage.mockReturnValueOnce({
        heapUsed: 1024 * 1024 * 40, // 40MB
        heapTotal: 1024 * 1024 * 80, // 80MB
        external: 1024 * 1024 * 10 // 10MB
      });
      
      memoryMonitor.logMemoryUsage(50); // Threshold of 50%
      
      expect(console.warn).not.toHaveBeenCalled();
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
      
      expect(console.warn).toHaveBeenCalledTimes(2);
      expect(global.gc).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('Forced garbage collection');
      
      // Clean up
      delete global.gc;
    });
  });
});
