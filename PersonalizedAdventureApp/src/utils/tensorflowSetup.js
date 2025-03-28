/**
 * TensorFlow.js Setup Utility
 * 
 * This utility provides functions for setting up TensorFlow.js,
 * creating/loading models, and preprocessing data for AI personalization.
 */

import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Initialize TensorFlow.js
 * @returns {Promise<boolean>} True if initialization was successful
 */
export const setupTensorFlow = async () => {
  try {
    // Wait for TensorFlow.js to be ready
    await tf.ready();
    console.log('TensorFlow.js is ready!');
    return true;
  } catch (error) {
    console.error('Failed to initialize TensorFlow.js', error);
    return false;
  }
};

/**
 * Create a dummy model for demonstration purposes
 * In a production app, you would load a pre-trained model
 * @returns {tf.LayersModel} A simple TensorFlow.js model
 */
export const createDummyModel = () => {
  // Create a simple model with 3 layers
  const model = tf.sequential();
  
  // Input layer: 20 features (user preferences, weather, etc.)
  model.add(tf.layers.dense({
    inputShape: [20],
    units: 64,
    activation: 'relu'
  }));
  
  // Hidden layer
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu'
  }));
  
  // Output layer: 10 activity scores
  model.add(tf.layers.dense({
    units: 10,
    activation: 'softmax'
  }));
  
  // Compile the model
  model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  console.log('Dummy model created successfully');
  return model;
};

/**
 * Preprocess input data for the model
 * @param {Object} userData - User profile and preferences
 * @param {Object} feedbackData - Recent user feedback
 * @param {Object} weatherData - Weather forecast
 * @param {Object} eventsData - Local events
 * @returns {tf.Tensor} A tensor containing the preprocessed input data
 */
export const preprocessInputData = (userData, feedbackData, weatherData, eventsData) => {
  // Create a feature array with 20 elements (placeholder values)
  const features = new Array(20).fill(0);
  
  // In a real implementation, we would extract and normalize features from:
  // 1. User preferences (activity types, budget, travel style)
  // 2. Recent feedback (mood, activity preferences)
  // 3. Weather data (temperature, conditions)
  // 4. Events data (availability, relevance to user)
  
  // For this demo, we'll set some placeholder values
  
  // User preference features (indices 0-9)
  if (userData && userData.preferences) {
    // Activity type preferences (indices 0-4)
    const activityTypes = userData.preferences.activityTypes || [];
    features[0] = activityTypes.includes('hiking') ? 1 : 0;
    features[1] = activityTypes.includes('museums') ? 1 : 0;
    features[2] = activityTypes.includes('food') ? 1 : 0;
    features[3] = activityTypes.includes('shopping') ? 1 : 0;
    features[4] = activityTypes.includes('tours') ? 1 : 0;
    
    // Budget range (normalized to 0-1) (index 5)
    const budgetRange = userData.preferences.budgetRange || { min: 0, max: 500 };
    features[5] = budgetRange.max / 1000; // Normalize to 0-1 assuming max budget is 1000
    
    // Travel style (indices 6-8)
    const travelStyle = userData.preferences.travelStyle || 'balanced';
    features[6] = travelStyle === 'adventurous' ? 1 : 0;
    features[7] = travelStyle === 'balanced' ? 1 : 0;
    features[8] = travelStyle === 'relaxed' ? 1 : 0;
    
    // Accessibility (index 9)
    features[9] = userData.preferences.accessibility ? 1 : 0;
  }
  
  // Feedback features (indices 10-12)
  if (feedbackData && feedbackData.responses) {
    const responses = Object.values(feedbackData.responses || {});
    
    // Check for mood-related feedback
    const moodFeedback = responses.find(r => r.context === 'mood');
    if (moodFeedback) {
      const response = moodFeedback.response.toLowerCase();
      features[10] = response.includes('adventurous') || response.includes('excited') ? 1 : 0;
      features[11] = response.includes('tired') || response.includes('relaxed') ? 1 : 0;
    }
    
    // Check for budget-related feedback
    const budgetFeedback = responses.find(r => r.context === 'budget');
    if (budgetFeedback) {
      const response = budgetFeedback.response.toLowerCase();
      features[12] = response.includes('important') || response.includes('concerned') ? 1 : 0;
    }
  }
  
  // Weather features (indices 13-15)
  if (weatherData && weatherData.forecast && weatherData.forecast.length > 0) {
    const todayWeather = weatherData.forecast[0];
    
    // Temperature (normalized to 0-1) (index 13)
    features[13] = (todayWeather.temperature - 0) / (40 - 0); // Normalize to 0-1 assuming range 0-40°C
    
    // Precipitation (normalized to 0-1) (index 14)
    features[14] = todayWeather.precipitation / 100;
    
    // Weather condition (index 15)
    features[15] = todayWeather.condition.toLowerCase().includes('rain') ? 1 : 0;
  }
  
  // Events features (indices 16-19)
  if (eventsData && eventsData.events) {
    // Number of available events (normalized to 0-1) (index 16)
    features[16] = Math.min(eventsData.events.length / 10, 1); // Normalize to 0-1 assuming max 10 events
    
    // Average event cost (normalized to 0-1) (index 17)
    const eventCosts = eventsData.events.map(event => event.cost || 0);
    const avgCost = eventCosts.length > 0 ? eventCosts.reduce((sum, cost) => sum + cost, 0) / eventCosts.length : 0;
    features[17] = avgCost / 100; // Normalize to 0-1 assuming max cost is 100
    
    // Event categories (indices 18-19)
    const eventCategories = eventsData.events.map(event => event.category || '');
    features[18] = eventCategories.some(cat => cat.toLowerCase().includes('outdoor')) ? 1 : 0;
    features[19] = eventCategories.some(cat => cat.toLowerCase().includes('cultural')) ? 1 : 0;
  }
  
  // Create a tensor from the features array
  return tf.tensor2d([features], [1, 20]);
};