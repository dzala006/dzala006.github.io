/**
 * Tests for the Enhanced API Retry Utility
 */

import { 
  calculateBackoffDelay,
  shouldRetryRequest,
  fetchWithExponentialBackoff,
  fetchWithRetryAndCache,
  enhanceApiServiceWithRetry
} from '../src/utils/enhancedApiRetry';

// Mock the performanceMonitor
jest.mock('../src/utils/performanceMonitor', () => ({
  trackApiCall: jest.fn()
}));

// Mock the apiOptimizer for fetchWithRetryAndCache
jest.mock('../src/utils/apiOptimizer', () => ({
  getCachedApiResponse: jest.fn(),
  cacheApiResponse: jest.fn()
}), { virtual: true });

describe('Enhanced API Retry Utility', () => {
  // Save and restore the original fetch
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock performance.now()
    global.performance = {
      now: jest.fn().mockReturnValue(0)
    };
    
    // Mock fetch
    global.fetch = jest.fn();
  });
  
  afterAll(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });
  
  describe('calculateBackoffDelay', () => {
    test('should calculate correct delay with default parameters', () => {
      // Mock Math.random to return a consistent value
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.5);
      
      // Test with different retry counts
      expect(calculateBackoffDelay(1)).toBeCloseTo(1000, -2); // 1000ms with jitter
      expect(calculateBackoffDelay(2)).toBeCloseTo(2000, -2); // 2000ms with jitter
      expect(calculateBackoffDelay(3)).toBeCloseTo(4000, -2); // 4000ms with jitter
      expect(calculateBackoffDelay(4)).toBeCloseTo(8000, -2); // 8000ms with jitter
      expect(calculateBackoffDelay(5)).toBeCloseTo(16000, -2); // 16000ms with jitter
      
      // Restore Math.random
      Math.random = originalRandom;
    });
    
    test('should apply maximum delay cap', () => {
      // Mock Math.random to return a consistent value
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.5);
      
      // Test with a high retry count that would exceed maxDelay
      expect(calculateBackoffDelay(10, 1000, 30000)).toBeCloseTo(30000, -2); // Should be capped at 30000ms
      
      // Restore Math.random
      Math.random = originalRandom;
    });
    
    test('should apply jitter correctly', () => {
      // Mock Math.random to return different values
      const originalRandom = Math.random;
      
      // Test with jitter that reduces the delay
      Math.random = jest.fn().mockReturnValue(0);
      expect(calculateBackoffDelay(1, 1000, 30000, 0.2)).toBeCloseTo(800, -2); // 1000 * (1 - 0.2)
      
      // Test with jitter that increases the delay
      Math.random = jest.fn().mockReturnValue(1);
      expect(calculateBackoffDelay(1, 1000, 30000, 0.2)).toBeCloseTo(1200, -2); // 1000 * (1 + 0.2)
      
      // Restore Math.random
      Math.random = originalRandom;
    });
  });
  
  describe('shouldRetryRequest', () => {
    test('should not retry if max retries reached', () => {
      const error = new Error('Test error');
      expect(shouldRetryRequest(error, null, 3, 3)).toBe(false);
    });
    
    test('should retry network errors', () => {
      const error = new TypeError('Failed to fetch');
      expect(shouldRetryRequest(error, null, 1, 3)).toBe(true);
      
      const networkError = new Error('network error');
      expect(shouldRetryRequest(networkError, null, 1, 3)).toBe(true);
    });
    
    test('should retry server errors (5xx)', () => {
      const error = new Error('Server error');
      expect(shouldRetryRequest(error, 500, 1, 3)).toBe(true);
      expect(shouldRetryRequest(error, 502, 1, 3)).toBe(true);
      expect(shouldRetryRequest(error, 503, 1, 3)).toBe(true);
      expect(shouldRetryRequest(error, 504, 1, 3)).toBe(true);
    });
    
    test('should retry rate limiting errors (429)', () => {
      const error = new Error('Too Many Requests');
      expect(shouldRetryRequest(error, 429, 1, 3)).toBe(true);
    });
    
    test('should not retry client errors (4xx) except 429', () => {
      const error = new Error('Client error');
      expect(shouldRetryRequest(error, 400, 1, 3)).toBe(false);
      expect(shouldRetryRequest(error, 401, 1, 3)).toBe(false);
      expect(shouldRetryRequest(error, 403, 1, 3)).toBe(false);
      expect(shouldRetryRequest(error, 404, 1, 3)).toBe(false);
    });
  });
  
  describe('fetchWithExponentialBackoff', () => {
    test('should return data on successful request', async () => {
      // Mock a successful response
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue({ data: 'test data' })
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      const result = await fetchWithExponentialBackoff('https://example.com/api', {
        method: 'GET'
      });
      
      expect(result).toEqual({ data: 'test data' });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    test('should retry on server error', async () => {
      // Mock a server error response followed by a successful response
      const errorResponse = {
        ok: false,
        status: 500,
        headers: {
          get: jest.fn().mockReturnValue('text/plain')
        },
        text: jest.fn().mockResolvedValue('Server Error')
      };
      
      const successResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue({ data: 'test data' })
      };
      
      // First call fails, second call succeeds
      global.fetch
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);
      
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback) => {
        callback();
        return 123; // Return a timeout ID
      });
      
      const result = await fetchWithExponentialBackoff('https://example.com/api', {
        method: 'GET'
      }, {
        maxRetries: 3,
        baseDelay: 1000
      });
      
      expect(result).toEqual({ data: 'test data' });
      expect(global.fetch).toHaveBeenCalledTimes(2);
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
      jest.useRealTimers();
    });
    
    test('should throw error after max retries', async () => {
      // Mock a server error response
      const errorResponse = {
        ok: false,
        status: 500,
        headers: {
          get: jest.fn().mockReturnValue('text/plain')
        },
        text: jest.fn().mockResolvedValue('Server Error')
      };
      
      // All calls fail
      global.fetch.mockResolvedValue(errorResponse);
      
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback) => {
        callback();
        return 123; // Return a timeout ID
      });
      
      await expect(fetchWithExponentialBackoff('https://example.com/api', {
        method: 'GET'
      }, {
        maxRetries: 2,
        baseDelay: 1000
      })).rejects.toThrow('HTTP error 500');
      
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial request + 2 retries
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
      jest.useRealTimers();
    });
    
    test('should call onRetry callback before each retry', async () => {
      // Mock a server error response
      const errorResponse = {
        ok: false,
        status: 500,
        headers: {
          get: jest.fn().mockReturnValue('text/plain')
        },
        text: jest.fn().mockResolvedValue('Server Error')
      };
      
      // All calls fail
      global.fetch.mockResolvedValue(errorResponse);
      
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback) => {
        callback();
        return 123; // Return a timeout ID
      });
      
      const onRetry = jest.fn();
      
      await expect(fetchWithExponentialBackoff('https://example.com/api', {
        method: 'GET'
      }, {
        maxRetries: 2,
        baseDelay: 1000,
        onRetry
      })).rejects.toThrow('HTTP error 500');
      
      expect(onRetry).toHaveBeenCalledTimes(2); // Called for each retry
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
      jest.useRealTimers();
    });
  });
  
  describe('fetchWithRetryAndCache', () => {
    test('should return cached data if available', async () => {
      // Import the mocked module
      const { getCachedApiResponse } = require('../src/utils/apiOptimizer');
      
      // Mock a cached response
      getCachedApiResponse.mockReturnValue({ data: 'cached data' });
      
      const result = await fetchWithRetryAndCache('https://example.com/api', {
        method: 'GET'
      });
      
      expect(result).toEqual({ data: 'cached data' });
      expect(getCachedApiResponse).toHaveBeenCalledTimes(1);
      expect(global.fetch).not.toHaveBeenCalled();
    });
    
    test('should fetch and cache data if not in cache', async () => {
      // Import the mocked modules
      const { 
        getCachedApiResponse,
        cacheApiResponse
      } = require('../src/utils/apiOptimizer');
      
      // Mock no cached data
      getCachedApiResponse.mockReturnValue(null);
      
      // Mock a successful response
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue({ data: 'fresh data' })
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      const result = await fetchWithRetryAndCache('https://example.com/api', {
        method: 'GET'
      });
      
      expect(result).toEqual({ data: 'fresh data' });
      expect(getCachedApiResponse).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(cacheApiResponse).toHaveBeenCalledTimes(1);
      expect(cacheApiResponse).toHaveBeenCalledWith(
        'GET-https://example.com/api',
        { data: 'fresh data' },
        { ttl: 300000 }
      );
    });
  });
  
  describe('enhanceApiServiceWithRetry', () => {
    test('should enhance API service methods with retry capabilities', async () => {
      // Create a mock API service
      const mockApiService = {
        get: jest.fn().mockResolvedValue({ data: 'get data' }),
        post: jest.fn().mockResolvedValue({ data: 'post data' }),
        put: jest.fn().mockResolvedValue({ data: 'put data' }),
        del: jest.fn().mockResolvedValue({ data: 'delete data' })
      };
      
      // Enhance the API service
      const enhancedService = enhanceApiServiceWithRetry(mockApiService);
      
      // Mock a successful response for fetch
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue({ data: 'test data' })
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      // Test enhanced methods
      await enhancedService.get('/test');
      await enhancedService.post('/test', { foo: 'bar' });
      await enhancedService.put('/test', { foo: 'bar' });
      await enhancedService.del('/test');
      
      // Each method should call fetch
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });
});