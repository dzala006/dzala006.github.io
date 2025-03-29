/**
 * AI Personalization Preprocessor
 * 
 * This file contains functions for preprocessing input data for the TensorFlow.js model
 * used in the AI personalization system.
 */

/**
 * Preprocesses input data for the TensorFlow.js model
 * 
 * @param {Object} userData - User profile and preferences
 * @param {Object} feedbackData - Recent user feedback
 * @param {Object} weatherData - Weather forecast data
 * @param {Object} eventsData - Local events data
 * @returns {Object} Preprocessed data ready for model inference
 */
export const preprocessDataForModel = (userData, feedbackData, weatherData, eventsData) => {
  console.log('Preprocessing data for TensorFlow.js model...');
  
  // Extract user preferences
  const { 
    activityTypes = [], 
    budgetRange = { min: 0, max: 500 }, 
    travelStyle = 'balanced',
    accessibility = false,
    dietaryRestrictions = []
  } = userData.preferences;
  
  // 1. Encode user preferences
  const userFeatures = encodeUserPreferences(
    activityTypes,
    budgetRange,
    travelStyle,
    accessibility,
    dietaryRestrictions
  );
  
  // 2. Encode feedback data
  const feedbackFeatures = encodeFeedbackData(feedbackData);
  
  // 3. Encode weather data
  const weatherFeatures = encodeWeatherData(weatherData);
  
  // 4. Encode events data
  const eventsFeatures = encodeEventsData(eventsData);
  
  // Combine all features into a single flattened array
  const flattenedFeatures = [
    ...userFeatures,
    ...feedbackFeatures,
    ...weatherFeatures,
    ...eventsFeatures
  ];
  
  return {
    features: flattenedFeatures,
    userFeatures,
    feedbackFeatures,
    weatherFeatures,
    eventsFeatures,
    flattenedFeatures
  };
};

/**
 * Encodes user preferences into feature vectors
 * 
 * @param {Array} activityTypes - List of preferred activity types
 * @param {Object} budgetRange - Min and max budget values
 * @param {string} travelStyle - Travel style preference (adventurous, balanced, relaxed)
 * @param {boolean} accessibility - Whether accessibility is required
 * @param {Array} dietaryRestrictions - List of dietary restrictions
 * @returns {Array} Encoded user preference features
 */
export const encodeUserPreferences = (
  activityTypes,
  budgetRange,
  travelStyle,
  accessibility,
  dietaryRestrictions
) => {
  const userFeatures = [];
  
  // Encode activity types (one-hot encoding for common types)
  const commonActivityTypes = ['hiking', 'museums', 'food', 'shopping', 'tours'];
  commonActivityTypes.forEach(type => {
    userFeatures.push(activityTypes.includes(type) ? 1.0 : 0.0);
  });
  
  // Normalize budget range
  userFeatures.push(budgetRange.min / 1000); // Normalize to 0-1 range
  userFeatures.push(budgetRange.max / 1000); // Normalize to 0-1 range
  
  // Encode travel style
  userFeatures.push(travelStyle === 'adventurous' ? 1.0 : 0.0);
  userFeatures.push(travelStyle === 'balanced' ? 1.0 : 0.0);
  userFeatures.push(travelStyle === 'relaxed' ? 1.0 : 0.0);
  
  // Encode accessibility requirement
  userFeatures.push(accessibility ? 1.0 : 0.0);
  
  // Encode dietary restrictions (one-hot encoding for common restrictions)
  const commonDietaryRestrictions = ['vegetarian', 'vegan', 'gluten-free'];
  commonDietaryRestrictions.forEach(restriction => {
    userFeatures.push(dietaryRestrictions.includes(restriction) ? 1.0 : 0.0);
  });
  
  return userFeatures;
};

/**
 * Encodes feedback data into feature vectors
 * 
 * @param {Object} feedbackData - Recent user feedback
 * @returns {Array} Encoded feedback features
 */
export const encodeFeedbackData = (feedbackData) => {
  const feedbackFeatures = [];
  
  // Check if feedback data exists
  if (feedbackData && feedbackData.responses) {
    const responses = feedbackData.responses;
    
    // Encode mood (positive, neutral, negative)
    let moodScore = 0.5; // Default to neutral
    Object.values(responses).forEach(response => {
      if (response.context === 'mood') {
        const moodResponse = response.response.toLowerCase();
        if (moodResponse.includes('happy') || moodResponse.includes('excited') || moodResponse.includes('energetic')) {
          moodScore = 1.0;
        } else if (moodResponse.includes('tired') || moodResponse.includes('sad') || moodResponse.includes('bored')) {
          moodScore = 0.0;
        }
      }
    });
    feedbackFeatures.push(moodScore);
    
    // Encode budget sensitivity
    let budgetSensitivity = 0.5; // Default to moderate
    Object.values(responses).forEach(response => {
      if (response.context === 'budget') {
        const budgetResponse = response.response.toLowerCase();
        if (budgetResponse.includes('important') || budgetResponse.includes('concerned')) {
          budgetSensitivity = 1.0;
        } else if (budgetResponse.includes('not important') || budgetResponse.includes('flexible')) {
          budgetSensitivity = 0.0;
        }
      }
    });
    feedbackFeatures.push(budgetSensitivity);
    
    // Encode indoor/outdoor preference
    let indoorPreference = 0.5; // Default to balanced
    Object.values(responses).forEach(response => {
      if (response.context === 'environment') {
        const envResponse = response.response.toLowerCase();
        if (envResponse.includes('indoor')) {
          indoorPreference = 1.0;
        } else if (envResponse.includes('outdoor')) {
          indoorPreference = 0.0;
        }
      }
    });
    feedbackFeatures.push(indoorPreference);
    
    // Encode social preference
    let socialPreference = 0.5; // Default to balanced
    Object.values(responses).forEach(response => {
      if (response.context === 'social') {
        const socialResponse = response.response.toLowerCase();
        if (socialResponse.includes('group') || socialResponse.includes('social')) {
          socialPreference = 1.0;
        } else if (socialResponse.includes('solo') || socialResponse.includes('alone')) {
          socialPreference = 0.0;
        }
      }
    });
    feedbackFeatures.push(socialPreference);
    
    // Encode food preference
    let foodPreference = 0.5; // Default to balanced
    Object.values(responses).forEach(response => {
      if (response.context === 'food') {
        const foodResponse = response.response.toLowerCase();
        if (foodResponse.includes('adventurous') || foodResponse.includes('try new')) {
          foodPreference = 1.0;
        } else if (foodResponse.includes('familiar') || foodResponse.includes('comfort')) {
          foodPreference = 0.0;
        }
      }
    });
    feedbackFeatures.push(foodPreference);
  } else {
    // If no feedback data, use neutral values
    feedbackFeatures.push(0.5, 0.5, 0.5, 0.5, 0.5);
  }
  
  return feedbackFeatures;
};

/**
 * Encodes weather data into feature vectors
 * 
 * @param {Object} weatherData - Weather forecast data
 * @returns {Array} Encoded weather features
 */
export const encodeWeatherData = (weatherData) => {
  const weatherFeatures = [];
  
  // Use the first day's weather for simplicity
  // In a real implementation, you would encode weather for each day
  const firstDayWeather = weatherData.forecast[0];
  
  // Encode temperature (normalized to 0-1 range, assuming 0-100°F range)
  weatherFeatures.push(Math.min(Math.max(firstDayWeather.temperature, 0), 100) / 100);
  
  // Encode precipitation probability (already 0-100, normalize to 0-1)
  weatherFeatures.push(firstDayWeather.precipitation / 100);
  
  // Encode weather condition (sunny=1.0, partly cloudy=0.5, rainy=0.0)
  const condition = firstDayWeather.condition.toLowerCase();
  if (condition.includes('sun') || condition.includes('clear')) {
    weatherFeatures.push(1.0);
  } else if (condition.includes('cloud') || condition.includes('overcast')) {
    weatherFeatures.push(0.5);
  } else if (condition.includes('rain') || condition.includes('shower')) {
    weatherFeatures.push(0.0);
  } else {
    weatherFeatures.push(0.5); // Default for unknown conditions
  }
  
  return weatherFeatures;
};

/**
 * Encodes events data into feature vectors
 * 
 * @param {Object} eventsData - Local events data
 * @returns {Array} Encoded events features
 */
export const encodeEventsData = (eventsData) => {
  const eventsFeatures = [];
  
  // Count number of available events
  const numEvents = eventsData.events.length;
  eventsFeatures.push(Math.min(numEvents / 10, 1.0)); // Normalize to 0-1, cap at 10 events
  
  // Calculate average event cost (normalized to 0-1, assuming 0-200 range)
  const avgEventCost = numEvents > 0 
    ? eventsData.events.reduce((sum, event) => sum + event.cost, 0) / numEvents / 200
    : 0.5;
  eventsFeatures.push(Math.min(avgEventCost, 1.0));
  
  // Encode event categories (one-hot encoding for common categories)
  const commonEventCategories = ['cultural', 'sports', 'music'];
  commonEventCategories.forEach(category => {
    const hasCategory = eventsData.events.some(event => 
      event.category.toLowerCase().includes(category.toLowerCase())
    );
    eventsFeatures.push(hasCategory ? 1.0 : 0.0);
  });
  
  return eventsFeatures;
};

// Export all functions for testing
export default {
  preprocessDataForModel,
  encodeUserPreferences,
  encodeFeedbackData,
  encodeWeatherData,
  encodeEventsData
};