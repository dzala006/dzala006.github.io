/**
 * Performance Monitoring Utility
 * 
 * This utility provides functions for monitoring and optimizing the performance
 * of the Personalized Adventure App.
 */

import { InteractionManager } from 'react-native';

// Store for performance metrics
const metrics = {
  renderTimes: {},
  apiCalls: {},
  memoryWarnings: 0,
  lastUpdate: Date.now()
};

/**
 * Track the render time of a component
 * 
 * @param {string} componentName - Name of the component being measured
 * @param {number} startTime - Start time of the render (from performance.now())
 */
export const trackRenderTime = (componentName, startTime) => {
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  if (!metrics.renderTimes[componentName]) {
    metrics.renderTimes[componentName] = {
      count: 0,
      total: 0,
      min: renderTime,
      max: renderTime,
      recent: []
    };
  }
  
  const stats = metrics.renderTimes[componentName];
  stats.count += 1;
  stats.total += renderTime;
  stats.min = Math.min(stats.min, renderTime);
  stats.max = Math.max(stats.max, renderTime);
  
  // Keep track of the 10 most recent render times
  stats.recent.push(renderTime);
  if (stats.recent.length > 10) {
    stats.recent.shift();
  }
  
  // Log slow renders (over 16ms, which is roughly 60fps)
  if (renderTime > 16) {
    console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
  }
};

/**
 * Track API call performance
 * 
 * @param {string} apiName - Name of the API being called
 * @param {number} startTime - Start time of the API call
 * @param {boolean} success - Whether the API call was successful
 */
export const trackApiCall = (apiName, startTime, success) => {
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (!metrics.apiCalls[apiName]) {
    metrics.apiCalls[apiName] = {
      count: 0,
      successCount: 0,
      failureCount: 0,
      total: 0,
      min: duration,
      max: duration,
      recent: []
    };
  }
  
  const stats = metrics.apiCalls[apiName];
  stats.count += 1;
  if (success) {
    stats.successCount += 1;
  } else {
    stats.failureCount += 1;
  }
  stats.total += duration;
  stats.min = Math.min(stats.min, duration);
  stats.max = Math.max(stats.max, duration);
  
  // Keep track of the 10 most recent API call durations
  stats.recent.push({
    duration,
    success,
    timestamp: Date.now()
  });
  if (stats.recent.length > 10) {
    stats.recent.shift();
  }
  
  // Log slow API calls (over 1000ms)
  if (duration > 1000) {
    console.warn(`Slow API call detected for ${apiName}: ${duration.toFixed(2)}ms`);
  }
};

/**
 * Schedule a task to run after interactions and animations have completed
 * to avoid blocking the JS thread during critical user interactions
 * 
 * @param {Function} task - Function to run after interactions
 * @param {string} taskName - Name of the task for tracking
 */
export const runAfterInteractions = (task, taskName = 'anonymous') => {
  const startTime = performance.now();
  
  return InteractionManager.runAfterInteractions(() => {
    const taskStartTime = performance.now();
    const result = task();
    const taskEndTime = performance.now();
    
    console.log(`Task "${taskName}" ran after ${taskStartTime - startTime}ms wait and took ${taskEndTime - taskStartTime}ms to execute`);
    
    return result;
  });
};

/**
 * Get all collected performance metrics
 * 
 * @returns {Object} Performance metrics
 */
export const getPerformanceMetrics = () => {
  // Calculate averages and other derived metrics
  const processedMetrics = {
    renderTimes: {},
    apiCalls: {},
    memoryWarnings: metrics.memoryWarnings,
    lastUpdate: metrics.lastUpdate,
    summary: {
      slowRenderComponents: [],
      slowApiCalls: [],
      totalRenders: 0,
      totalApiCalls: 0
    }
  };
  
  // Process render times
  Object.entries(metrics.renderTimes).forEach(([componentName, stats]) => {
    processedMetrics.renderTimes[componentName] = {
      ...stats,
      average: stats.total / stats.count,
      recentAverage: stats.recent.reduce((sum, time) => sum + time, 0) / stats.recent.length
    };
    
    processedMetrics.summary.totalRenders += stats.count;
    
    if (stats.recent.some(time => time > 16)) {
      processedMetrics.summary.slowRenderComponents.push({
        name: componentName,
        averageRenderTime: stats.total / stats.count,
        recentSlowRenders: stats.recent.filter(time => time > 16).length
      });
    }
  });
  
  // Process API calls
  Object.entries(metrics.apiCalls).forEach(([apiName, stats]) => {
    processedMetrics.apiCalls[apiName] = {
      ...stats,
      average: stats.total / stats.count,
      successRate: (stats.successCount / stats.count) * 100,
      recentAverage: stats.recent.reduce((sum, call) => sum + call.duration, 0) / stats.recent.length
    };
    
    processedMetrics.summary.totalApiCalls += stats.count;
    
    if (stats.recent.some(call => call.duration > 1000)) {
      processedMetrics.summary.slowApiCalls.push({
        name: apiName,
        averageDuration: stats.total / stats.count,
        recentSlowCalls: stats.recent.filter(call => call.duration > 1000).length
      });
    }
  });
  
  // Update last update time
  processedMetrics.lastUpdate = Date.now();
  
  return processedMetrics;
};

/**
 * Reset all performance metrics
 */
export const resetPerformanceMetrics = () => {
  Object.keys(metrics.renderTimes).forEach(key => {
    delete metrics.renderTimes[key];
  });
  
  Object.keys(metrics.apiCalls).forEach(key => {
    delete metrics.apiCalls[key];
  });
  
  metrics.memoryWarnings = 0;
  metrics.lastUpdate = Date.now();
};

export default {
  trackRenderTime,
  trackApiCall,
  runAfterInteractions,
  getPerformanceMetrics,
  resetPerformanceMetrics
};