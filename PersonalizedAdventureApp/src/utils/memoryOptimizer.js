/**
 * Memory Optimizer Utility
 * 
 * This utility provides functions for optimizing memory usage in the app,
 * including image caching, resource cleanup, and memory monitoring.
 */

import { Platform, InteractionManager } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { performanceMonitor } from './performanceMonitor';

// Constants
const IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory}images/`;
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Cache metadata
let cacheMetadata = {
  size: 0,
  files: {},
  lastCleanup: Date.now()
};

/**
 * Initialize the image cache directory
 * 
 * @returns {Promise<void>} Promise that resolves when the cache is initialized
 */
export const initImageCache = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
    }
    
    // Load cache metadata if it exists
    try {
      const metadataFile = `${IMAGE_CACHE_DIR}metadata.json`;
      const metadataInfo = await FileSystem.getInfoAsync(metadataFile);
      
      if (metadataInfo.exists) {
        const metadataContent = await FileSystem.readAsStringAsync(metadataFile);
        cacheMetadata = JSON.parse(metadataContent);
      }
    } catch (error) {
      console.warn('Failed to load cache metadata:', error);
    }
    
    // Schedule a cache cleanup
    scheduleCacheCleanup();
    
    return true;
  } catch (error) {
    console.error('Failed to initialize image cache:', error);
    return false;
  }
};

/**
 * Cache an image from a URL
 * 
 * @param {string} url - URL of the image to cache
 * @returns {Promise<string>} Local URI of the cached image
 */
export const cacheImage = async (url) => {
  if (!url) {
    return null;
  }
  
  try {
    // Create a unique filename based on the URL
    const filename = url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-zA-Z0-9]/g, '_');
    
    const localUri = `${IMAGE_CACHE_DIR}${filename}`;
    
    // Check if the file already exists in cache
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    
    if (fileInfo.exists) {
      // Update last accessed time
      cacheMetadata.files[filename] = {
        ...cacheMetadata.files[filename],
        lastAccessed: Date.now()
      };
      
      // Save metadata
      await saveCacheMetadata();
      
      return localUri;
    }
    
    // Download the file
    const downloadResult = await FileSystem.downloadAsync(url, localUri);
    
    if (downloadResult.status === 200) {
      // Get file size
      const downloadedFileInfo = await FileSystem.getInfoAsync(localUri);
      
      // Update cache metadata
      cacheMetadata.size += downloadedFileInfo.size;
      cacheMetadata.files[filename] = {
        size: downloadedFileInfo.size,
        url,
        createdAt: Date.now(),
        lastAccessed: Date.now()
      };
      
      // Save metadata
      await saveCacheMetadata();
      
      // Check if we need to clean up the cache
      if (cacheMetadata.size > MAX_CACHE_SIZE) {
        // Schedule cleanup for after current interactions
        InteractionManager.runAfterInteractions(() => {
          cleanupCache();
        });
      }
      
      return localUri;
    } else {
      console.warn(`Failed to download image: ${url}`);
      return url;
    }
  } catch (error) {
    console.error('Error caching image:', error);
    return url;
  }
};

/**
 * Save cache metadata to disk
 * 
 * @returns {Promise<void>} Promise that resolves when metadata is saved
 */
const saveCacheMetadata = async () => {
  try {
    const metadataFile = `${IMAGE_CACHE_DIR}metadata.json`;
    await FileSystem.writeAsStringAsync(
      metadataFile,
      JSON.stringify(cacheMetadata)
    );
  } catch (error) {
    console.warn('Failed to save cache metadata:', error);
  }
};

/**
 * Clean up the image cache by removing old or unused files
 * 
 * @returns {Promise<void>} Promise that resolves when cleanup is complete
 */
export const cleanupCache = async () => {
  try {
    console.log('Cleaning up image cache...');
    
    // Sort files by last accessed time (oldest first)
    const files = Object.entries(cacheMetadata.files)
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    let freedSpace = 0;
    const now = Date.now();
    const filesToDelete = [];
    
    // First pass: remove expired files
    for (const [filename, metadata] of files) {
      // Check if file is expired
      if (now - metadata.lastAccessed > CACHE_EXPIRY) {
        filesToDelete.push(filename);
        freedSpace += metadata.size;
      }
    }
    
    // Second pass: if we still need to free up space, remove oldest files
    if (cacheMetadata.size - freedSpace > MAX_CACHE_SIZE) {
      const remainingFiles = files.filter(
        ([filename]) => !filesToDelete.includes(filename)
      );
      
      let i = 0;
      while (
        i < remainingFiles.length &&
        cacheMetadata.size - freedSpace > MAX_CACHE_SIZE * 0.8 // Target 80% of max
      ) {
        const [filename, metadata] = remainingFiles[i];
        filesToDelete.push(filename);
        freedSpace += metadata.size;
        i++;
      }
    }
    
    // Delete files and update metadata
    for (const filename of filesToDelete) {
      const localUri = `${IMAGE_CACHE_DIR}${filename}`;
      await FileSystem.deleteAsync(localUri, { idempotent: true });
      
      // Update metadata
      cacheMetadata.size -= cacheMetadata.files[filename].size;
      delete cacheMetadata.files[filename];
    }
    
    // Save updated metadata
    cacheMetadata.lastCleanup = now;
    await saveCacheMetadata();
    
    console.log(`Cache cleanup complete. Freed ${(freedSpace / 1024 / 1024).toFixed(2)}MB of space.`);
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
};

/**
 * Schedule a cache cleanup to run periodically
 */
const scheduleCacheCleanup = () => {
  // Check if it's been more than a day since last cleanup
  const now = Date.now();
  if (now - cacheMetadata.lastCleanup > 24 * 60 * 60 * 1000) {
    // Schedule cleanup for when the app is idle
    InteractionManager.runAfterInteractions(() => {
      cleanupCache();
    });
  }
};

/**
 * Clear the entire image cache
 * 
 * @returns {Promise<boolean>} Promise that resolves to true if successful
 */
export const clearImageCache = async () => {
  try {
    await FileSystem.deleteAsync(IMAGE_CACHE_DIR, { idempotent: true });
    await initImageCache();
    return true;
  } catch (error) {
    console.error('Error clearing image cache:', error);
    return false;
  }
};

/**
 * Get cache statistics
 * 
 * @returns {Object} Cache statistics
 */
export const getCacheStats = () => {
  return {
    size: cacheMetadata.size,
    fileCount: Object.keys(cacheMetadata.files).length,
    lastCleanup: new Date(cacheMetadata.lastCleanup).toISOString()
  };
};

/**
 * Optimize memory usage by cleaning up resources
 * 
 * @returns {Promise<void>} Promise that resolves when optimization is complete
 */
export const optimizeMemoryUsage = async () => {
  // Schedule cache cleanup
  await cleanupCache();
  
  // Force garbage collection if available (only works in debug mode)
  if (__DEV__ && global.gc) {
    global.gc();
  }
};

/**
 * Preload and cache multiple images
 * 
 * @param {Array<string>} urls - Array of image URLs to preload
 * @returns {Promise<Array<string>>} Array of local URIs
 */
export const preloadImages = async (urls) => {
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return [];
  }
  
  // Process in batches to avoid overwhelming the device
  const batchSize = 5;
  const results = [];
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(url => cacheImage(url))
    );
    results.push(...batchResults);
  }
  
  return results;
};

export default {
  initImageCache,
  cacheImage,
  cleanupCache,
  clearImageCache,
  getCacheStats,
  optimizeMemoryUsage,
  preloadImages
};