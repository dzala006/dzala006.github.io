/**
 * analytics.js - Sentry integration for the Personalized Adventure App
 * 
 * This utility provides functions for error tracking, performance monitoring,
 * and user event tracking throughout the application using Sentry.
 */

import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Placeholder DSN - Replace with your actual Sentry DSN in production
const SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';

/**
 * Initialize Sentry with the proper configuration
 * 
 * Call this function in your App.js before rendering any components
 */
export const initializeSentry = () => {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      enableInExpoDevelopment: true,
      debug: __DEV__, // Enable debug in development mode
      // Set your release and environment
      release: Constants.manifest.version,
      environment: __DEV__ ? 'development' : 'production',
      // Configure additional options
      integrations: [
        new Sentry.Native.ReactNativeTracing({
          // Pass tracing options
          tracingOrigins: ['localhost', 'api.personalizedadventure.com'],
          routingInstrumentation: new Sentry.Native.ReactNavigationInstrumentation(),
        }),
      ],
      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
      tracesSampleRate: 1.0,
    });

    // Log successful initialization
    console.log('Sentry initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
    return false;
  }
};

/**
 * Set user information for better error context
 * 
 * @param {Object} user - User object containing id, email, and username
 */
export const setUserContext = (user) => {
  if (!user || !user.id) return;
  
  Sentry.Native.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

/**
 * Clear user context when user logs out
 */
export const clearUserContext = () => {
  Sentry.Native.setUser(null);
};

/**
 * Capture an error with additional context
 * 
 * @param {Error} error - The error object to capture
 * @param {Object} context - Additional context for the error
 */
export const captureError = (error, context = {}) => {
  Sentry.Native.withScope((scope) => {
    // Add additional context to the error
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    
    // Capture the error
    Sentry.Native.captureException(error);
  });
};

/**
 * Log a message to Sentry
 * 
 * @param {string} message - The message to log
 * @param {string} level - The log level (info, warning, error)
 * @param {Object} context - Additional context for the message
 */
export const logMessage = (message, level = 'info', context = {}) => {
  Sentry.Native.withScope((scope) => {
    // Add additional context to the message
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    
    // Capture the message with the specified level
    Sentry.Native.captureMessage(message, level);
  });
};

/**
 * Start a performance transaction for monitoring
 * 
 * @param {string} name - The name of the transaction
 * @param {string} op - The operation category (e.g., 'navigation', 'http', 'ui.load')
 * @returns {Object} - The transaction object
 */
export const startTransaction = (name, op) => {
  return Sentry.Native.startTransaction({
    name,
    op,
  });
};

/**
 * Track user events for analytics
 * 
 * @param {string} eventName - The name of the event
 * @param {Object} eventData - Additional data for the event
 */
export const trackEvent = (eventName, eventData = {}) => {
  Sentry.Native.addBreadcrumb({
    category: 'user.event',
    message: eventName,
    data: eventData,
    level: 'info',
  });
  
  // You can also use custom Sentry metrics for more detailed analytics
  // This is a placeholder for future implementation
  console.log(`Event tracked: ${eventName}`, eventData);
};

/**
 * Track user registration
 * 
 * @param {string} method - The registration method (email, social, etc.)
 * @param {boolean} success - Whether the registration was successful
 * @param {Object} additionalData - Additional data about the registration
 */
export const trackUserRegistration = (method, success, additionalData = {}) => {
  trackEvent('user.register', {
    method,
    success,
    ...additionalData,
  });
};

/**
 * Track user login
 * 
 * @param {string} method - The login method (email, social, etc.)
 * @param {boolean} success - Whether the login was successful
 * @param {Object} additionalData - Additional data about the login
 */
export const trackUserLogin = (method, success, additionalData = {}) => {
  trackEvent('user.login', {
    method,
    success,
    ...additionalData,
  });
};

/**
 * Track itinerary generation
 * 
 * @param {string} itineraryId - The ID of the generated itinerary
 * @param {Object} preferences - The preferences used for generation
 * @param {number} generationTime - The time taken to generate the itinerary (ms)
 */
export const trackItineraryGeneration = (itineraryId, preferences, generationTime) => {
  trackEvent('itinerary.generate', {
    itineraryId,
    preferences,
    generationTime,
  });
};

/**
 * Track reservation attempt
 * 
 * @param {string} activityId - The ID of the activity being reserved
 * @param {string} provider - The reservation provider (OpenTable, Viator, etc.)
 * @param {boolean} success - Whether the reservation was successful
 * @param {boolean} usedFallback - Whether the AI fallback was used
 * @param {Object} additionalData - Additional data about the reservation
 */
export const trackReservation = (activityId, provider, success, usedFallback, additionalData = {}) => {
  trackEvent('reservation.attempt', {
    activityId,
    provider,
    success,
    usedFallback,
    ...additionalData,
  });
};

/**
 * Track feedback submission
 * 
 * @param {string} questionId - The ID of the feedback question
 * @param {string} responseType - The type of response (text, rating, etc.)
 * @param {Object} additionalData - Additional data about the feedback
 */
export const trackFeedbackSubmission = (questionId, responseType, additionalData = {}) => {
  trackEvent('feedback.submit', {
    questionId,
    responseType,
    ...additionalData,
  });
};

/**
 * Track app performance metrics
 * 
 * @param {string} screenName - The name of the screen being measured
 * @param {number} loadTime - The time taken to load the screen (ms)
 * @param {Object} additionalMetrics - Additional performance metrics
 */
export const trackPerformance = (screenName, loadTime, additionalMetrics = {}) => {
  trackEvent('performance.measure', {
    screenName,
    loadTime,
    ...additionalMetrics,
  });
};

/**
 * Configure Sentry for production use
 * 
 * This guide explains how to properly configure Sentry in a production environment:
 * 
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new project for React Native
 * 3. Get your DSN from the project settings
 * 4. Replace the placeholder DSN in this file with your actual DSN
 * 5. Install the required dependencies:
 *    - npm install sentry-expo
 *    - expo install expo-constants
 * 6. Add the Sentry plugin to your app.json:
 *    {
 *      "expo": {
 *        "plugins": [
 *          [
 *            "sentry-expo",
 *            {
 *              "organization": "your-org-name",
 *              "project": "your-project-name"
 *            }
 *          ]
 *        ]
 *      }
 *    }
 * 7. Initialize Sentry in your App.js file:
 *    import { initializeSentry } from './src/utils/analytics';
 *    
 *    // Initialize Sentry before rendering any components
 *    initializeSentry();
 * 
 * 8. Set up source maps for production builds:
 *    - Add the following to your package.json scripts:
 *      "postpublish": "sentry-expo upload-sourcemaps"
 */