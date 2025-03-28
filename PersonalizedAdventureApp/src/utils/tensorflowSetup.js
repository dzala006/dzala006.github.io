import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Initialize TensorFlow.js
 * @returns {Promise<boolean>} True if initialization was successful, false otherwise
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
 * Load a TensorFlow.js model from bundled resources
 * @param {Object} modelJson - The model.json file
 * @param {Array<ArrayBuffer>} modelWeights - The model weights
 * @returns {Promise<tf.LayersModel|null>} The loaded model or null if loading failed
 */
export const loadModel = async (modelJson, modelWeights) => {
  try {
    // Load the model using bundleResourceIO
    const model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));
    console.log('Model loaded successfully');
    return model;
  } catch (error) {
    console.error('Failed to load the model', error);
    return null;
  }
};

/**
 * Create a dummy model for testing purposes
 * @returns {tf.Sequential} A simple sequential model
 */
export const createDummyModel = () => {
  // Create a simple sequential model
  const model = tf.sequential();
  
  // Add layers
  model.add(tf.layers.dense({
    inputShape: [10],
    units: 16,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 8,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 4,
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
 * @param {Object} userData - User preferences and profile data
 * @param {Object} feedbackData - Recent user feedback
 * @param {Object} weatherData - Weather forecast data
 * @param {Object} eventsData - Local events data
 * @returns {tf.Tensor} A tensor containing the preprocessed input data
 */
export const preprocessInputData = (userData, feedbackData, weatherData, eventsData) => {
  // Extract relevant features from input data
  const features = [];
  
  // User preferences (e.g., adventure level, budget, etc.)
  features.push(userData.preferences?.adventureLevel || 0.5);
  features.push(userData.preferences?.budget || 0.5);
  features.push(userData.preferences?.outdoorPreference || 0.5);
  features.push(userData.preferences?.culturalInterest || 0.5);
  features.push(userData.preferences?.foodExploration || 0.5);
  
  // Recent feedback
  features.push(feedbackData?.currentMood || 0.5);
  features.push(feedbackData?.energyLevel || 0.5);
  
  // Weather data
  features.push(weatherData?.temperature ? normalizeTemperature(weatherData.temperature) : 0.5);
  features.push(weatherData?.precipitation ? normalizePrecipitation(weatherData.precipitation) : 0);
  
  // Events data (e.g., number of available events)
  features.push(eventsData?.events ? normalizeEventCount(eventsData.events.length) : 0);
  
  // Convert to tensor
  return tf.tensor2d([features], [1, features.length]);
};

/**
 * Normalize temperature to a value between 0 and 1
 * @param {number} temp - Temperature in Celsius
 * @returns {number} Normalized temperature
 */
const normalizeTemperature = (temp) => {
  // Assuming temperature range from -10°C to 40°C
  return Math.max(0, Math.min(1, (temp + 10) / 50));
};

/**
 * Normalize precipitation to a value between 0 and 1
 * @param {number} precip - Precipitation in mm
 * @returns {number} Normalized precipitation
 */
const normalizePrecipitation = (precip) => {
  // Assuming precipitation range from 0mm to 50mm
  return Math.max(0, Math.min(1, precip / 50));
};

/**
 * Normalize event count to a value between 0 and 1
 * @param {number} count - Number of events
 * @returns {number} Normalized event count
 */
const normalizeEventCount = (count) => {
  // Assuming event count range from 0 to 20
  return Math.max(0, Math.min(1, count / 20));
};