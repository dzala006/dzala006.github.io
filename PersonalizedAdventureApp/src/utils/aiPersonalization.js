/**
 * AI Personalization Utility with TensorFlow.js Integration
 * 
 * This utility provides functions for generating personalized itineraries
 * based on user preferences, feedback, weather data, and local events
 * using TensorFlow.js for advanced machine learning-based personalization.
 */

// Import TensorFlow.js
// Note: You'll need to install this package with: npm install @tensorflow/tfjs
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

// Import enhanced data integration utilities
import {
  fetchMultipleApiData,
  fetchCrowdsourcedData,
  getUserLocation,
  applyContextualFilters,
  predictTrendingActivities,
  formatDataForMap,
  applyUserPreferenceFilters
} from './enhancedDataIntegration';

/**
 * Loads the TensorFlow.js model from a local file or URL
 * 
 * @returns {Promise<tf.LayersModel>} The loaded TensorFlow.js model
 */
const loadTensorFlowModel = async () => {
  try {
    console.log('Loading TensorFlow.js model...');
    
    // Simulate model loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demonstration purposes, we'll create a simple model
    // In production, you would use: return await tf.loadLayersModel('path/to/model.json');
    const model = tf.sequential();
    
    // Input shape: [user preferences (10), feedback data (5), weather data (3), events data (5), enhanced data (10)]
    model.add(tf.layers.dense({
      inputShape: [33],
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
    console.log('Generating personalized itinerary with TensorFlow.js AI model and enhanced data integration...');
    
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
    
    // 1. Get user's current location
    const userLocation = await getUserLocation();
    console.log('Got user location:', userLocation);
    
    // 2. Fetch enriched data from multiple external APIs
    const apiParams = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radius: 5000, // 5km radius
      location: 'Current Location',
      date: new Date().toISOString().split('T')[0]
    };
    
    const apiData = await fetchMultipleApiData(apiParams, ['yelp', 'eventbrite', 'openTable', 'viator']);
    console.log('Fetched data from multiple APIs');
    
    // 3. Fetch crowdsourced data
    const crowdsourcedData = await fetchCrowdsourcedData({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radius: 5000
    });
    console.log('Fetched crowdsourced data');
    
    // 4. Apply contextual filters based on time, weather, and user location
    const contextualFilters = {
      time: {
        hour: new Date().getHours(),
        isWeekend: [0, 6].includes(new Date().getDay())
      },
      weather: weatherData.forecast[0],
      location: userLocation,
      preferences: userData.preferences
    };
    
    // Combine all activities from different sources
    const allActivities = [
      ...(apiData.yelp || []),
      ...(apiData.eventbrite || []),
      ...(apiData.viator || []),
      ...(crowdsourcedData.trending_places || [])
    ];
    
    // Apply contextual filters
    const filteredActivities = await applyContextualFilters(allActivities, contextualFilters);
    console.log(`Applied contextual filters, ${filteredActivities.length} activities remaining`);
    
    // 5. Use ML to predict trending activities and high-demand reservations
    const trendingPredictions = await predictTrendingActivities(
      filteredActivities,
      userData,
      contextualFilters.time
    );
    console.log(`Identified ${trendingPredictions.trending_activities.length} trending activities`);
    
    // 6. Apply user preference filters
    const userPreferenceFilters = {
      ...userData.preferences,
      userLocation: userLocation,
      maxDistance: 5000 // 5km max distance
    };
    
    const personalizedActivities = applyUserPreferenceFilters(filteredActivities, userPreferenceFilters);
    console.log(`Applied user preference filters, ${personalizedActivities.length} activities remaining`);
    
    // 7. Enhance eventsData with trending activities
    const enhancedEventsData = {
      events: [
        ...(eventsData.events || []),
        ...trendingPredictions.trending_activities.map(activity => ({
          name: activity.name,
          location: 'Nearby',
          date: new Date().toISOString().split('T')[0],
          category: activity.category || 'trending',
          cost: activity.price?.amount || 0,
          trending: true,
          trending_score: activity.trending_score
        }))
      ]
    };
    
    // 8. Load the TensorFlow.js model
    const model = await loadTensorFlowModel();
    console.log('TensorFlow model loaded successfully');
    
    // 9. Preprocess the input data for the model, including enhanced data
    const enhancedUserData = {
      ...userData,
      enhancedData: {
        nearbyActivities: personalizedActivities,
        trendingActivities: trendingPredictions.trending_activities,
        userLocation: userLocation
      }
    };
    
    const preprocessedData = preprocessDataForModel(enhancedUserData, feedbackData, weatherData, enhancedEventsData);
    console.log('Data preprocessed for model inference');
    
    // 10. Run inference with the model
    const modelPredictions = await runModelInference(model, preprocessedData);
    console.log('Model inference completed successfully');
    
    // 11. Post-process the model output into a structured itinerary
    const itinerary = postProcessModelOutput(
      modelPredictions, 
      enhancedUserData, 
      weatherData, 
      enhancedEventsData
    );
    console.log(`Generated itinerary with ${itinerary.days.length} days and ${itinerary.days.reduce((sum, day) => sum + day.activities.length, 0)} activities`);
    
    // 12. Format map data for the itinerary
    itinerary.mapData = formatDataForMap(personalizedActivities);
    console.log('Added map data to itinerary');
    
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