/**
 * Offline Cache Utility
 * 
 * This utility provides functions for caching itinerary data locally,
 * allowing the app to work offline and improve performance.
 * It uses AsyncStorage for persistent storage and includes functions
 * to save, retrieve, and update cached data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Constants for storage keys
const ITINERARY_CACHE_KEY_PREFIX = 'itinerary_cache_';
const ITINERARY_CACHE_TIMESTAMP_KEY_PREFIX = 'itinerary_cache_timestamp_';
const ITINERARY_CACHE_LIST_KEY = 'itinerary_cache_list';
const ITINERARY_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Save itinerary data to local cache
 * 
 * @param {string} itineraryId - ID of the itinerary to cache
 * @param {Object} itineraryData - Itinerary data to cache
 * @returns {Promise<boolean>} True if data was cached successfully
 */
export const cacheItinerary = async (itineraryId, itineraryData) => {
  try {
    // Generate cache keys
    const cacheKey = `${ITINERARY_CACHE_KEY_PREFIX}${itineraryId}`;
    const timestampKey = `${ITINERARY_CACHE_TIMESTAMP_KEY_PREFIX}${itineraryId}`;
    
    // Stringify the data
    const jsonData = JSON.stringify(itineraryData);
    
    // Save the data and timestamp
    await AsyncStorage.setItem(cacheKey, jsonData);
    await AsyncStorage.setItem(timestampKey, Date.now().toString());
    
    // Update the list of cached itineraries
    await updateCachedItineraryList(itineraryId);
    
    console.log(`Itinerary ${itineraryId} cached successfully`);
    return true;
  } catch (error) {
    console.error('Error caching itinerary:', error);
    return false;
  }
};

/**
 * Get itinerary data from local cache
 * 
 * @param {string} itineraryId - ID of the itinerary to retrieve
 * @returns {Promise<Object|null>} Cached itinerary data or null if not found
 */
export const getCachedItinerary = async (itineraryId) => {
  try {
    // Generate cache keys
    const cacheKey = `${ITINERARY_CACHE_KEY_PREFIX}${itineraryId}`;
    const timestampKey = `${ITINERARY_CACHE_TIMESTAMP_KEY_PREFIX}${itineraryId}`;
    
    // Get the cached data and timestamp
    const jsonData = await AsyncStorage.getItem(cacheKey);
    const timestamp = await AsyncStorage.getItem(timestampKey);
    
    // If no data found, return null
    if (!jsonData) {
      return null;
    }
    
    // Check if the cache is too old
    if (timestamp) {
      const cacheAge = Date.now() - parseInt(timestamp, 10);
      if (cacheAge > ITINERARY_CACHE_MAX_AGE) {
        console.log(`Cached itinerary ${itineraryId} is too old, removing from cache`);
        await removeCachedItinerary(itineraryId);
        return null;
      }
    }
    
    // Parse and return the data
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error retrieving cached itinerary:', error);
    return null;
  }
};

/**
 * Remove an itinerary from the local cache
 * 
 * @param {string} itineraryId - ID of the itinerary to remove
 * @returns {Promise<boolean>} True if the itinerary was removed successfully
 */
export const removeCachedItinerary = async (itineraryId) => {
  try {
    // Generate cache keys
    const cacheKey = `${ITINERARY_CACHE_KEY_PREFIX}${itineraryId}`;
    const timestampKey = `${ITINERARY_CACHE_TIMESTAMP_KEY_PREFIX}${itineraryId}`;
    
    // Remove the data and timestamp
    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(timestampKey);
    
    // Update the list of cached itineraries
    await removeFromCachedItineraryList(itineraryId);
    
    console.log(`Itinerary ${itineraryId} removed from cache`);
    return true;
  } catch (error) {
    console.error('Error removing cached itinerary:', error);
    return false;
  }
};

/**
 * Clear all cached itineraries
 * 
 * @returns {Promise<boolean>} True if all cached itineraries were cleared successfully
 */
export const clearAllCachedItineraries = async () => {
  try {
    // Get the list of cached itineraries
    const cachedItineraries = await getCachedItineraryList();
    
    // Remove each cached itinerary
    for (const itineraryId of cachedItineraries) {
      await removeCachedItinerary(itineraryId);
    }
    
    // Clear the list
    await AsyncStorage.removeItem(ITINERARY_CACHE_LIST_KEY);
    
    console.log('All cached itineraries cleared');
    return true;
  } catch (error) {
    console.error('Error clearing cached itineraries:', error);
    return false;
  }
};

/**
 * Get a list of all cached itinerary IDs
 * 
 * @returns {Promise<string[]>} Array of cached itinerary IDs
 */
export const getCachedItineraryList = async () => {
  try {
    const jsonList = await AsyncStorage.getItem(ITINERARY_CACHE_LIST_KEY);
    return jsonList ? JSON.parse(jsonList) : [];
  } catch (error) {
    console.error('Error retrieving cached itinerary list:', error);
    return [];
  }
};

/**
 * Update the list of cached itineraries
 * 
 * @param {string} itineraryId - ID of the itinerary to add to the list
 * @returns {Promise<boolean>} True if the list was updated successfully
 */
const updateCachedItineraryList = async (itineraryId) => {
  try {
    // Get the current list
    const currentList = await getCachedItineraryList();
    
    // Add the new ID if it's not already in the list
    if (!currentList.includes(itineraryId)) {
      currentList.push(itineraryId);
      await AsyncStorage.setItem(ITINERARY_CACHE_LIST_KEY, JSON.stringify(currentList));
    }
    
    return true;
  } catch (error) {
    console.error('Error updating cached itinerary list:', error);
    return false;
  }
};

/**
 * Remove an itinerary ID from the list of cached itineraries
 * 
 * @param {string} itineraryId - ID of the itinerary to remove from the list
 * @returns {Promise<boolean>} True if the list was updated successfully
 */
const removeFromCachedItineraryList = async (itineraryId) => {
  try {
    // Get the current list
    const currentList = await getCachedItineraryList();
    
    // Remove the ID from the list
    const updatedList = currentList.filter(id => id !== itineraryId);
    
    // Save the updated list
    await AsyncStorage.setItem(ITINERARY_CACHE_LIST_KEY, JSON.stringify(updatedList));
    
    return true;
  } catch (error) {
    console.error('Error removing from cached itinerary list:', error);
    return false;
  }
};

/**
 * Check if the device is online
 * 
 * @returns {Promise<boolean>} True if the device is online
 */
export const isOnline = async () => {
  try {
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.log('Network check failed, device is offline');
    return false;
  }
};

/**
 * Get itinerary data with offline support
 * 
 * This function tries to fetch the itinerary from the API first,
 * and falls back to the cached version if the API request fails
 * or the device is offline.
 * 
 * @param {string} itineraryId - ID of the itinerary to retrieve
 * @param {Function} fetchFunction - Function to fetch the itinerary from the API
 * @returns {Promise<Object|null>} Itinerary data or null if not available
 */
export const getItineraryWithOfflineSupport = async (itineraryId, fetchFunction) => {
  try {
    // Check if the device is online
    const online = await isOnline();
    
    if (online) {
      try {
        // Try to fetch from the API
        const itineraryData = await fetchFunction(itineraryId);
        
        // Cache the data for offline use
        if (itineraryData) {
          await cacheItinerary(itineraryId, itineraryData);
          return itineraryData;
        }
      } catch (error) {
        console.log('API request failed, falling back to cache');
        // Fall back to cache if API request fails
      }
    }
    
    // Get from cache if offline or API request failed
    const cachedData = await getCachedItinerary(itineraryId);
    
    if (cachedData) {
      // Show offline indicator if we're using cached data
      if (online) {
        console.log('Using cached data (API request failed)');
      } else {
        Alert.alert(
          "Offline Mode",
          "You're currently offline. Showing cached itinerary data.",
          [{ text: "OK" }]
        );
      }
      return cachedData;
    }
    
    // No data available
    if (!online) {
      Alert.alert(
        "Offline Mode",
        "You're currently offline and no cached data is available for this itinerary.",
        [{ text: "OK" }]
      );
    }
    
    return null;
  } catch (error) {
    console.error('Error in getItineraryWithOfflineSupport:', error);
    return null;
  }
};

/**
 * Get all cached itineraries
 * 
 * @returns {Promise<Object[]>} Array of cached itinerary data
 */
export const getAllCachedItineraries = async () => {
  try {
    const itineraryIds = await getCachedItineraryList();
    const itineraries = [];
    
    for (const id of itineraryIds) {
      const itinerary = await getCachedItinerary(id);
      if (itinerary) {
        itineraries.push(itinerary);
      }
    }
    
    return itineraries;
  } catch (error) {
    console.error('Error retrieving all cached itineraries:', error);
    return [];
  }
};

/**
 * Update a cached itinerary with new data
 * 
 * @param {string} itineraryId - ID of the itinerary to update
 * @param {Object} updatedData - Updated itinerary data
 * @returns {Promise<boolean>} True if the update was successful
 */
export const updateCachedItinerary = async (itineraryId, updatedData) => {
  try {
    // Get the current cached data
    const currentData = await getCachedItinerary(itineraryId);
    
    if (!currentData) {
      // If no current data, just cache the new data
      return await cacheItinerary(itineraryId, updatedData);
    }
    
    // Merge the current data with the updated data
    const mergedData = { ...currentData, ...updatedData };
    
    // Cache the merged data
    return await cacheItinerary(itineraryId, mergedData);
  } catch (error) {
    console.error('Error updating cached itinerary:', error);
    return false;
  }
};

export default {
  cacheItinerary,
  getCachedItinerary,
  removeCachedItinerary,
  clearAllCachedItineraries,
  getCachedItineraryList,
  isOnline,
  getItineraryWithOfflineSupport,
  getAllCachedItineraries,
  updateCachedItinerary
};