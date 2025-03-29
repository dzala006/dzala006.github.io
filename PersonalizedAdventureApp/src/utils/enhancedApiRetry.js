/**
 * Enhanced API Retry Utility
 * 
 * This utility implements robust API call retries using exponential backoff with jitter.
 * It extends the existing apiOptimizer.js functionality with more advanced retry strategies.
 */

import { performanceMonitor } from './performanceMonitor';

/**
 * Calculate exponential backoff delay with jitter
 * 
 * @param {number} retryCount - Current retry attempt (1-based)
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @param {number} jitterFactor - Random jitter factor (0-1)
 * @returns {number} Delay in milliseconds
 */
export const calculateBackoffDelay = (
  retryCount, 
  baseDelay = 1000, 
  maxDelay = 30000,
  jitterFactor = 0.2
) => {
  // Calculate exponential backoff: baseDelay * 2^retryCount
  const exponentialDelay = baseDelay * Math.pow(2, retryCount);
  
  // Apply maximum delay cap
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  
  // Apply jitter: random value between (1-jitterFactor) and (1+jitterFactor) of the delay
  // This helps prevent synchronized retries from multiple clients
  const jitter = 1 + jitterFactor * (Math.random() * 2 - 1);
  
  return Math.floor(cappedDelay * jitter);
};

/**
 * Determine if a request should be retried based on the error and HTTP status
 * 
 * @param {Error} error - Error object
 * @param {number} status - HTTP status code (if available)
 * @param {number} retryCount - Current retry count
 * @param {number} maxRetries - Maximum number of retries
 * @returns {boolean} Whether the request should be retried
 */
export const shouldRetryRequest = (error, status, retryCount, maxRetries) => {
  // Don't retry if we've reached the maximum retry count
  if (retryCount >= maxRetries) {
    return false;
  }
  
  // Retry network errors (offline, timeout, etc.)
  if (!status && (error.name === 'TypeError' || error.message.includes('network'))) {
    return true;
  }
  
  // Retry server errors (5xx)
  if (status >= 500 && status < 600) {
    return true;
  }
  
  // Retry rate limiting (429 Too Many Requests)
  if (status === 429) {
    return true;
  }
  
  // Don't retry client errors (4xx) except 429
  if (status >= 400 && status < 500) {
    return false;
  }
  
  // Default to not retrying
  return false;
};

/**
 * Make an API request with advanced retry logic using exponential backoff with jitter
 * 
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} retryOptions - Retry options
 * @param {number} retryOptions.maxRetries - Maximum number of retries (default: 3)
 * @param {number} retryOptions.baseDelay - Base delay in milliseconds (default: 1000)
 * @param {number} retryOptions.maxDelay - Maximum delay in milliseconds (default: 30000)
 * @param {number} retryOptions.jitterFactor - Random jitter factor (default: 0.2)
 * @param {Function} retryOptions.shouldRetry - Custom function to determine if a retry should be attempted
 * @param {Function} retryOptions.onRetry - Callback function called before each retry
 * @returns {Promise<any>} Promise that resolves with the response data
 */
export const fetchWithExponentialBackoff = async (url, options = {}, retryOptions = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    jitterFactor = 0.2,
    shouldRetry = shouldRetryRequest,
    onRetry = null
  } = retryOptions;
  
  let retryCount = 0;
  let lastError = null;
  let lastStatus = null;
  
  // Start performance monitoring
  const startTime = performance.now();
  const method = options.method || 'GET';
  
  while (retryCount <= maxRetries) {
    try {
      // Make the request
      const response = await fetch(url, options);
      
      // If the response is not ok, throw an error
      if (!response.ok) {
        lastStatus = response.status;
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
      
      // Parse the response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Track successful API call
      performanceMonitor.trackApiCall(
        `${method} ${url}`,
        startTime,
        true,
        { retryCount }
      );
      
      // Return the data
      return data;
    } catch (error) {
      lastError = error;
      
      // Extract status from error if available
      if (error.message.includes('HTTP error')) {
        const statusMatch = error.message.match(/HTTP error (\d+)/);
        if (statusMatch) {
          lastStatus = parseInt(statusMatch[1], 10);
        }
      }
      
      // Check if we should retry
      if (retryCount < maxRetries && shouldRetry(error, lastStatus, retryCount, maxRetries)) {
        retryCount++;
        
        // Calculate delay with exponential backoff and jitter
        const delay = calculateBackoffDelay(
          retryCount,
          baseDelay,
          maxDelay,
          jitterFactor
        );
        
        // Call onRetry callback if provided
        if (onRetry && typeof onRetry === 'function') {
          onRetry(retryCount, delay, error);
        }
        
        // Log retry attempt
        console.warn(
          `API call to ${url} failed (attempt ${retryCount}/${maxRetries}). ` +
          `Retrying in ${delay}ms...`,
          error
        );
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Continue to next retry attempt
        continue;
      }
      
      // Track failed API call
      performanceMonitor.trackApiCall(
        `${method} ${url}`,
        startTime,
        false,
        { retryCount, error: error.message }
      );
      
      // If we shouldn't retry or have reached max retries, throw the error
      throw error;
    }
  }
  
  // This should never be reached, but just in case
  throw lastError;
};

/**
 * Make an API request with advanced retry logic and response caching
 * 
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} retryOptions - Retry options (see fetchWithExponentialBackoff)
 * @param {Object} cacheOptions - Cache options
 * @param {boolean} cacheOptions.useCache - Whether to use cache
 * @param {string} cacheOptions.cacheKey - Custom cache key
 * @param {number} cacheOptions.ttl - Time to live in milliseconds
 * @returns {Promise<any>} Promise that resolves with the response data
 */
export const fetchWithRetryAndCache = async (url, options = {}, retryOptions = {}, cacheOptions = {}) => {
  // Import here to avoid circular dependency
  const { 
    getCachedApiResponse, 
    cacheApiResponse 
  } = require('./apiOptimizer');
  
  const {
    useCache = true,
    cacheKey = `${options.method || 'GET'}-${url}`,
    ttl = 5 * 60 * 1000 // 5 minutes
  } = cacheOptions;
  
  // Check cache if enabled
  if (useCache) {
    const cachedResponse = getCachedApiResponse(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  // Make the request with retry logic
  const data = await fetchWithExponentialBackoff(url, options, retryOptions);
  
  // Cache the response if enabled
  if (useCache) {
    cacheApiResponse(cacheKey, data, { ttl });
  }
  
  return data;
};

/**
 * Enhance an existing API service with retry capabilities
 * 
 * @param {Object} apiService - API service object with methods like get, post, etc.
 * @param {Object} defaultRetryOptions - Default retry options
 * @returns {Object} Enhanced API service with retry capabilities
 */
export const enhanceApiServiceWithRetry = (apiService, defaultRetryOptions = {}) => {
  const enhancedService = { ...apiService };
  
  // Enhance GET method
  if (enhancedService.get) {
    const originalGet = enhancedService.get;
    enhancedService.get = async (endpoint, options = {}, retryOptions = {}) => {
      try {
        // Merge default retry options with provided options
        const mergedRetryOptions = { ...defaultRetryOptions, ...retryOptions };
        
        // Extract URL from the original function or construct it
        const url = options.url || `${options.baseUrl || ''}${endpoint}`;
        
        // Make the request with retry logic
        return await fetchWithExponentialBackoff(url, {
          method: 'GET',
          ...options
        }, mergedRetryOptions);
      } catch (error) {
        console.error(`Enhanced GET request to ${endpoint} failed:`, error);
        throw error;
      }
    };
  }
  
  // Enhance POST method
  if (enhancedService.post) {
    const originalPost = enhancedService.post;
    enhancedService.post = async (endpoint, data = {}, options = {}, retryOptions = {}) => {
      try {
        // Merge default retry options with provided options
        const mergedRetryOptions = { ...defaultRetryOptions, ...retryOptions };
        
        // Extract URL from the original function or construct it
        const url = options.url || `${options.baseUrl || ''}${endpoint}`;
        
        // Make the request with retry logic
        return await fetchWithExponentialBackoff(url, {
          method: 'POST',
          body: JSON.stringify(data),
          ...options
        }, mergedRetryOptions);
      } catch (error) {
        console.error(`Enhanced POST request to ${endpoint} failed:`, error);
        throw error;
      }
    };
  }
  
  // Enhance PUT method
  if (enhancedService.put) {
    const originalPut = enhancedService.put;
    enhancedService.put = async (endpoint, data = {}, options = {}, retryOptions = {}) => {
      try {
        // Merge default retry options with provided options
        const mergedRetryOptions = { ...defaultRetryOptions, ...retryOptions };
        
        // Extract URL from the original function or construct it
        const url = options.url || `${options.baseUrl || ''}${endpoint}`;
        
        // Make the request with retry logic
        return await fetchWithExponentialBackoff(url, {
          method: 'PUT',
          body: JSON.stringify(data),
          ...options
        }, mergedRetryOptions);
      } catch (error) {
        console.error(`Enhanced PUT request to ${endpoint} failed:`, error);
        throw error;
      }
    };
  }
  
  // Enhance DELETE method
  if (enhancedService.del) {
    const originalDel = enhancedService.del;
    enhancedService.del = async (endpoint, options = {}, retryOptions = {}) => {
      try {
        // Merge default retry options with provided options
        const mergedRetryOptions = { ...defaultRetryOptions, ...retryOptions };
        
        // Extract URL from the original function or construct it
        const url = options.url || `${options.baseUrl || ''}${endpoint}`;
        
        // Make the request with retry logic
        return await fetchWithExponentialBackoff(url, {
          method: 'DELETE',
          ...options
        }, mergedRetryOptions);
      } catch (error) {
        console.error(`Enhanced DELETE request to ${endpoint} failed:`, error);
        throw error;
      }
    };
  }
  
  return enhancedService;
};

export default {
  fetchWithExponentialBackoff,
  fetchWithRetryAndCache,
  calculateBackoffDelay,
  shouldRetryRequest,
  enhanceApiServiceWithRetry
};