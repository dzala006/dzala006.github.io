/**
 * Analytics Utility using Sentry
 * 
 * This utility provides functions for tracking errors, performance metrics,
 * and key user events in the Personalized Adventure App using Sentry.
 * 
 * To use in production:
 * 1. Create a Sentry account and project at https://sentry.io
 * 2. Replace the placeholder DSN with your actual project DSN
 * 3. Configure additional options as needed (environment, release, etc.)
 */

import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Placeholder DSN - Replace with your actual Sentry DSN in production
const SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';

/**
 * Initialize Sentry with configuration options
 * 
 * @param {Object} options - Additional configuration options
 * @param {string} options.environment - Environment name (e.g., 'production', 'development')
 * @param {string} options.release - App release version
 * @returns {boolean} - Whether initialization was successful
 */
export const initializeSentry = (options = {}) => {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      enableInExpoDevelopment: true,
      debug: __DEV__, // Enable debug in development mode
      
      // Additional configuration
      environment: options.environment || (__DEV__ ? 'development' : 'production'),
      release: options.release || `${Constants.manifest.name}@${Constants.manifest.version}`,
      
      // Set tags for easier filtering in Sentry dashboard
      initialScope: {
        tags: {
          platform: Platform.OS,
          deviceModel: Platform.OS === 'ios' ? Constants.platform.ios.model : Constants.deviceName,
          appVersion: Constants.manifest.version
        }
      },
      
      // Configure which errors to capture
      beforeSend(event) {
        // Filter out specific errors if needed
        if (event.exception && 
            event.exception.values && 
            event.exception.values[0] && 
            event.exception.values[0].value) {
          
          // Example: Don't send network errors in development
          if (__DEV__ && event.exception.values[0].value.includes('Network request failed')) {
            return null;
          }
        }
        return event;
      }
    });
    
    console.log('Sentry initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
    return false;
  }
};

/**
 * Capture an error with additional context
 * 
 * @param {Error} error - The error object to capture
 * @param {Object} context - Additional context for the error
 * @param {string} context.level - Error level ('fatal', 'error', 'warning', 'info', 'debug')
 * @param {Object} context.tags - Key-value pairs for filtering in Sentry dashboard
 * @param {Object} context.extra - Additional data to attach to the error
 */
export const captureError = (error, context = {}) => {
  try {
    Sentry.Native.withScope(scope => {
      // Set error level
      if (context.level) {
        scope.setLevel(context.level);
      }
      
      // Add tags for filtering
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      
      // Add extra context data
      if (context.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      
      // Capture the error
      Sentry.Native.captureException(error);
    });
  } catch (e) {
    console.error('Failed to capture error in Sentry:', e);
  }
};

/**
 * Capture a message with additional context
 * 
 * @param {string} message - The message to capture
 * @param {Object} context - Additional context for the message
 * @param {string} context.level - Message level ('fatal', 'error', 'warning', 'info', 'debug')
 * @param {Object} context.tags - Key-value pairs for filtering in Sentry dashboard
 * @param {Object} context.extra - Additional data to attach to the message
 */
export const captureMessage = (message, context = {}) => {
  try {
    Sentry.Native.withScope(scope => {
      // Set message level
      if (context.level) {
        scope.setLevel(context.level);
      }
      
      // Add tags for filtering
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      
      // Add extra context data
      if (context.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      
      // Capture the message
      Sentry.Native.captureMessage(message);
    });
  } catch (e) {
    console.error('Failed to capture message in Sentry:', e);
  }
};

/**
 * Start a performance transaction for monitoring
 * 
 * @param {string} name - Name of the transaction
 * @param {string} operation - Type of operation (e.g., 'navigation', 'http', 'ui.render')
 * @returns {Object} - Transaction object with start and finish methods
 */
export const startTransaction = (name, operation) => {
  try {
    const transaction = Sentry.Native.startTransaction({
      name,
      op: operation
    });
    
    return {
      // The transaction object
      transaction,
      
      // Start a child span within this transaction
      startChild: (childName, childOp) => {
        const span = transaction.startChild({
          op: childOp,
          description: childName
        });
        
        return {
          span,
          finish: () => {
            span.finish();
          }
        };
      },
      
      // Finish the transaction
      finish: () => {
        transaction.finish();
      }
    };
  } catch (e) {
    console.error('Failed to start transaction in Sentry:', e);
    // Return a dummy transaction object that won't throw errors when used
    return {
      transaction: null,
      startChild: () => ({ span: null, finish: () => {} }),
      finish: () => {}
    };
  }
};

/**
 * Set user information for better error tracking
 * 
 * @param {Object} user - User information
 * @param {string} user.id - User ID
 * @param {string} user.email - User email
 * @param {string} user.username - User username
 */
export const setUser = (user) => {
  try {
    Sentry.Native.setUser(user);
  } catch (e) {
    console.error('Failed to set user in Sentry:', e);
  }
};

/**
 * Clear user information (e.g., on logout)
 */
export const clearUser = () => {
  try {
    Sentry.Native.setUser(null);
  } catch (e) {
    console.error('Failed to clear user in Sentry:', e);
  }
};

/**
 * Set a global tag for all future events
 * 
 * @param {string} key - Tag key
 * @param {string} value - Tag value
 */
export const setTag = (key, value) => {
  try {
    Sentry.Native.setTag(key, value);
  } catch (e) {
    console.error('Failed to set tag in Sentry:', e);
  }
};

/**
 * Track a user event with custom data
 * 
 * @param {string} eventName - Name of the event
 * @param {Object} data - Additional data for the event
 */
export const trackEvent = (eventName, data = {}) => {
  try {
    // Create a standardized event name
    const formattedEventName = `app.event.${eventName.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Capture as a breadcrumb (for error context) and as a message (for standalone events)
    Sentry.Native.addBreadcrumb({
      category: 'app.event',
      message: formattedEventName,
      data,
      level: 'info'
    });
    
    captureMessage(`Event: ${eventName}`, {
      level: 'info',
      tags: { event_type: eventName },
      extra: data
    });
  } catch (e) {
    console.error('Failed to track event in Sentry:', e);
  }
};

// Predefined event tracking functions for common app events

/**
 * Track user registration
 * 
 * @param {Object} userData - User data (excluding sensitive information)
 */
export const trackUserRegistration = (userData) => {
  const safeUserData = {
    hasCompletedSurvey: userData.hasCompletedSurvey || false,
    preferenceCount: userData.preferences ? Object.keys(userData.preferences).length : 0,
    // Include other non-sensitive user data
  };
  
  trackEvent('user_registration', safeUserData);
};

/**
 * Track user login
 */
export const trackUserLogin = () => {
  trackEvent('user_login');
};

/**
 * Track itinerary generation
 * 
 * @param {Object} itineraryData - Data about the generated itinerary
 */
export const trackItineraryGeneration = (itineraryData) => {
  const itineraryMetrics = {
    activityCount: itineraryData.activities ? itineraryData.activities.length : 0,
    hasReservations: itineraryData.hasReservations || false,
    generationTime: itineraryData.generationTime || 0,
    usedAI: itineraryData.usedAI || true,
    // Include other non-sensitive itinerary data
  };
  
  trackEvent('itinerary_generation', itineraryMetrics);
};

/**
 * Track reservation creation
 * 
 * @param {Object} reservationData - Data about the reservation
 */
export const trackReservation = (reservationData) => {
  const reservationMetrics = {
    activityType: reservationData.activityType,
    usedFallback: reservationData.usedFallback || false,
    successful: reservationData.successful || true,
    // Include other non-sensitive reservation data
  };
  
  trackEvent('reservation_created', reservationMetrics);
};

/**
 * Track feedback submission
 * 
 * @param {Object} feedbackData - Data about the feedback
 */
export const trackFeedbackSubmission = (feedbackData) => {
  const feedbackMetrics = {
    questionType: feedbackData.questionType,
    responseTime: feedbackData.responseTime || 0,
    // Include other non-sensitive feedback data
  };
  
  trackEvent('feedback_submitted', feedbackMetrics);
};

/**
 * Track collaborative itinerary creation
 * 
 * @param {Object} collaborationData - Data about the collaboration
 */
export const trackCollaborativeItinerary = (collaborationData) => {
  const collaborationMetrics = {
    participantCount: collaborationData.participantCount || 2,
    preferenceConflicts: collaborationData.preferenceConflicts || 0,
    resolutionTime: collaborationData.resolutionTime || 0,
    // Include other non-sensitive collaboration data
  };
  
  trackEvent('collaborative_itinerary_created', collaborationMetrics);
};

/**
 * Track app performance metrics
 * 
 * @param {Object} metrics - Performance metrics
 */
export const trackPerformanceMetrics = (metrics) => {
  trackEvent('performance_metrics', metrics);
};

export default {
  initializeSentry,
  captureError,
  captureMessage,
  startTransaction,
  setUser,
  clearUser,
  setTag,
  trackEvent,
  trackUserRegistration,
  trackUserLogin,
  trackItineraryGeneration,
  trackReservation,
  trackFeedbackSubmission,
  trackCollaborativeItinerary,
  trackPerformanceMetrics
};