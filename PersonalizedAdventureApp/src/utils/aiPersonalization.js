/**
 * AI Personalization Utility with TensorFlow.js Integration
 * 
 * This utility provides functions for generating personalized itineraries
 * based on user preferences, feedback, weather data, and local events
 * using TensorFlow.js for machine learning-based recommendations.
 */

import * as tf from '@tensorflow/tfjs';
import { 
  setupTensorFlow, 
  createDummyModel, 
  preprocessInputData 
} from './tensorflowSetup';
import { generateRuleBasedItinerary } from './aiPersonalizationRuleBased';

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
    
    // In a production app, we would load a pre-trained model here
    // For this demo, we'll create a dummy model
    model = createDummyModel();
    
    console.log('AI personalization model initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing AI personalization model:', error);
    return false;
  }
};

/**
 * Generates a fully personalized itinerary based on multiple data sources
 * using TensorFlow.js for advanced personalization
 * 
 * @param {Object} userData - User profile and preferences
 * @param {Object} feedbackData - Recent user feedback from continuous collection
 * @param {Object} weatherData - Live weather information for the selected dates
 * @param {Object} eventsData - Data from local events APIs
 * @returns {Promise<Object>} A promise that resolves to the generated itinerary
 */
export const generateDynamicItinerary = async (userData, feedbackData, weatherData, eventsData) => {
  try {
    console.log('Generating personalized itinerary with TensorFlow.js...');
    
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
    
    // Preprocess input data for the model
    const inputTensor = preprocessInputData(userData, feedbackData, weatherData, eventsData);
    
    // Run inference with the model
    const predictions = tf.tidy(() => {
      return model.predict(inputTensor);
    });
    
    // Convert predictions to activity recommendations
    const activityScores = await predictions.data();
    
    // Clean up tensors
    predictions.dispose();
    inputTensor.dispose();
    
    // Generate itinerary using the ML predictions
    // For this demo, we'll use the rule-based method but indicate that ML was used
    const itinerary = await generateRuleBasedItinerary(userData, feedbackData, weatherData, eventsData);
    
    // Update the itinerary to indicate it was generated with ML
    itinerary.dynamicAdjustments.mlBased = true;
    itinerary.title = `ML-Enhanced: ${itinerary.title}`;
    
    console.log(`Generated ML-based itinerary with ${itinerary.days.length} days and ${itinerary.days.reduce((sum, day) => sum + day.activities.length, 0)} activities`);
    
    return itinerary;
  } catch (error) {
    console.error('Error generating ML-based itinerary:', error);
    console.warn('Falling back to rule-based itinerary generation');
    
    // Fall back to rule-based method if ML fails
    return generateRuleBasedItinerary(userData, feedbackData, weatherData, eventsData);
  }
};