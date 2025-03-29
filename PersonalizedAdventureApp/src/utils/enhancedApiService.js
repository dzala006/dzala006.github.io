/**
 * Enhanced API Service Utility
 * 
 * This utility extends the existing apiService.js with robust retry capabilities
 * using exponential backoff with jitter. It integrates with the enhancedApiRetry.js
 * utility to provide a more resilient API service.
 */

import * as apiService from './apiService';
import { 
  fetchWithExponentialBackoff, 
  fetchWithRetryAndCache,
  enhanceApiServiceWithRetry
} from './enhancedApiRetry';

// Default retry options
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  jitterFactor: 0.2,
  // Only retry on network errors, server errors (5xx), and rate limiting (429)
  shouldRetry: (error, status, retryCount, maxRetries) => {
    if (retryCount >= maxRetries) return false;
    if (!status && (error.name === 'TypeError' || error.message.includes('network'))) return true;
    if (status >= 500 && status < 600) return true;
    if (status === 429) return true;
    return false;
  },
  // Log retry attempts
  onRetry: (retryCount, delay, error) => {
    console.warn(`Retry attempt ${retryCount} after ${delay}ms due to:`, error.message);
  }
};

// Create an enhanced version of the API service with retry capabilities
const enhancedApiService = enhanceApiServiceWithRetry(apiService, DEFAULT_RETRY_OPTIONS);

/**
 * Make a GET request with retry capabilities
 * 
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Additional fetch options
 * @param {Object} retryOptions - Custom retry options to override defaults
 * @returns {Promise<any>} Response data
 */
export const get = async (endpoint, options = {}, retryOptions = {}) => {
  return enhancedApiService.get(endpoint, options, retryOptions);
};

/**
 * Make a POST request with retry capabilities
 * 
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @param {Object} retryOptions - Custom retry options to override defaults
 * @returns {Promise<any>} Response data
 */
export const post = async (endpoint, data = {}, options = {}, retryOptions = {}) => {
  return enhancedApiService.post(endpoint, data, options, retryOptions);
};

/**
 * Make a PUT request with retry capabilities
 * 
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @param {Object} retryOptions - Custom retry options to override defaults
 * @returns {Promise<any>} Response data
 */
export const put = async (endpoint, data = {}, options = {}, retryOptions = {}) => {
  return enhancedApiService.put(endpoint, data, options, retryOptions);
};

/**
 * Make a DELETE request with retry capabilities
 * 
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Additional fetch options
 * @param {Object} retryOptions - Custom retry options to override defaults
 * @returns {Promise<any>} Response data
 */
export const del = async (endpoint, options = {}, retryOptions = {}) => {
  return enhancedApiService.del(endpoint, options, retryOptions);
};

/**
 * Make a GET request with retry capabilities and caching
 * 
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Additional fetch options
 * @param {Object} retryOptions - Custom retry options to override defaults
 * @param {Object} cacheOptions - Cache options
 * @returns {Promise<any>} Response data
 */
export const getCached = async (endpoint, options = {}, retryOptions = {}, cacheOptions = {}) => {
  // Extract base URL from apiService
  const API_BASE_URL = 'http://localhost:3000/api'; // This should match the one in apiService.js
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Add authentication headers
  const authOptions = await apiService.addAuthHeaders(options);
  
  // Make the request with retry and cache
  return fetchWithRetryAndCache(
    url,
    {
      method: 'GET',
      ...authOptions
    },
    { ...DEFAULT_RETRY_OPTIONS, ...retryOptions },
    cacheOptions
  );
};

/**
 * Login user with retry capabilities
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} retryOptions - Custom retry options to override defaults
 * @returns {Promise<Object>} User data and success status
 */
export const login = async (email, password, retryOptions = {}) => {
  try {
    // Use enhanced post method with retry
    const response = await post('/users/login', { email, password }, {}, retryOptions);
    
    if (response.success && response.token) {
      // Store the token using the original apiService method
      await apiService.storeToken(response.token);
      return {
        success: true,
        user: response.data
      };
    }
    
    return {
      success: false,
      error: response.message || 'Login failed'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Register a new user with retry capabilities
 * 
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} retryOptions - Custom retry options to override defaults
 * @returns {Promise<Object>} User data and success status
 */
export const register = async (name, email, password, retryOptions = {}) => {
  try {
    // Use enhanced post method with retry
    const response = await post('/users/register', { name, email, password }, {}, retryOptions);
    
    if (response.success && response.token) {
      // Store the token using the original apiService method
      await apiService.storeToken(response.token);
      return {
        success: true,
        user: response.data
      };
    }
    
    return {
      success: false,
      error: response.message || 'Registration failed'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Logout user (no retry needed for this operation)
 * 
 * @returns {Promise<Object>} Success status
 */
export const logout = async () => {
  return apiService.logout();
};

/**
 * Configure retry options for the enhanced API service
 * 
 * @param {Object} options - Retry options to configure
 */
export const configureRetryOptions = (options = {}) => {
  Object.assign(DEFAULT_RETRY_OPTIONS, options);
};

export default {
  get,
  post,
  put,
  del,
  getCached,
  login,
  register,
  logout,
  configureRetryOptions,
  // Export original API service methods for compatibility
  ...apiService
};