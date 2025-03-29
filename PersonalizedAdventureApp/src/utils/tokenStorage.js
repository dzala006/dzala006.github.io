/**
 * Token Storage Utility
 * 
 * This utility provides functions for securely storing and retrieving
 * JWT tokens using Expo SecureStore with AsyncStorage fallback.
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for storage keys
const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';

/**
 * Check if SecureStore is available on the device
 * @returns {Promise<boolean>} True if SecureStore is available
 */
const isSecureStoreAvailable = async () => {
  try {
    return await SecureStore.isAvailableAsync();
  } catch (error) {
    console.warn('SecureStore availability check failed:', error);
    return false;
  }
};

/**
 * Store authentication token securely
 * @param {string} token - JWT token to store
 * @param {number} expiryTime - Token expiry timestamp (optional)
 * @returns {Promise<boolean>} True if token was stored successfully
 */
export const storeToken = async (token, expiryTime = null) => {
  try {
    // Calculate expiry time if not provided (default to 24 hours)
    const expiry = expiryTime || Date.now() + 24 * 60 * 60 * 1000;
    
    // Check if SecureStore is available
    const secureStoreAvailable = await isSecureStoreAvailable();
    
    if (secureStoreAvailable) {
      // Store token in SecureStore
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiry.toString());
    } else {
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
      console.warn('Using AsyncStorage for token storage as SecureStore is not available');
    }
    
    return true;
  } catch (error) {
    console.error('Error storing token:', error);
    return false;
  }
};

/**
 * Retrieve the stored authentication token
 * @returns {Promise<string|null>} The stored token or null if not found or expired
 */
export const getToken = async () => {
  try {
    // Check if SecureStore is available
    const secureStoreAvailable = await isSecureStoreAvailable();
    
    let token, expiryTimeStr;
    
    if (secureStoreAvailable) {
      // Get token from SecureStore
      token = await SecureStore.getItemAsync(TOKEN_KEY);
      expiryTimeStr = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
    } else {
      // Fallback to AsyncStorage
      token = await AsyncStorage.getItem(TOKEN_KEY);
      expiryTimeStr = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);
    }
    
    // If no token found, return null
    if (!token) {
      return null;
    }
    
    // Check if token is expired
    if (expiryTimeStr) {
      const expiryTime = parseInt(expiryTimeStr, 10);
      if (Date.now() > expiryTime) {
        // Token is expired, remove it
        await removeToken();
        return null;
      }
    }
    
    return token;
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

/**
 * Remove the stored authentication token
 * @returns {Promise<boolean>} True if token was removed successfully
 */
export const removeToken = async () => {
  try {
    // Check if SecureStore is available
    const secureStoreAvailable = await isSecureStoreAvailable();
    
    if (secureStoreAvailable) {
      // Remove token from SecureStore
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
    } else {
      // Fallback to AsyncStorage
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(TOKEN_EXPIRY_KEY);
    }
    
    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
};

/**
 * Check if the user is authenticated (has a valid token)
 * @returns {Promise<boolean>} True if user is authenticated
 */
export const isAuthenticated = async () => {
  const token = await getToken();
  return token !== null;
};

/**
 * Parse JWT token to get payload data
 * @param {string} token - JWT token to parse
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const parseToken = (token) => {
  try {
    if (!token) return null;
    
    // Split the token and get the payload part
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode the payload
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

export default {
  storeToken,
  getToken,
  removeToken,
  isAuthenticated,
  parseToken
};