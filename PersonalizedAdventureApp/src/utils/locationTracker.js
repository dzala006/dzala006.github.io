/**
 * @fileoverview Location tracking utility for the Personalized Adventure App
 * Uses Expo Location to continuously track the user's current location in real time
 * and provides callbacks for location changes to update recommendations.
 */

import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { generateDynamicItinerary } from './aiPersonalization';

// Configuration constants
const LOCATION_ACCURACY = Location.Accuracy.High;
const LOCATION_DISTANCE_THRESHOLD = 100; // meters
const LOCATION_TIME_INTERVAL = 5000; // milliseconds
const LOCATION_FOREGROUND_SERVICE_NAME = 'Personalized Adventure Location Tracking';
const LOCATION_FOREGROUND_SERVICE_TYPE = 'location';

// Store the current location subscription
let locationSubscription = null;

// Store the current location
let currentLocation = null;

// Store the callback functions
const locationChangeCallbacks = new Set();

/**
 * Request location permissions from the user
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export const requestLocationPermissions = async () => {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      console.error('Location permission denied');
      return false;
    }

    // For Android, we need background permissions for continuous tracking
    if (Platform.OS === 'android') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission denied, tracking will only work in foreground');
        // We can still track in foreground, so we return true
      }
    }

    return true;
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return false;
  }
};

/**
 * Start tracking the user's location
 * @param {Function} onLocationChange - Callback function to be called when location changes
 * @param {number} distanceThreshold - Distance threshold in meters (default: 100)
 * @returns {Promise<boolean>} Whether tracking was started successfully
 */
export const startLocationTracking = async (
  onLocationChange = null,
  distanceThreshold = LOCATION_DISTANCE_THRESHOLD
) => {
  try {
    // Request permissions first
    const permissionsGranted = await requestLocationPermissions();
    if (!permissionsGranted) {
      return false;
    }

    // Check if location services are enabled
    const isLocationEnabled = await Location.hasServicesEnabledAsync();
    if (!isLocationEnabled) {
      console.error('Location services are disabled');
      return false;
    }

    // If we already have a subscription, stop it first
    if (locationSubscription) {
      await stopLocationTracking();
    }

    // Add the callback to our set if provided
    if (onLocationChange && typeof onLocationChange === 'function') {
      locationChangeCallbacks.add(onLocationChange);
    }

    // Start the location updates
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: LOCATION_ACCURACY,
        distanceInterval: distanceThreshold,
        timeInterval: LOCATION_TIME_INTERVAL,
      },
      handleLocationUpdate
    );

    // Get the initial location
    const initialLocation = await getCurrentLocation();
    if (initialLocation) {
      handleLocationUpdate({ coords: initialLocation });
    }

    return true;
  } catch (error) {
    console.error('Error starting location tracking:', error);
    return false;
  }
};

/**
 * Stop tracking the user's location
 */
export const stopLocationTracking = async () => {
  try {
    if (locationSubscription) {
      await locationSubscription.remove();
      locationSubscription = null;
    }
    return true;
  } catch (error) {
    console.error('Error stopping location tracking:', error);
    return false;
  }
};

/**
 * Get the user's current location
 * @returns {Promise<Object|null>} The current location or null if unavailable
 */
export const getCurrentLocation = async () => {
  try {
    // If we already have a current location, return it
    if (currentLocation) {
      return currentLocation;
    }

    // Request permissions first
    const permissionsGranted = await requestLocationPermissions();
    if (!permissionsGranted) {
      return null;
    }

    // Get the current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: LOCATION_ACCURACY,
    });

    // Update our stored location
    currentLocation = location.coords;
    return currentLocation;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

/**
 * Add a callback function to be called when the location changes
 * @param {Function} callback - The callback function
 */
export const addLocationChangeListener = (callback) => {
  if (callback && typeof callback === 'function') {
    locationChangeCallbacks.add(callback);
  }
};

/**
 * Remove a callback function
 * @param {Function} callback - The callback function to remove
 */
export const removeLocationChangeListener = (callback) => {
  if (callback && typeof callback === 'function') {
    locationChangeCallbacks.delete(callback);
  }
};

/**
 * Handle location updates from the subscription
 * @param {Object} location - The location object from Expo Location
 * @private
 */
const handleLocationUpdate = (location) => {
  // Update our stored location
  currentLocation = location.coords;

  // Call all registered callbacks
  locationChangeCallbacks.forEach((callback) => {
    try {
      callback(currentLocation);
    } catch (error) {
      console.error('Error in location change callback:', error);
    }
  });
};

/**
 * Calculate the distance between two coordinates in meters
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @returns {number} Distance in meters
 */
export const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2) return Infinity;

  // Haversine formula to calculate distance between two points on Earth
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Update itinerary suggestions based on the user's current location
 * @param {Object} userData - User data including preferences
 * @param {Object} feedbackData - Recent user feedback
 * @param {Object} weatherData - Weather forecast data
 * @param {Object} eventsData - Local events data
 * @returns {Promise<Object>} Updated itinerary
 */
export const updateItineraryBasedOnLocation = async (
  userData,
  feedbackData,
  weatherData,
  eventsData
) => {
  try {
    // Get the current location
    const location = await getCurrentLocation();
    if (!location) {
      throw new Error('Current location not available');
    }

    // Add the location to the user data
    const enhancedUserData = {
      ...userData,
      currentLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: new Date().toISOString(),
      },
    };

    // Generate a new itinerary with the updated location
    const updatedItinerary = await generateDynamicItinerary(
      enhancedUserData,
      feedbackData,
      weatherData,
      eventsData
    );

    return updatedItinerary;
  } catch (error) {
    console.error('Error updating itinerary based on location:', error);
    throw error;
  }
};

/**
 * Start a foreground service for location tracking (Android only)
 * This is required for background location tracking on Android
 * @returns {Promise<boolean>} Whether the service was started successfully
 */
export const startLocationForegroundService = async () => {
  if (Platform.OS !== 'android') {
    // Not needed on iOS
    return true;
  }

  try {
    await Location.startLocationUpdatesAsync(LOCATION_FOREGROUND_SERVICE_NAME, {
      accuracy: LOCATION_ACCURACY,
      distanceInterval: LOCATION_DISTANCE_THRESHOLD,
      timeInterval: LOCATION_TIME_INTERVAL,
      foregroundService: {
        notificationTitle: 'Personalized Adventure is tracking your location',
        notificationBody: 'This is used to provide you with personalized recommendations',
        notificationColor: '#4A90E2',
      },
      activityType: Location.ActivityType.Fitness,
    });
    return true;
  } catch (error) {
    console.error('Error starting location foreground service:', error);
    return false;
  }
};

/**
 * Stop the foreground service for location tracking (Android only)
 */
export const stopLocationForegroundService = async () => {
  if (Platform.OS !== 'android') {
    // Not needed on iOS
    return true;
  }

  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_FOREGROUND_SERVICE_NAME
    );
    
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_FOREGROUND_SERVICE_NAME);
    }
    return true;
  } catch (error) {
    console.error('Error stopping location foreground service:', error);
    return false;
  }
};

/**
 * Get nearby points of interest based on the current location
 * @param {number} radius - Search radius in meters
 * @param {Array<string>} categories - Categories of POIs to search for
 * @returns {Promise<Array<Object>>} Array of nearby points of interest
 */
export const getNearbyPointsOfInterest = async (radius = 1000, categories = []) => {
  try {
    const location = await getCurrentLocation();
    if (!location) {
      throw new Error('Current location not available');
    }

    // This would typically call an external API like Google Places
    // For now, we'll simulate this with a placeholder implementation
    console.log(`Searching for POIs within ${radius}m of ${location.latitude}, ${location.longitude}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return simulated data
    return [
      {
        id: 'poi1',
        name: 'Local Museum',
        category: 'culture',
        location: {
          latitude: location.latitude + 0.001,
          longitude: location.longitude + 0.001,
        },
        distance: 150, // meters
        rating: 4.5,
      },
      {
        id: 'poi2',
        name: 'City Park',
        category: 'outdoors',
        location: {
          latitude: location.latitude - 0.001,
          longitude: location.longitude - 0.002,
        },
        distance: 300, // meters
        rating: 4.8,
      },
      {
        id: 'poi3',
        name: 'Popular Restaurant',
        category: 'food',
        location: {
          latitude: location.latitude + 0.002,
          longitude: location.longitude - 0.001,
        },
        distance: 450, // meters
        rating: 4.2,
      },
    ].filter(poi => {
      // Filter by categories if provided
      if (categories.length === 0) return true;
      return categories.includes(poi.category);
    });
  } catch (error) {
    console.error('Error getting nearby points of interest:', error);
    return [];
  }
};

export default {
  requestLocationPermissions,
  startLocationTracking,
  stopLocationTracking,
  getCurrentLocation,
  addLocationChangeListener,
  removeLocationChangeListener,
  calculateDistance,
  updateItineraryBasedOnLocation,
  startLocationForegroundService,
  stopLocationForegroundService,
  getNearbyPointsOfInterest,
};