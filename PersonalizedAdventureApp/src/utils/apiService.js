/**
 * API Service Utility
 * 
 * This utility provides functions for making API requests with JWT authentication.
 * It integrates with the tokenStorage utility to automatically include the JWT token
 * in requests and handle token expiration.
 */

import { optimizedFetch, fetchWithRetry } from './apiOptimizer';
import { getToken, removeToken, storeToken } from './tokenStorage';

// Base URL for API requests
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Add authentication headers to request options
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Request options with auth headers
 */
const addAuthHeaders = async (options = {}) => {
  const token = await getToken();
  
  // Initialize headers if not present
  if (!options.headers) {
    options.headers = {};
  }
  
  // Add content type if not present
  if (!options.headers['Content-Type']) {
    options.headers['Content-Type'] = 'application/json';
  }
  
  // Add token if available
  if (token) {
    options.headers['x-auth-token'] = token;
  }
  
  return options;
};

/**
 * Handle API response errors
 * @param {Object} response - API response object
 * @returns {Promise<Object>} Parsed response data
 * @throws {Error} If response is not successful
 */
const handleResponse = async (response) => {
  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  
  // Parse response data
  const data = isJson ? await response.json() : await response.text();
  
  // Handle successful response
  if (response.ok) {
    return data;
  }
  
  // Handle authentication errors
  if (response.status === 401) {
    // Token is invalid or expired, remove it
    await removeToken();
    
    // Throw error with message from response if available
    throw new Error(
      (isJson && data.message) || 'Authentication failed. Please log in again.'
    );
  }
  
  // Handle other errors
  throw new Error(
    (isJson && data.message) || `Request failed with status ${response.status}`
  );
};

/**
 * Make an authenticated GET request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response data
 */
export const get = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const authOptions = await addAuthHeaders(options);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      ...authOptions
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`GET request to ${endpoint} failed:`, error);
    throw error;
  }
};

/**
 * Make an authenticated POST request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response data
 */
export const post = async (endpoint, data = {}, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const authOptions = await addAuthHeaders(options);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...authOptions
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`POST request to ${endpoint} failed:`, error);
    throw error;
  }
};

/**
 * Make an authenticated PUT request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response data
 */
export const put = async (endpoint, data = {}, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const authOptions = await addAuthHeaders(options);
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...authOptions
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`PUT request to ${endpoint} failed:`, error);
    throw error;
  }
};

/**
 * Make an authenticated DELETE request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response data
 */
export const del = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const authOptions = await addAuthHeaders(options);
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      ...authOptions
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`DELETE request to ${endpoint} failed:`, error);
    throw error;
  }
};

/**
 * Make an optimized authenticated GET request with caching
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Additional fetch options
 * @param {Object} cacheOptions - Cache options
 * @returns {Promise<Object>} Response data
 */
export const optimizedGet = async (endpoint, options = {}, cacheOptions = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const authOptions = await addAuthHeaders(options);
  
  try {
    const response = await optimizedFetch(
      url,
      {
        method: 'GET',
        ...authOptions
      },
      cacheOptions
    );
    
    return response;
  } catch (error) {
    console.error(`Optimized GET request to ${endpoint} failed:`, error);
    throw error;
  }
};

/**
 * Make an authenticated request with retry logic
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} data - Request body data (for POST/PUT)
 * @param {Object} options - Additional fetch options
 * @param {Object} retryOptions - Retry options
 * @returns {Promise<Object>} Response data
 */
export const fetchWithRetryAuth = async (
  method,
  endpoint,
  data = {},
  options = {},
  retryOptions = {}
) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const authOptions = await addAuthHeaders(options);
  
  // Prepare request options based on method
  const requestOptions = {
    method,
    ...authOptions
  };
  
  // Add body for POST/PUT requests
  if (method === 'POST' || method === 'PUT') {
    requestOptions.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetchWithRetry(url, requestOptions, retryOptions);
    return response;
  } catch (error) {
    console.error(`${method} request with retry to ${endpoint} failed:`, error);
    throw error;
  }
};

/**
 * Login user and store JWT token
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data and success status
 */
export const login = async (email, password) => {
  try {
    const response = await post('/users/login', { email, password });
    
    if (response.success && response.token) {
      // Store the token
      await storeToken(response.token);
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
 * Register a new user
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data and success status
 */
export const register = async (name, email, password) => {
  try {
    const response = await post('/users/register', { name, email, password });
    
    if (response.success && response.token) {
      // Store the token
      await storeToken(response.token);
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
 * Logout user and remove JWT token
 * @returns {Promise<Object>} Success status
 */
export const logout = async () => {
  try {
    // Remove the token
    await removeToken();
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  get,
  post,
  put,
  del,
  optimizedGet,
  fetchWithRetryAuth,
  login,
  register,
  logout
};