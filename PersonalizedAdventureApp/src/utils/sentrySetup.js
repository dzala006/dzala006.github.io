/**
 * Sentry setup and configuration for the Personalized Adventure App
 * This file initializes Sentry and provides utility functions for error tracking
 */

import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Initialize Sentry with the provided DSN and configuration
 * This should be called early in the app lifecycle, typically in App.js
 */
export const initializeSentry = () => {
  // The DSN will be automatically configured by the Sentry wizard
  // You can replace this with your actual DSN if needed
  Sentry.init({
    // This will be replaced by the Sentry wizard
    dsn: "REPLACE_WITH_YOUR_DSN",
    
    // Set environment based on release channel
    environment: __DEV__ ? "development" : "production",
    
    // Enable performance monitoring
    enableAutoPerformanceTracking: true,
    
    // Configure debug mode in development
    debug: __DEV__,
    
    // Set release version from app.json
    release: `${Constants.manifest.name}@${Constants.manifest.version}`,
    
    // Additional configuration
    integrations: [
      new Sentry.Native.ReactNativeTracing({
        // Performance monitoring options
        tracingOrigins: ["localhost", /^\//, /^https:\/\//],
        routingInstrumentation: new Sentry.Native.ReactNavigationInstrumentation(),
      }),
    ],
    
    // Set allowed domains for CSP
    allowUrls: [
      // Add your API domains here
    ],
    
    // Configure beforeSend to sanitize sensitive data
    beforeSend(event) {
      // You can modify the event here to remove sensitive data
      return event;
    },
  });
  
  // Set tags for easier filtering in the Sentry dashboard
  Sentry.Native.setTag("platform", Platform.OS);
  Sentry.Native.setTag("device", Platform.OS === 'ios' ? 'iPhone' : 'Android');
  
  console.log('Sentry initialized successfully');
};

/**
 * Set user information in Sentry for better error context
 * Call this when a user logs in
 * 
 * @param {string} id - User ID
 * @param {Object} userData - Additional user data (email, username, etc.)
 */
export const setUser = (id, userData = {}) => {
  Sentry.Native.setUser({
    id,
    ...userData,
  });
};

/**
 * Clear user information from Sentry
 * Call this when a user logs out
 */
export const clearUser = () => {
  Sentry.Native.setUser(null);
};

/**
 * Capture an exception with additional context
 * 
 * @param {Error} error - The error object to capture
 * @param {Object} context - Additional context for the error
 */
export const captureException = (error, context = {}) => {
  Sentry.Native.withScope((scope) => {
    // Add additional context to the error
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    
    // Capture the exception
    Sentry.Native.captureException(error);
  });
};

/**
 * Start a performance transaction for monitoring
 * 
 * @param {string} name - Name of the transaction
 * @param {string} op - Operation type (e.g., 'navigation', 'http', 'db')
 * @returns {Object} - Transaction object
 */
export const startTransaction = (name, op = 'custom') => {
  return Sentry.Native.startTransaction({
    name,
    op,
  });
};

/**
 * Capture a message with additional context
 * 
 * @param {string} message - Message to capture
 * @param {string} level - Severity level ('info', 'warning', 'error', etc.)
 * @param {Object} context - Additional context for the message
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  Sentry.Native.withScope((scope) => {
    // Set the severity level
    scope.setLevel(level);
    
    // Add additional context
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    
    // Capture the message
    Sentry.Native.captureMessage(message);
  });
};

/**
 * Add breadcrumb for better error context
 * 
 * @param {Object} breadcrumb - Breadcrumb object
 */
export const addBreadcrumb = (breadcrumb) => {
  Sentry.Native.addBreadcrumb(breadcrumb);
};

/**
 * Set a tag for the current scope
 * 
 * @param {string} key - Tag key
 * @param {string} value - Tag value
 */
export const setTag = (key, value) => {
  Sentry.Native.setTag(key, value);
};

/**
 * Configure scope with tags, context, etc.
 * 
 * @param {Function} callback - Callback function that receives the scope
 */
export const configureScope = (callback) => {
  Sentry.Native.configureScope(callback);
};

export default {
  initializeSentry,
  setUser,
  clearUser,
  captureException,
  startTransaction,
  captureMessage,
  addBreadcrumb,
  setTag,
  configureScope,
};