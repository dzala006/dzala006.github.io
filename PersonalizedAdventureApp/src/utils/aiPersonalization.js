/**
 * AI Personalization Utility with TensorFlow.js Integration
 * 
 * This utility provides functions for generating personalized itineraries
 * based on user preferences, feedback, weather data, and local events
 * using TensorFlow.js for advanced machine learning-based personalization.
 */

// Import TensorFlow.js
import * as tf from '@tensorflow/tfjs';

// Import helper functions from separate files to keep code organized
import { 
  preprocessDataForModel, 
  postProcessModelOutput, 
  generateUniqueId,
  generateItineraryTitle
} from './aiPersonalizationHelpers';

// Import the fallback rule-based approach
import { generateRuleBasedItinerary } from './aiPersonalizationRuleBased';

// Import TensorFlow.js setup utilities
import { setupTensorFlow } from './tensorflowSetup';

// Model reference to be initialized
let model = null;

/**
 * Initialize the TensorFlow model
 * @returns {Promise<boolean>} True if initialization was successful
 */
export const initializeModel = async () => {
  try {
    // Initialize TensorFlow.js
    const tfReady = await setupTensorFlow();
    if (!tfReady) {
      console.warn('TensorFlow.js initialization failed, falling back to rule-based system');
      return false;
    }
    
    // Load the model
    model = await loadTensorFlowModel();
    
    console.log('AI personalization model initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing AI personalization model:', error);
    return false;
  }
};

/**
 * Loads the TensorFlow.js model from a local file or URL
 * 
 * @returns {Promise<tf.LayersModel>} The loaded TensorFlow.js model
 */
const loadTensorFlowModel = async () => {
  try {
    // In a production environment, you would load from a real model URL
    // For this example, we're simulating the model loading
    console.log('Loading TensorFlow.js model...');
    
    // Simulate model loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demonstration purposes, we'll create a simple model
    // In production, you would use: return await tf.loadLayersModel('path/to/model.json');
    const model = tf.sequential();
    
    // Input shape: [user preferences (10), feedback data (5), weather data (3), events data (5)]
    model.add(tf.layers.dense({
      inputShape: [23],
      units: 64,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));
    
    // Output layer: activity recommendations for morning, lunch, afternoon, evening
    // Each activity has: type, cost, indoor/outdoor, reservation needed, suitability score
    model.add(tf.layers.dense({
      units: 40, // 4 time slots × 10 properties per activity
      activation: 'sigmoid'
    }));
    
    // Compile the model
    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });
    
    console.log('TensorFlow.js model created successfully');
    return model;
  } catch (error) {
    console.error('Error loading TensorFlow.js model:', error);
    throw new Error(`Failed to load TensorFlow.js model: ${error.message}`);
  }
};

/**
 * Runs inference with the TensorFlow.js model
 * 
 * @param {tf.LayersModel} model - The loaded TensorFlow.js model
 * @param {Object} preprocessedData - The preprocessed input data
 * @returns {Promise<Object>} The model predictions
 */
const runModelInference = async (model, preprocessedData) => {
  try {
    console.log('Running model inference...');
    
    // Convert preprocessed data to a tensor
    const inputTensor = tf.tensor2d([preprocessedData.flattenedFeatures], [1, preprocessedData.flattenedFeatures.length]);
    
    // Run inference
    const predictionsTensor = model.predict(inputTensor);
    
    // Convert predictions tensor to JavaScript array
    const predictionsArray = await predictionsTensor.array();
    
    // Clean up tensors to prevent memory leaks
    inputTensor.dispose();
    predictionsTensor.dispose();
    
    // Structure the raw predictions into a more usable format
    const structuredPredictions = {
      timeSlots: {
        morning: {
          activityType: predictionsArray[0].slice(0, 5),
          cost: predictionsArray[0][5] * 100, // Scale to realistic cost (0-100)
          isIndoor: predictionsArray[0][6] > 0.5,
          needsReservation: predictionsArray[0][7] > 0.5,
          suitabilityScore: predictionsArray[0][8],
          weatherSensitivity: predictionsArray[0][9]
        },
        lunch: {
          activityType: predictionsArray[0].slice(10, 15),
          cost: predictionsArray[0][15] * 100, // Scale to realistic cost (0-100)
          isIndoor: predictionsArray[0][16] > 0.5,
          needsReservation: predictionsArray[0][17] > 0.5,
          suitabilityScore: predictionsArray[0][18],
          weatherSensitivity: predictionsArray[0][19]
        },
        afternoon: {
          activityType: predictionsArray[0].slice(20, 25),
          cost: predictionsArray[0][25] * 100, // Scale to realistic cost (0-100)
          isIndoor: predictionsArray[0][26] > 0.5,
          needsReservation: predictionsArray[0][27] > 0.5,
          suitabilityScore: predictionsArray[0][28],
          weatherSensitivity: predictionsArray[0][29]
        },
        evening: {
          activityType: predictionsArray[0].slice(30, 35),
          cost: predictionsArray[0][35] * 100, // Scale to realistic cost (0-100)
          isIndoor: predictionsArray[0][36] > 0.5,
          needsReservation: predictionsArray[0][37] > 0.5,
          suitabilityScore: predictionsArray[0][38],
          weatherSensitivity: predictionsArray[0][39]
        }
      },
      confidenceScore: 0.85 // Simulated confidence score for the model's predictions
    };
    
    return structuredPredictions;
  } catch (error) {
    console.error('Error running model inference:', error);
    throw new Error(`Failed to run model inference: ${error.message}`);
  }
};

/**
 * Generates a fully personalized itinerary based on multiple data sources
 * using a TensorFlow.js model for advanced personalization
 * 
 * @param {Object} userData - User profile and preferences
 * @param {Object} userData.preferences - User's adventure preferences
 * @param {Array} userData.preferences.activityTypes - Preferred activity types (e.g., ['hiking', 'museums', 'food'])
 * @param {Object} userData.preferences.budgetRange - Budget constraints ({min: number, max: number})
 * @param {string} userData.preferences.travelStyle - Travel style preference ('adventurous', 'balanced', 'relaxed')
 * @param {boolean} userData.preferences.accessibility - Whether accessibility is required
 * @param {Array} userData.preferences.dietaryRestrictions - Dietary restrictions (e.g., ['vegetarian', 'gluten-free'])
 * @param {Array} userData.surveyResponses - Responses from the initial onboarding survey
 * 
 * @param {Object} feedbackData - Recent user feedback from continuous collection
 * @param {Object} feedbackData.responses - Map of feedback responses by question ID
 * @param {Array} feedbackData.history - Historical feedback for trend analysis
 * 
 * @param {Object} weatherData - Live weather information for the selected dates
 * @param {Array} weatherData.forecast - Daily weather forecasts
 * @param {string} weatherData.forecast[].condition - Weather condition (e.g., 'sunny', 'rainy')
 * @param {number} weatherData.forecast[].temperature - Temperature in degrees
 * @param {number} weatherData.forecast[].precipitation - Precipitation probability (0-100)
 * 
 * @param {Object} eventsData - Data from local events APIs
 * @param {Array} eventsData.events - List of local events
 * @param {string} eventsData.events[].name - Event name
 * @param {string} eventsData.events[].location - Event location
 * @param {string} eventsData.events[].date - Event date
 * @param {string} eventsData.events[].category - Event category
 * @param {number} eventsData.events[].cost - Event cost
 * 
 * @returns {Promise<Object>} A promise that resolves to the generated itinerary
 */
export const generateDynamicItinerary = async (userData, feedbackData, weatherData, eventsData) => {
  try {
    console.log('Generating personalized itinerary with TensorFlow.js AI model...');
    
    // Validate input parameters
    if (!userData || !userData.preferences) {
      throw new Error('User data and preferences are required');
    }
    
    if (!weatherData || !weatherData.forecast || !weatherData.forecast.length) {
      console.warn('Weather data is missing or incomplete. Using default weather assumptions.');
      // Create default weather data if not provided
      weatherData = {
        forecast: [
          { date: new Date().toISOString().split('T')[0], condition: 'sunny', temperature: 75, precipitation: 10 }
        ]
      };
    }
    
    if (!eventsData || !eventsData.events) {
      console.warn('Events data is missing. Proceeding without local event recommendations.');
      eventsData = { events: [] };
    }
    
    // Initialize model if not already initialized
    if (!model) {
      const modelInitialized = await initializeModel();
      if (!modelInitialized) {
        console.warn('Using rule-based fallback for itinerary generation');
        // Fall back to the rule-based method
        return generateRuleBasedItinerary(userData, feedbackData, weatherData, eventsData);
      }
    }
    
    // Preprocess the input data for the model
    const preprocessedData = preprocessDataForModel(userData, feedbackData, weatherData, eventsData);
    console.log('Data preprocessed for model inference');
    
    // Run inference with the model
    const modelPredictions = await runModelInference(model, preprocessedData);
    console.log('Model inference completed successfully');
    
    // Post-process the model output into a structured itinerary
    const itinerary = postProcessModelOutput(modelPredictions, userData, weatherData, eventsData);
    console.log(`Generated itinerary with ${itinerary.days.length} days and ${itinerary.days.reduce((sum, day) => sum + day.activities.length, 0)} activities`);
    
    return itinerary;
  } catch (error) {
    console.error('Error generating dynamic itinerary with TensorFlow.js:', error);
    console.log('Falling back to rule-based itinerary generation...');
    
    // Fallback to the rule-based approach if the ML model fails
    return generateRuleBasedItinerary(userData, feedbackData, weatherData, eventsData);
  }
};

// Export other functions that might be needed by other components
export { generateUniqueId, generateItineraryTitle };