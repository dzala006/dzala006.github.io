/**
 * Lazy Loading Utility
 * 
 * This utility provides functions for lazy loading components and images
 * to improve initial load times and overall performance.
 */

import React, { lazy, Suspense } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { colors, typography } from '../theme/theme';

/**
 * Default loading component shown while lazy-loaded components are being loaded
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Loading message to display
 * @returns {React.Component} Loading component
 */
export const DefaultLoadingComponent = ({ message = 'Loading...' }) => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary
  }}>
    <ActivityIndicator size="large" color={colors.primary.main} />
    <Text style={{
      marginTop: 20,
      fontSize: typography.fontSize.md,
      color: colors.text.secondary,
      fontFamily: typography.fontFamily.regular
    }}>
      {message}
    </Text>
  </View>
);

/**
 * Lazy load a component with a custom loading component
 * 
 * @param {Function} importFunc - Function that returns a promise from a dynamic import
 * @param {React.Component} LoadingComponent - Component to show while loading
 * @returns {React.Component} Lazy-loaded component
 */
export const lazyLoad = (importFunc, LoadingComponent = DefaultLoadingComponent) => {
  const LazyComponent = lazy(importFunc);
  
  return props => (
    <Suspense fallback={<LoadingComponent />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Lazy load an image with a placeholder
 * 
 * @param {string} source - Image source URI
 * @param {Object} options - Options for image loading
 * @param {string} options.placeholder - Placeholder image URI
 * @param {Function} options.onLoad - Callback when image is loaded
 * @param {Function} options.onError - Callback when image fails to load
 * @returns {Object} Image source object with URI and callbacks
 */
export const lazyLoadImage = (source, options = {}) => {
  const { placeholder, onLoad, onError } = options;
  
  return {
    uri: source,
    headers: {
      'Accept': 'image/webp,image/png,image/jpeg',
      'Cache-Control': 'max-age=31536000'
    },
    priority: 'normal',
    cache: 'force-cache',
    placeholderSource: placeholder ? { uri: placeholder } : undefined,
    onLoad,
    onError
  };
};

/**
 * Preload multiple images in the background
 * 
 * @param {Array} sources - Array of image source URIs
 * @returns {Promise} Promise that resolves when all images are preloaded
 */
export const preloadImages = (sources) => {
  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return Promise.resolve([]);
  }
  
  const preloadPromises = sources.map(source => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = source;
      img.onload = () => resolve(source);
      img.onerror = (error) => reject(error);
    });
  });
  
  return Promise.all(preloadPromises);
};

export default {
  lazyLoad,
  lazyLoadImage,
  preloadImages,
  DefaultLoadingComponent
};