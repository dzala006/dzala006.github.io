/**
 * Offline Cache Utility
 * 
 * This utility provides functions for caching itinerary data locally,
 * allowing the app to work offline and improve performance.
 * It uses AsyncStorage for persistent storage and includes functions
 * to save, retrieve, and update cached data with delta updates and partial revalidation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Constants for storage keys
const ITINERARY_CACHE_KEY_PREFIX = 'itinerary_cache_';
const ITINERARY_CACHE_TIMESTAMP_KEY_PREFIX = 'itinerary_cache_timestamp_';
const ITINERARY_CACHE_METADATA_KEY_PREFIX = 'itinerary_cache_metadata_';
const ITINERARY_CACHE_LIST_KEY = 'itinerary_cache_list';
const ITINERARY_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const ITINERARY_CACHE_REVALIDATION_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Cache metadata structure
 * @typedef {Object} CacheMetadata
 * @property {number} timestamp - When the cache was last updated
 * @property {number} version - Cache version number, incremented on each update
 * @property {Object} partialUpdates - Record of which parts of the itinerary were updated and when
 * @property {string} etag - ETag from the server response for conditional requests
 * @property {boolean} isComplete - Whether this is a complete itinerary or partial data
 */

/**
 * Create or update cache metadata
 * 
 * @param {string} itineraryId - ID of the itinerary
 * @param {Object} updates - Updates to apply to the metadata
 * @returns {Promise<CacheMetadata>} Updated metadata
 */
const updateCacheMetadata = async (itineraryId, updates = {}) => {
  try {
    const metadataKey = `${ITINERARY_CACHE_METADATA_KEY_PREFIX}${itineraryId}`;
    
    // Get existing metadata or create default
    let metadata = await AsyncStorage.getItem(metadataKey);
    metadata = metadata ? JSON.parse(metadata) : {
      timestamp: Date.now(),
      version: 1,
      partialUpdates: {},
      etag: null,
      isComplete: false
    };
    
    // Apply updates
    const updatedMetadata = {
      ...metadata,
      ...updates,
      // Always update timestamp when metadata changes
      timestamp: updates.timestamp || Date.now()
    };
    
    // If we're updating partialUpdates, merge rather than replace
    if (updates.partialUpdates) {
      updatedMetadata.partialUpdates = {
        ...metadata.partialUpdates,
        ...updates.partialUpdates
      };
    }
    
    // Save updated metadata
    await AsyncStorage.setItem(metadataKey, JSON.stringify(updatedMetadata));
    
    return updatedMetadata;
  } catch (error) {
    console.error('Error updating cache metadata:', error);
    // Return a default metadata object if update fails
    return {
      timestamp: Date.now(),
      version: 1,
      partialUpdates: {},
      etag: null,
      isComplete: false
    };
  }
};

/**
 * Get cache metadata for an itinerary
 * 
 * @param {string} itineraryId - ID of the itinerary
 * @returns {Promise<CacheMetadata|null>} Cache metadata or null if not found
 */
const getCacheMetadata = async (itineraryId) => {
  try {
    const metadataKey = `${ITINERARY_CACHE_METADATA_KEY_PREFIX}${itineraryId}`;
    const metadata = await AsyncStorage.getItem(metadataKey);
    
    return metadata ? JSON.parse(metadata) : null;
  } catch (error) {
    console.error('Error getting cache metadata:', error);
    return null;
  }
};

/**
 * Save itinerary data to local cache
 * 
 * @param {string} itineraryId - ID of the itinerary to cache
 * @param {Object} itineraryData - Itinerary data to cache
 * @param {Object} options - Caching options
 * @param {boolean} options.isComplete - Whether this is a complete itinerary or partial data
 * @param {string} options.etag - ETag from the server response for conditional requests
 * @returns {Promise<boolean>} True if data was cached successfully
 */
export const cacheItinerary = async (itineraryId, itineraryData, options = {}) => {
  try {
    // Generate cache key
    const cacheKey = `${ITINERARY_CACHE_KEY_PREFIX}${itineraryId}`;
    
    // Stringify the data
    const jsonData = JSON.stringify(itineraryData);
    
    // Save the data
    await AsyncStorage.setItem(cacheKey, jsonData);
    
    // Update metadata
    await updateCacheMetadata(itineraryId, {
      timestamp: Date.now(),
      version: (await getCacheMetadata(itineraryId))?.version + 1 || 1,
      etag: options.etag || null,
      isComplete: options.isComplete !== undefined ? options.isComplete : true
    });
    
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
 * Check if cached data needs revalidation
 * 
 * @param {string} itineraryId - ID of the itinerary to check
 * @returns {Promise<boolean>} True if the cache needs revalidation
 */
export const needsRevalidation = async (itineraryId) => {
  try {
    const metadata = await getCacheMetadata(itineraryId);
    
    if (!metadata) {
      return true;
    }
    
    // Check if the cache is too old (expired)
    const cacheAge = Date.now() - metadata.timestamp;
    if (cacheAge > ITINERARY_CACHE_MAX_AGE) {
      return true;
    }
    
    // Check if it's time to revalidate
    if (cacheAge > ITINERARY_CACHE_REVALIDATION_INTERVAL) {
      return true;
    }
    
    // Check if we only have partial data
    if (!metadata.isComplete) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if cache needs revalidation:', error);
    return true; // Revalidate on error to be safe
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
    // Generate cache key
    const cacheKey = `${ITINERARY_CACHE_KEY_PREFIX}${itineraryId}`;
    
    // Get the cached data
    const jsonData = await AsyncStorage.getItem(cacheKey);
    
    // If no data found, return null
    if (!jsonData) {
      return null;
    }
    
    // Get metadata
    const metadata = await getCacheMetadata(itineraryId);
    
    // Check if the cache is too old
    if (metadata) {
      const cacheAge = Date.now() - metadata.timestamp;
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
    const metadataKey = `${ITINERARY_CACHE_METADATA_KEY_PREFIX}${itineraryId}`;
    
    // Remove the data and metadata
    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(metadataKey);
    
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
 * Get itinerary data with offline support and revalidation
 * 
 * This function tries to fetch the itinerary from the API first if revalidation is needed,
 * and falls back to the cached version if the API request fails
 * or the device is offline.
 * 
 * @param {string} itineraryId - ID of the itinerary to retrieve
 * @param {Function} fetchFunction - Function to fetch the itinerary from the API
 * @param {Object} options - Options for fetching
 * @param {boolean} options.forceRefresh - Whether to force a refresh from the API
 * @returns {Promise<Object|null>} Itinerary data or null if not available
 */
export const getItineraryWithOfflineSupport = async (itineraryId, fetchFunction, options = {}) => {
  try {
    // Check if the device is online
    const online = await isOnline();
    
    // Get cache metadata
    const metadata = await getCacheMetadata(itineraryId);
    
    // Check if we need to revalidate the cache
    const shouldRevalidate = options.forceRefresh || 
                            !metadata || 
                            await needsRevalidation(itineraryId);
    
    if (online && shouldRevalidate) {
      try {
        // Prepare headers for conditional request if we have an ETag
        const headers = {};
        if (metadata?.etag) {
          headers['If-None-Match'] = metadata.etag;
        }
        
        // Try to fetch from the API
        const response = await fetchFunction(itineraryId, headers);
        
        // If we got a 304 Not Modified, our cache is still valid
        if (response.status === 304) {
          console.log('Server confirmed cache is still valid');
          
          // Update the metadata timestamp to reset revalidation timer
          await updateCacheMetadata(itineraryId, {
            timestamp: Date.now()
          });
          
          // Return the cached data
          return await getCachedItinerary(itineraryId);
        }
        
        // If we got a successful response with data
        if (response.data) {
          // Get the ETag if available
          const etag = response.headers?.etag;
          
          // Compare with cached data to detect changes
          const cachedData = await getCachedItinerary(itineraryId);
          
          if (cachedData) {
            // Perform delta update by comparing and merging
            const updatedData = performDeltaUpdate(cachedData, response.data);
            
            // Cache the updated data
            await cacheItinerary(itineraryId, updatedData, {
              isComplete: true,
              etag
            });
            
            return updatedData;
          } else {
            // No cached data, just cache the new data
            await cacheItinerary(itineraryId, response.data, {
              isComplete: true,
              etag
            });
            
            return response.data;
          }
        }
      } catch (error) {
        console.log('API request failed, falling back to cache:', error);
        // Fall back to cache if API request fails
      }
    }
    
    // Get from cache if offline, API request failed, or no revalidation needed
    const cachedData = await getCachedItinerary(itineraryId);
    
    if (cachedData) {
      // Show offline indicator if we're using cached data and should have revalidated
      if (online && shouldRevalidate) {
        console.log('Using cached data (API request failed)');
      } else if (!online) {
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
 * Perform a delta update by comparing old and new data
 * 
 * @param {Object} oldData - Existing cached data
 * @param {Object} newData - New data from the API
 * @returns {Object} Merged data with changes from newData
 */
const performDeltaUpdate = (oldData, newData) => {
  // Start with a deep clone of the old data
  const result = JSON.parse(JSON.stringify(oldData));
  
  // Track which parts were updated
  const updatedParts = {};
  
  // Helper function to recursively merge objects and track changes
  const deepMerge = (target, source, path = '') => {
    for (const key in source) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // If property doesn't exist in target, add it
      if (!(key in target)) {
        target[key] = source[key];
        updatedParts[currentPath] = true;
        continue;
      }
      
      // If both are objects, merge recursively
      if (
        typeof source[key] === 'object' && 
        source[key] !== null &&
        typeof target[key] === 'object' && 
        target[key] !== null &&
        !Array.isArray(source[key]) &&
        !Array.isArray(target[key])
      ) {
        deepMerge(target[key], source[key], currentPath);
      } 
      // If values are different, update target
      else if (JSON.stringify(target[key]) !== JSON.stringify(source[key])) {
        target[key] = source[key];
        updatedParts[currentPath] = true;
      }
    }
  };
  
  // Perform the merge
  deepMerge(result, newData);
  
  // Log which parts were updated
  const updatedKeys = Object.keys(updatedParts);
  if (updatedKeys.length > 0) {
    console.log('Delta update applied to:', updatedKeys);
  } else {
    console.log('No changes detected in delta update');
  }
  
  return result;
};

/**
 * Update a specific part of a cached itinerary
 * 
 * @param {string} itineraryId - ID of the itinerary to update
 * @param {string} path - Path to the part to update (e.g., 'activities.0.name')
 * @param {any} value - New value for the specified path
 * @returns {Promise<boolean>} True if the update was successful
 */
export const updateCachedItineraryPart = async (itineraryId, path, value) => {
  try {
    // Get the current cached data
    const currentData = await getCachedItinerary(itineraryId);
    
    if (!currentData) {
      console.error(`Cannot update part of non-existent itinerary ${itineraryId}`);
      return false;
    }
    
    // Clone the current data
    const updatedData = JSON.parse(JSON.stringify(currentData));
    
    // Split the path into parts
    const pathParts = path.split('.');
    
    // Navigate to the target location
    let target = updatedData;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      
      // Handle array indices
      if (/^\d+$/.test(part) && Array.isArray(target)) {
        const index = parseInt(part, 10);
        if (index >= target.length) {
          console.error(`Array index out of bounds: ${index} >= ${target.length}`);
          return false;
        }
      } else if (!(part in target)) {
        // Create missing objects along the path
        target[part] = /^\d+$/.test(pathParts[i + 1]) ? [] : {};
      }
      
      target = target[part];
      
      // Ensure we can continue traversing
      if (target === null || typeof target !== 'object') {
        console.error(`Cannot traverse path ${path}: ${part} is not an object`);
        return false;
      }
    }
    
    // Set the value at the target location
    const lastPart = pathParts[pathParts.length - 1];
    target[lastPart] = value;
    
    // Update the cache
    await cacheItinerary(itineraryId, updatedData);
    
    // Update metadata to track this partial update
    await updateCacheMetadata(itineraryId, {
      partialUpdates: {
        [path]: Date.now()
      }
    });
    
    console.log(`Updated part ${path} of itinerary ${itineraryId}`);
    return true;
  } catch (error) {
    console.error(`Error updating part ${path} of itinerary ${itineraryId}:`, error);
    return false;
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
 * Clean up old cached itineraries
 * 
 * @returns {Promise<number>} Number of itineraries removed
 */
export const cleanupOldCaches = async () => {
  try {
    const itineraryIds = await getCachedItineraryList();
    let removedCount = 0;
    
    for (const id of itineraryIds) {
      const metadata = await getCacheMetadata(id);
      
      if (metadata && (Date.now() - metadata.timestamp > ITINERARY_CACHE_MAX_AGE)) {
        await removeCachedItinerary(id);
        removedCount++;
      }
    }
    
    console.log(`Cleaned up ${removedCount} old cached itineraries`);
    return removedCount;
  } catch (error) {
    console.error('Error cleaning up old caches:', error);
    return 0;
  }
};

/**
 * Get the ETag for a cached itinerary
 * 
 * @param {string} itineraryId - ID of the itinerary
 * @returns {Promise<string|null>} ETag or null if not available
 */
export const getCachedETag = async (itineraryId) => {
  try {
    const metadata = await getCacheMetadata(itineraryId);
    return metadata?.etag || null;
  } catch (error) {
    console.error('Error getting cached ETag:', error);
    return null;
  }
};

/**
 * Get cache statistics
 * 
 * @returns {Promise<Object>} Cache statistics
 */
export const getCacheStats = async () => {
  try {
    const itineraryIds = await getCachedItineraryList();
    let totalSize = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;
    
    for (const id of itineraryIds) {
      const cacheKey = `${ITINERARY_CACHE_KEY_PREFIX}${id}`;
      const jsonData = await AsyncStorage.getItem(cacheKey);
      
      if (jsonData) {
        totalSize += jsonData.length;
      }
      
      const metadata = await getCacheMetadata(id);
      if (metadata) {
        if (metadata.timestamp < oldestTimestamp) {
          oldestTimestamp = metadata.timestamp;
        }
        if (metadata.timestamp > newestTimestamp) {
          newestTimestamp = metadata.timestamp;
        }
      }
    }
    
    return {
      count: itineraryIds.length,
      totalSizeBytes: totalSize,
      totalSizeKB: Math.round(totalSize / 1024),
      oldestCache: oldestTimestamp,
      newestCache: newestTimestamp,
      oldestCacheAge: Math.round((Date.now() - oldestTimestamp) / (1000 * 60 * 60 * 24)), // in days
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      count: 0,
      totalSizeBytes: 0,
      totalSizeKB: 0,
      oldestCache: null,
      newestCache: null,
      oldestCacheAge: null,
    };
  }
};

// Export all functions
export default {
  cacheItinerary,
  getCachedItinerary,
  removeCachedItinerary,
  clearAllCachedItineraries,
  getCachedItineraryList,
  isOnline,
  getItineraryWithOfflineSupport,
  getAllCachedItineraries,
  updateCachedItineraryPart,
  needsRevalidation,
  cleanupOldCaches,
  getCachedETag,
  getCacheStats
};