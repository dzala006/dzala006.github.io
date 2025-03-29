/**
 * AI Personalization Postprocessor
 * 
 * This file contains functions for post-processing model output into structured itineraries
 * used in the AI personalization system.
 */

import { generateUniqueId, generateItineraryTitle } from './aiPersonalizationHelpers';

/**
 * Post-processes model output into a structured itinerary
 * 
 * @param {Array} modelPredictions - Raw predictions from the TensorFlow.js model
 * @param {Object} userData - Original user data
 * @param {Object} weatherData - Original weather data
 * @param {Object} eventsData - Original events data
 * @returns {Object} Structured itinerary object
 */
export const postProcessModelOutput = (modelPredictions, userData, weatherData, eventsData) => {
  console.log('Post-processing model output into structured itinerary...');
  
  // Convert raw model predictions into a structured format
  const structuredPredictions = structurePredictions(modelPredictions);
  
  // Generate itinerary days based on weather forecast length
  const days = [];
  const numDays = weatherData.forecast.length;
  let totalCost = 0;
  
  // Process each day
  for (let i = 0; i < numDays; i++) {
    const dayWeather = weatherData.forecast[i];
    const dayDate = dayWeather.date;
    
    // Get events happening on this day
    const dayEvents = eventsData.events.filter(event => 
      event.date === dayDate || new Date(event.date).toISOString().split('T')[0] === dayDate
    );
    
    // Generate activities for this day based on model predictions
    const activities = generateDayActivities(
      structuredPredictions,
      dayWeather,
      dayEvents,
      userData.preferences,
      i === 0 // First day flag
    );
    
    // Calculate day cost
    const dayCost = activities.reduce((sum, activity) => sum + activity.cost, 0);
    totalCost += dayCost;
    
    days.push({
      date: dayDate,
      weather: {
        condition: dayWeather.condition,
        temperature: dayWeather.temperature,
        precipitation: dayWeather.precipitation
      },
      activities: activities
    });
  }
  
  // Create the final itinerary object
  const itinerary = {
    id: generateUniqueId(),
    title: generateItineraryTitle(userData.preferences, weatherData, days.length),
    startDate: days[0].date,
    endDate: days[days.length - 1].date,
    days: days,
    totalCost: totalCost,
    preferences: userData.preferences,
    generatedAt: new Date().toISOString(),
    mlModelConfidence: calculateModelConfidence(structuredPredictions),
    dynamicAdjustments: {
      weatherBased: true,
      feedbackBased: userData.enhancedData?.feedbackBased || false,
      eventsBased: eventsData.events.length > 0,
      mlBased: true
    }
  };
  
  return itinerary;
};

/**
 * Structures raw model predictions into a more usable format
 * 
 * @param {Array} rawPredictions - Raw predictions from the model
 * @returns {Object} Structured predictions
 */
export const structurePredictions = (rawPredictions) => {
  // Activity type mapping (from model output indices to activity types)
  const activityTypeMapping = [
    'hiking',
    'museums',
    'food',
    'shopping',
    'tours'
  ];
  
  // For demonstration purposes, we'll assume the model outputs 40 values:
  // - 10 values for morning activities
  // - 10 values for lunch activities
  // - 10 values for afternoon activities
  // - 10 values for evening activities
  
  // Each set of 10 values represents:
  // - 5 values for activity type probabilities (hiking, museums, food, shopping, tours)
  // - 1 value for cost (normalized 0-1)
  // - 1 value for indoor/outdoor (0=outdoor, 1=indoor)
  // - 1 value for reservation needed (0=no, 1=yes)
  // - 1 value for suitability score (0-1)
  // - 1 value for confidence (0-1)
  
  // Extract and structure the predictions
  return {
    timeSlots: {
      morning: {
        activityType: rawPredictions.slice(0, 5),
        cost: rawPredictions[5],
        isIndoor: rawPredictions[6] > 0.5,
        needsReservation: rawPredictions[7] > 0.5,
        suitabilityScore: rawPredictions[8],
        confidence: rawPredictions[9]
      },
      lunch: {
        activityType: rawPredictions.slice(10, 15),
        cost: rawPredictions[15],
        isIndoor: rawPredictions[16] > 0.5,
        needsReservation: rawPredictions[17] > 0.5,
        suitabilityScore: rawPredictions[18],
        confidence: rawPredictions[19]
      },
      afternoon: {
        activityType: rawPredictions.slice(20, 25),
        cost: rawPredictions[25],
        isIndoor: rawPredictions[26] > 0.5,
        needsReservation: rawPredictions[27] > 0.5,
        suitabilityScore: rawPredictions[28],
        confidence: rawPredictions[29]
      },
      evening: {
        activityType: rawPredictions.slice(30, 35),
        cost: rawPredictions[35],
        isIndoor: rawPredictions[36] > 0.5,
        needsReservation: rawPredictions[37] > 0.5,
        suitabilityScore: rawPredictions[38],
        confidence: rawPredictions[39]
      }
    },
    confidenceScore: calculateAverageConfidence(rawPredictions)
  };
};

/**
 * Calculates the average confidence score from model predictions
 * 
 * @param {Array} predictions - Raw model predictions
 * @returns {number} Average confidence score
 */
export const calculateAverageConfidence = (predictions) => {
  // Confidence values are at indices 9, 19, 29, 39
  const confidenceValues = [predictions[9], predictions[19], predictions[29], predictions[39]];
  return confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length;
};

/**
 * Calculates the overall model confidence for the itinerary
 * 
 * @param {Object} structuredPredictions - Structured model predictions
 * @returns {number} Overall model confidence
 */
export const calculateModelConfidence = (structuredPredictions) => {
  const { morning, lunch, afternoon, evening } = structuredPredictions.timeSlots;
  return (morning.confidence + lunch.confidence + afternoon.confidence + evening.confidence) / 4;
};

/**
 * Generates activities for a specific day based on model predictions
 * 
 * @param {Object} predictions - Structured model predictions
 * @param {Object} weather - Weather forecast for this day
 * @param {Array} events - Events happening on this day
 * @param {Object} preferences - User preferences
 * @param {boolean} isFirstDay - Whether this is the first day of the itinerary
 * @returns {Array} List of activities for the day
 */
export const generateDayActivities = (predictions, weather, events, preferences, isFirstDay) => {
  const activities = [];
  const { morning, lunch, afternoon, evening } = predictions.timeSlots;
  
  // Activity type mapping (from model output indices to activity types)
  const activityTypeMapping = [
    'hiking',
    'museums',
    'food',
    'shopping',
    'tours'
  ];
  
  // Morning activity
  const morningActivityType = activityTypeMapping[
    morning.activityType.indexOf(
      Math.max(...morning.activityType)
    )
  ];
  
  const morningActivity = {
    id: generateUniqueId(),
    time: '09:00 AM',
    title: generateActivityTitle(morningActivityType, 'morning'),
    description: generateActivityDescription(morningActivityType, weather, preferences),
    location: generateActivityLocation(morningActivityType),
    cost: Math.round(morning.cost * 100), // Scale to realistic cost
    weatherDependent: !morning.isIndoor,
    reservationRequired: morning.needsReservation,
    reservationStatus: morning.needsReservation ? 'Pending' : 'Not Required',
    suitableFor: getSuitabilityLabel(morning.suitabilityScore)
  };
  activities.push(morningActivity);
  
  // Lunch activity
  const lunchActivity = {
    id: generateUniqueId(),
    time: '12:30 PM',
    title: 'Lunch at Local Restaurant',
    description: preferences.dietaryRestrictions.length > 0 
      ? `Enjoy lunch at a restaurant with ${preferences.dietaryRestrictions.join(', ')} options.`
      : 'Enjoy lunch at a popular local restaurant.',
    location: 'Local Restaurant',
    cost: Math.round(lunch.cost * 100), // Scale to realistic cost
    weatherDependent: false,
    reservationRequired: lunch.needsReservation,
    reservationStatus: lunch.needsReservation ? 'Confirmed' : 'Not Required',
    suitableFor: 'Everyone'
  };
  activities.push(lunchActivity);
  
  // Afternoon activity
  // Check if there's a relevant event first
  let afternoonActivity;
  const relevantEvent = events.find(event => 
    event.cost <= preferences.budgetRange.max &&
    preferences.activityTypes.some(type => event.category.toLowerCase().includes(type.toLowerCase()))
  );
  
  if (relevantEvent) {
    // Use the event as the afternoon activity
    afternoonActivity = {
      id: generateUniqueId(),
      time: '03:00 PM',
      title: relevantEvent.name,
      description: `Special local event: ${relevantEvent.name}`,
      location: relevantEvent.location,
      cost: relevantEvent.cost,
      weatherDependent: false, // Assuming events are generally not weather dependent
      reservationRequired: true,
      reservationStatus: 'Confirmed',
      suitableFor: 'Everyone'
    };
  } else {
    // Generate afternoon activity from model predictions
    const afternoonActivityType = activityTypeMapping[
      afternoon.activityType.indexOf(
        Math.max(...afternoon.activityType)
      )
    ];
    
    afternoonActivity = {
      id: generateUniqueId(),
      time: '02:30 PM',
      title: generateActivityTitle(afternoonActivityType, 'afternoon'),
      description: generateActivityDescription(afternoonActivityType, weather, preferences),
      location: generateActivityLocation(afternoonActivityType),
      cost: Math.round(afternoon.cost * 100), // Scale to realistic cost
      weatherDependent: !afternoon.isIndoor,
      reservationRequired: afternoon.needsReservation,
      reservationStatus: afternoon.needsReservation ? 'Pending' : 'Not Required',
      suitableFor: getSuitabilityLabel(afternoon.suitabilityScore)
    };
  }
  activities.push(afternoonActivity);
  
  // Evening activity
  const eveningActivity = {
    id: generateUniqueId(),
    time: '07:00 PM',
    title: 'Dinner Experience',
    description: preferences.dietaryRestrictions.length > 0 
      ? `Enjoy dinner at a restaurant with ${preferences.dietaryRestrictions.join(', ')} options.`
      : 'Enjoy dinner at a highly-rated local restaurant.',
    location: 'Downtown Restaurant',
    cost: Math.round(evening.cost * 100), // Scale to realistic cost
    weatherDependent: false,
    reservationRequired: true,
    reservationStatus: 'Pending',
    suitableFor: 'Everyone'
  };
  activities.push(eveningActivity);
  
  return activities;
};

/**
 * Generate a title for an activity based on its type and time of day
 * 
 * @param {string} activityType - Type of activity
 * @param {string} timeOfDay - Time of day (morning, afternoon, evening)
 * @returns {string} Activity title
 */
export const generateActivityTitle = (activityType, timeOfDay) => {
  const titles = {
    hiking: {
      morning: 'Morning Nature Hike',
      afternoon: 'Scenic Trail Adventure',
      evening: 'Sunset Hiking Experience'
    },
    museums: {
      morning: 'Museum Exploration',
      afternoon: 'Cultural Museum Visit',
      evening: 'Evening Museum Tour'
    },
    food: {
      morning: 'Local Cuisine Breakfast',
      afternoon: 'Food Tasting Experience',
      evening: 'Culinary Dinner Adventure'
    },
    shopping: {
      morning: 'Local Market Shopping',
      afternoon: 'Boutique Shopping Experience',
      evening: 'Evening Shopping Tour'
    },
    tours: {
      morning: 'Guided Morning Tour',
      afternoon: 'Comprehensive City Tour',
      evening: 'Evening Sightseeing Tour'
    }
  };
  
  return titles[activityType]?.[timeOfDay] || `${activityType.charAt(0).toUpperCase() + activityType.slice(1)} Activity`;
};

/**
 * Generate a description for an activity based on its type, weather, and user preferences
 * 
 * @param {string} activityType - Type of activity
 * @param {Object} weather - Weather forecast
 * @param {Object} preferences - User preferences
 * @returns {string} Activity description
 */
export const generateActivityDescription = (activityType, weather, preferences) => {
  const isRainy = weather.condition.toLowerCase().includes('rain') || weather.precipitation > 50;
  const isHot = weather.temperature > 85;
  const isCold = weather.temperature < 50;
  
  const descriptions = {
    hiking: {
      default: 'Explore scenic trails and enjoy the natural beauty of the area.',
      rainy: 'A guided hike through covered forest trails, protected from the rain.',
      hot: 'A shaded hiking trail with plenty of rest spots and water sources.',
      cold: 'A brisk hike with stunning views, perfect for staying warm and active.'
    },
    museums: {
      default: 'Explore fascinating exhibits and learn about local history and culture.',
      rainy: 'Stay dry while exploring fascinating museum exhibits and cultural artifacts.',
      hot: 'Enjoy air-conditioned comfort while exploring fascinating exhibits.',
      cold: 'Warm up while exploring fascinating exhibits and cultural artifacts.'
    },
    food: {
      default: 'Savor local flavors and culinary specialties at popular eateries.',
      rainy: 'Enjoy local cuisine in a cozy, sheltered setting away from the rain.',
      hot: 'Cool down with refreshing local cuisine and beverages.',
      cold: 'Warm up with hearty local cuisine and hot beverages.'
    },
    shopping: {
      default: 'Browse local shops and find unique souvenirs and gifts.',
      rainy: 'Stay dry while browsing indoor markets and boutique shops.',
      hot: 'Browse air-conditioned shops and markets for unique finds.',
      cold: 'Warm up while browsing indoor markets and boutique shops.'
    },
    tours: {
      default: 'Join a guided tour to discover the highlights and hidden gems of the area.',
      rainy: 'A covered tour that showcases the area\'s highlights while staying dry.',
      hot: 'A comfortable tour with air-conditioned transportation between stops.',
      cold: 'A cozy tour with heated transportation between interesting stops.'
    }
  };
  
  // Select the appropriate description based on weather
  let description;
  if (isRainy) {
    description = descriptions[activityType].rainy;
  } else if (isHot) {
    description = descriptions[activityType].hot;
  } else if (isCold) {
    description = descriptions[activityType].cold;
  } else {
    description = descriptions[activityType].default;
  }
  
  // Add accessibility information if needed
  if (preferences.accessibility) {
    description += ' This activity is fully accessible.';
  }
  
  return description;
};

/**
 * Generate a location for an activity based on its type
 * 
 * @param {string} activityType - Type of activity
 * @returns {string} Activity location
 */
export const generateActivityLocation = (activityType) => {
  const locations = {
    hiking: 'Local Nature Trail',
    museums: 'City Museum',
    food: 'Downtown Food District',
    shopping: 'Main Street Shopping Area',
    tours: 'City Center Tour Meeting Point'
  };
  
  return locations[activityType] || 'Local Venue';
};

/**
 * Get a suitability label based on a suitability score
 * 
 * @param {number} score - Suitability score (0-1)
 * @returns {string} Suitability label
 */
export const getSuitabilityLabel = (score) => {
  if (score > 0.8) {
    return 'Everyone';
  } else if (score > 0.6) {
    return 'Most Travelers';
  } else if (score > 0.4) {
    return 'Adventure Seekers';
  } else if (score > 0.2) {
    return 'Experienced Travelers';
  } else {
    return 'Specialized Interests';
  }
};

// Export all functions for testing
export default {
  postProcessModelOutput,
  structurePredictions,
  calculateAverageConfidence,
  calculateModelConfidence,
  generateDayActivities,
  generateActivityTitle,
  generateActivityDescription,
  generateActivityLocation,
  getSuitabilityLabel
};