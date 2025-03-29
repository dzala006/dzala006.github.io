/**
 * API Optimizer Utility
 * 
 * This utility provides functions for optimizing API calls, including
 * request batching, caching, and retry logic.
 */

import { performanceMonitor } from './performanceMonitor';

// Cache for API responses
const apiCache = {
  cache: {},
  timeouts: {},
  maxSize: 100, // Maximum number of cached responses
  defaultTTL: 5 * 60 * 1000 // 5 minutes
};

// Batch request queue
const batchQueue = {
  queue: {},
  timeouts: {}
};

/**
 * Cache an API response
 * 
 * @param {string} cacheKey - Key to identify the cached response
 * @param {any} data - Response data to cache
 * @param {Object} options - Cache options
 * @param {number} options.ttl - Time to live in milliseconds
 */
export const cacheApiResponse = (cacheKey, data, options = {}) => {
  const { ttl = apiCache.defaultTTL } = options;
  
  // Clear existing timeout if any
  if (apiCache.timeouts[cacheKey]) {
    clearTimeout(apiCache.timeouts[cacheKey]);
  }
  
  // Cache the response
  apiCache.cache[cacheKey] = {
    data,
    timestamp: Date.now()
  };
  
  // Set expiration timeout
  apiCache.timeouts[cacheKey] = setTimeout(() => {
    delete apiCache.cache[cacheKey];
    delete apiCache.timeouts[cacheKey];
  }, ttl);
  
  // Clean up cache if it's too large
  const cacheKeys = Object.keys(apiCache.cache);
  if (cacheKeys.length > apiCache.maxSize) {
    // Sort by timestamp (oldest first)
    const oldestKey = cacheKeys
      .sort((a, b) => apiCache.cache[a].timestamp - apiCache.cache[b].timestamp)
      [0];
    
    // Remove oldest entry
    delete apiCache.cache[oldestKey];
    if (apiCache.timeouts[oldestKey]) {
      clearTimeout(apiCache.timeouts[oldestKey]);
      delete apiCache.timeouts[oldestKey];
    }
  }
};

/**
 * Get a cached API response
 * 
 * @param {string} cacheKey - Key to identify the cached response
 * @returns {any|null} Cached response data or null if not found
 */
export const getCachedApiResponse = (cacheKey) => {
  if (apiCache.cache[cacheKey]) {
    return apiCache.cache[cacheKey].data;
  }
  
  return null;
};

/**
 * Clear a specific cached API response
 * 
 * @param {string} cacheKey - Key to identify the cached response
 */
export const clearCachedApiResponse = (cacheKey) => {
  if (apiCache.cache[cacheKey]) {
    delete apiCache.cache[cacheKey];
  }
  
  if (apiCache.timeouts[cacheKey]) {
    clearTimeout(apiCache.timeouts[cacheKey]);
    delete apiCache.timeouts[cacheKey];
  }
};

/**
 * Clear all cached API responses
 */
export const clearAllCachedApiResponses = () => {
  // Clear all timeouts
  Object.values(apiCache.timeouts).forEach(timeout => {
    clearTimeout(timeout);
  });
  
  // Reset cache and timeouts
  apiCache.cache = {};
  apiCache.timeouts = {};
};

/**
 * Make an API request with caching and performance monitoring
 * 
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} cacheOptions - Cache options
 * @param {boolean} cacheOptions.useCache - Whether to use cache
 * @param {string} cacheOptions.cacheKey - Custom cache key
 * @param {number} cacheOptions.ttl - Time to live in milliseconds
 * @returns {Promise<any>} Promise that resolves with the response data
 */
export const optimizedFetch = async (url, options = {}, cacheOptions = {}) => {
  const {
    useCache = true,
    cacheKey = `${options.method || 'GET'}-${url}`,
    ttl = apiCache.defaultTTL
  } = cacheOptions;
  
  // Check cache if enabled
  if (useCache) {
    const cachedResponse = getCachedApiResponse(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  // Start performance monitoring
  const startTime = performance.now();
  
  try {
    // Make the request
    const response = await fetch(url, options);
    
    // Parse the response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Cache the response if successful
    if (useCache && response.ok) {
      cacheApiResponse(cacheKey, data, { ttl });
    }
    
    // Track API call performance
    performanceMonitor.trackApiCall(
      `${options.method || 'GET'} ${url}`,
      startTime,
      response.ok
    );
    
    // Return the data
    return data;
  } catch (error) {
    // Track API call failure
    performanceMonitor.trackApiCall(
      `${options.method || 'GET'} ${url}`,
      startTime,
      false
    );
    
    throw error;
  }
};

/**
 * Make an API request with automatic retry logic
 * 
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} retryOptions - Retry options
 * @param {number} retryOptions.maxRetries - Maximum number of retries
 * @param {number} retryOptions.retryDelay - Delay between retries in milliseconds
 * @param {Function} retryOptions.shouldRetry - Function to determine if a retry should be attempted
 * @returns {Promise<any>} Promise that resolves with the response data
 */
export const fetchWithRetry = async (url, options = {}, retryOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    shouldRetry = (error, retryCount) => retryCount < maxRetries
  } = retryOptions;
  
  let retryCount = 0;
  
  const executeRequest = async () => {
    try {
      return await optimizedFetch(url, options);
    } catch (error) {
      if (shouldRetry(error, retryCount)) {
        retryCount++;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
        
        // Retry the request
        return executeRequest();
      }
      
      throw error;
    }
  };
  
  return executeRequest();
};

/**
 * Batch multiple API requests into a single request
 * 
 * @param {string} batchKey - Key to identify the batch
 * @param {Function} batchProcessor - Function to process the batch
 * @param {any} requestData - Data for this specific request
 * @param {Object} options - Batch options
 * @param {number} options.delay - Delay before processing the batch in milliseconds
 * @param {number} options.maxBatchSize - Maximum batch size
 * @returns {Promise<any>} Promise that resolves with the response data
 */
export const batchRequest = (batchKey, batchProcessor, requestData, options = {}) => {
  const {
    delay = 50,
    maxBatchSize = 20
  } = options;
  
  return new Promise((resolve, reject) => {
    // Initialize queue if it doesn't exist
    if (!batchQueue.queue[batchKey]) {
      batchQueue.queue[batchKey] = [];
    }
    
    // Add request to queue
    batchQueue.queue[batchKey].push({
      data: requestData,
      resolve,
      reject
    });
    
    // Clear existing timeout
    if (batchQueue.timeouts[batchKey]) {
      clearTimeout(batchQueue.timeouts[batchKey]);
    }
    
    // Process batch immediately if it reaches max size
    if (batchQueue.queue[batchKey].length >= maxBatchSize) {
      processBatch(batchKey, batchProcessor);
      return;
    }
    
    // Set timeout to process batch
    batchQueue.timeouts[batchKey] = setTimeout(() => {
      processBatch(batchKey, batchProcessor);
    }, delay);
  });
};

/**
 * Process a batch of requests
 * 
 * @param {string} batchKey - Key to identify the batch
 * @param {Function} batchProcessor - Function to process the batch
 */
const processBatch = async (batchKey, batchProcessor) => {
  // Get the batch
  const batch = batchQueue.queue[batchKey] || [];
  
  // Clear the queue
  batchQueue.queue[batchKey] = [];
  
  // Clear the timeout
  if (batchQueue.timeouts[batchKey]) {
    clearTimeout(batchQueue.timeouts[batchKey]);
    delete batchQueue.timeouts[batchKey];
  }
  
  if (batch.length === 0) {
    return;
  }
  
  // Extract data from batch
  const batchData = batch.map(item => item.data);
  
  try {
    // Process the batch
    const results = await batchProcessor(batchData);
    
    // Resolve each promise with its result
    batch.forEach((item, index) => {
      item.resolve(results[index]);
    });
  } catch (error) {
    // Reject all promises with the error
    batch.forEach(item => {
      item.reject(error);
    });
  }
};

/**
 * Debounce an API call
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Debounce wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounceApiCall = (func, wait = 300) => {
  let timeout;
  
  return function(...args) {
    const context = this;
    
    clearTimeout(timeout);
    
    return new Promise(resolve => {
      timeout = setTimeout(async () => {
        const result = await func.apply(context, args);
        resolve(result);
      }, wait);
    });
  };
};

/**
 * Throttle an API call
 * 
 * @param {Function} func - Function to throttle
 * @param {number} limit - Throttle limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttleApiCall = (func, limit = 300) => {
  let inThrottle = false;
  let lastResult = null;
  
  return function(...args) {
    const context = this;
    
    if (!inThrottle) {
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
      
      return func.apply(context, args);
    }
    
    return Promise.resolve(lastResult);
  };
};

export default {
  optimizedFetch,
  fetchWithRetry,
  batchRequest,
  cacheApiResponse,
  getCachedApiResponse,
  clearCachedApiResponse,
  clearAllCachedApiResponses,
  debounceApiCall,
  throttleApiCall
};