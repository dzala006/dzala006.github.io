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

// Import analytics utilities
import { 
  trackItineraryGeneration, 
  startTransaction, 
  captureError 
} from './analytics';

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
    
    // Add input layer
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [50]
    }));
    
    // Add hidden layer
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }));
    
    // Add output layer
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
    
    return model;
  } catch (error) {
    console.error('Error loading TensorFlow.js model:', error);
    throw error;
  }
};

/**
 * Run inference with the TensorFlow.js model
 * 
 * @param {tf.LayersModel} model - The TensorFlow.js model
 * @param {Object} preprocessedData - The preprocessed input data
 * @returns {Promise<tf.Tensor>} The model predictions
 */
const runModelInference = async (model, preprocessedData) => {
  try {
    // Convert preprocessed data to tensor
    const inputTensor = tf.tensor2d([preprocessedData.features]);
    
    // Run inference
    const predictions = model.predict(inputTensor);
    
    // Get the result as a JavaScript array
    const result = await predictions.array();
    
    // Clean up tensors to prevent memory leaks
    inputTensor.dispose();
    predictions.dispose();
    
    return result[0];
  } catch (error) {
    console.error('Error running model inference:', error);
    throw error;
  }
};

/**
 * Generate a personalized itinerary based on user data, feedback, weather, and events
 * 
 * @param {Object} userData - User profile and preferences
 * @param {Object} feedbackData - Recent user feedback
 * @param {Object} weatherData - Weather information for the selected date
 * @param {Object} eventsData - Data from local events APIs
 * @returns {Promise<Object>} A promise that resolves to the generated itinerary
 */
export const generateDynamicItinerary = async (userData, feedbackData, weatherData, eventsData) => {
  // Start a performance transaction for monitoring
  const transaction = startTransaction('generateDynamicItinerary', 'ai.personalization');
  const startTime = Date.now();
  
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
    const locationSpan = transaction.startChild('getUserLocation', 'geolocation');
    const userLocation = await getUserLocation();
    console.log('Got user location:', userLocation);
    locationSpan.finish();
    
    // 2. Fetch enriched data from multiple external APIs
    const apiParams = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radius: 5000, // 5km radius
      location: 'Current Location',
      date: new Date().toISOString().split('T')[0]
    };
    
    const apiSpan = transaction.startChild('fetchMultipleApiData', 'api.external');
    const apiData = await fetchMultipleApiData(apiParams, ['yelp', 'eventbrite', 'openTable', 'viator']);
    console.log('Fetched data from multiple APIs');
    apiSpan.finish();
    
    // 3. Fetch crowdsourced data
    const crowdSpan = transaction.startChild('fetchCrowdsourcedData', 'api.crowdsourced');
    const crowdsourcedData = await fetchCrowdsourcedData({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radius: 5000
    });
    console.log('Fetched crowdsourced data');
    crowdSpan.finish();
    
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
    const filterSpan = transaction.startChild('applyContextualFilters', 'data.processing');
    const filteredActivities = await applyContextualFilters(allActivities, contextualFilters);
    console.log(`Applied contextual filters, ${filteredActivities.length} activities remaining`);
    filterSpan.finish();
    
    // 5. Use ML to predict trending activities and high-demand reservations
    const trendingSpan = transaction.startChild('predictTrendingActivities', 'ai.prediction');
    const trendingPredictions = await predictTrendingActivities(
      filteredActivities,
      userData,
      contextualFilters.time
    );
    console.log(`Identified ${trendingPredictions.trending_activities.length} trending activities`);
    trendingSpan.finish();
    
    // 6. Apply user preference filters
    const preferenceSpan = transaction.startChild('applyUserPreferenceFilters', 'data.processing');
    const userPreferenceFilters = {
      ...userData.preferences,
      userLocation: userLocation,
      maxDistance: 5000 // 5km max distance
    };
    
    const personalizedActivities = applyUserPreferenceFilters(filteredActivities, userPreferenceFilters);
    console.log(`Applied user preference filters, ${personalizedActivities.length} activities remaining`);
    preferenceSpan.finish();
    
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
    const modelSpan = transaction.startChild('loadTensorFlowModel', 'ai.model');
    const model = await loadTensorFlowModel();
    console.log('TensorFlow model loaded successfully');
    modelSpan.finish();
    
    // 9. Preprocess the input data for the model, including enhanced data
    const preprocessSpan = transaction.startChild('preprocessDataForModel', 'data.processing');
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
    preprocessSpan.finish();
    
    // 10. Run inference with the model
    const inferenceSpan = transaction.startChild('runModelInference', 'ai.inference');
    const modelPredictions = await runModelInference(model, preprocessedData);
    console.log('Model inference completed successfully');
    inferenceSpan.finish();
    
    // 11. Post-process the model output into a structured itinerary
    const postprocessSpan = transaction.startChild('postProcessModelOutput', 'data.processing');
    const itinerary = postProcessModelOutput(
      modelPredictions, 
      enhancedUserData, 
      weatherData, 
      enhancedEventsData
    );
    console.log(`Generated itinerary with ${itinerary.days.length} days and ${itinerary.days.reduce((sum, day) => sum + day.activities.length, 0)} activities`);
    postprocessSpan.finish();
    
    // 12. Format map data for the itinerary
    const mapSpan = transaction.startChild('formatDataForMap', 'data.processing');
    itinerary.mapData = formatDataForMap(personalizedActivities);
    console.log('Added map data to itinerary');
    mapSpan.finish();
    
    // Calculate generation time
    const generationTime = Date.now() - startTime;
    
    // Track itinerary generation in analytics
    trackItineraryGeneration({
      activityCount: itinerary.days.reduce((sum, day) => sum + day.activities.length, 0),
      hasReservations: itinerary.days.some(day => 
        day.activities.some(activity => activity.reservation)
      ),
      generationTime: generationTime,
      usedAI: true,
      dataSourceCount: Object.keys(apiData).filter(key => apiData[key]?.length > 0).length,
      weatherCondition: weatherData.forecast[0].condition,
      trendingActivitiesCount: trendingPredictions.trending_activities.length
    });
    
    // Complete the transaction
    transaction.finish();
    
    return itinerary;
  } catch (error) {
    console.error('Error generating dynamic itinerary with TensorFlow.js:', error);
    console.log('Falling back to rule-based itinerary generation...');
    
    // Track error in analytics
    captureError(error, {
      level: 'error',
      tags: {
        component: 'aiPersonalization',
        function: 'generateDynamicItinerary'
      },
      extra: {
        userData: userData ? { 
          hasPreferences: !!userData.preferences,
          preferenceCount: userData.preferences ? Object.keys(userData.preferences).length : 0
        } : null,
        hasFeedbackData: !!feedbackData,
        hasWeatherData: !!weatherData && !!weatherData.forecast,
        hasEventsData: !!eventsData && !!eventsData.events
      }
    });
    
    // Complete the transaction with error status
    transaction.finish();
    
    // Fallback to the rule-based approach if the ML model fails
    const fallbackStartTime = Date.now();
    const fallbackItinerary = await generateRuleBasedItinerary(userData, feedbackData, weatherData, eventsData);
    
    // Track fallback itinerary generation
    trackItineraryGeneration({
      activityCount: fallbackItinerary.days.reduce((sum, day) => sum + day.activities.length, 0),
      hasReservations: fallbackItinerary.days.some(day => 
        day.activities.some(activity => activity.reservation)
      ),
      generationTime: Date.now() - fallbackStartTime,
      usedAI: false,
      fallbackReason: error.message
    });
    
    return fallbackItinerary;
  }
};

// Export other functions that might be needed by other components
export { generateUniqueId, generateItineraryTitle };