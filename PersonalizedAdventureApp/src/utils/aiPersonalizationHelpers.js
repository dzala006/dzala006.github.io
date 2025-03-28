/**
 * AI Personalization Helper Functions
 * 
 * This file contains helper functions for the TensorFlow.js-based
 * itinerary personalization system.
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
  
  // 2. Encode feedback data
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
  
  // 3. Encode weather data
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
  
  // 4. Encode events data
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
  
  // Combine all features into a single flattened array
  const flattenedFeatures = [
    ...userFeatures,
    ...feedbackFeatures,
    ...weatherFeatures,
    ...eventsFeatures
  ];
  
  return {
    userFeatures,
    feedbackFeatures,
    weatherFeatures,
    eventsFeatures,
    flattenedFeatures
  };
};

/**
 * Post-processes model output into a structured itinerary
 * 
 * @param {Object} modelPredictions - Raw predictions from the TensorFlow.js model
 * @param {Object} userData - Original user data
 * @param {Object} weatherData - Original weather data
 * @param {Object} eventsData - Original events data
 * @returns {Object} Structured itinerary object
 */
export const postProcessModelOutput = (modelPredictions, userData, weatherData, eventsData) => {
  console.log('Post-processing model output into structured itinerary...');
  
  // Generate itinerary days based on weather forecast length
  const days = [];
  const numDays = weatherData.forecast.length;
  let totalCost = 0;
  
  // Activity type mapping (from model output indices to activity types)
  const activityTypeMapping = [
    'hiking',
    'museums',
    'food',
    'shopping',
    'tours'
  ];
  
  // Process each day
  for (let i = 0; i < numDays; i++) {
    const dayWeather = weatherData.forecast[i];
    const dayDate = dayWeather.date;
    
    // Get events happening on this day
    const dayEvents = eventsData.events.filter(event => 
      event.date === dayDate || new Date(event.date).toISOString().split('T')[0] === dayDate
    );
    
    // Generate activities for this day based on model predictions
    const activities = [];
    
    // Morning activity
    const morningActivityType = activityTypeMapping[
      modelPredictions.timeSlots.morning.activityType.indexOf(
        Math.max(...modelPredictions.timeSlots.morning.activityType)
      )
    ];
    
    const morningActivity = {
      id: generateUniqueId(),
      time: '09:00 AM',
      title: generateActivityTitle(morningActivityType, 'morning'),
      description: generateActivityDescription(morningActivityType, dayWeather, userData.preferences),
      location: generateActivityLocation(morningActivityType),
      cost: Math.round(modelPredictions.timeSlots.morning.cost * 100), // Scale to realistic cost
      weatherDependent: !modelPredictions.timeSlots.morning.isIndoor,
      reservationRequired: modelPredictions.timeSlots.morning.needsReservation,
      reservationStatus: modelPredictions.timeSlots.morning.needsReservation ? 'Pending' : 'Not Required',
      suitableFor: getSuitabilityLabel(modelPredictions.timeSlots.morning.suitabilityScore)
    };
    activities.push(morningActivity);
    
    // Lunch activity
    const lunchActivity = {
      id: generateUniqueId(),
      time: '12:30 PM',
      title: 'Lunch at Local Restaurant',
      description: userData.preferences.dietaryRestrictions.length > 0 
        ? `Enjoy lunch at a restaurant with ${userData.preferences.dietaryRestrictions.join(', ')} options.`
        : 'Enjoy lunch at a popular local restaurant.',
      location: 'Local Restaurant',
      cost: Math.round(modelPredictions.timeSlots.lunch.cost * 100), // Scale to realistic cost
      weatherDependent: false,
      reservationRequired: modelPredictions.timeSlots.lunch.needsReservation,
      reservationStatus: modelPredictions.timeSlots.lunch.needsReservation ? 'Confirmed' : 'Not Required',
      suitableFor: 'Everyone'
    };
    activities.push(lunchActivity);
    
    // Afternoon activity
    // Check if there's a relevant event first
    let afternoonActivity;
    const relevantEvent = dayEvents.find(event => 
      event.cost <= userData.preferences.budgetRange.max &&
      userData.preferences.activityTypes.some(type => event.category.toLowerCase().includes(type.toLowerCase()))
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
        modelPredictions.timeSlots.afternoon.activityType.indexOf(
          Math.max(...modelPredictions.timeSlots.afternoon.activityType)
        )
      ];
      
      afternoonActivity = {
        id: generateUniqueId(),
        time: '02:30 PM',
        title: generateActivityTitle(afternoonActivityType, 'afternoon'),
        description: generateActivityDescription(afternoonActivityType, dayWeather, userData.preferences),
        location: generateActivityLocation(afternoonActivityType),
        cost: Math.round(modelPredictions.timeSlots.afternoon.cost * 100), // Scale to realistic cost
        weatherDependent: !modelPredictions.timeSlots.afternoon.isIndoor,
        reservationRequired: modelPredictions.timeSlots.afternoon.needsReservation,
        reservationStatus: modelPredictions.timeSlots.afternoon.needsReservation ? 'Pending' : 'Not Required',
        suitableFor: getSuitabilityLabel(modelPredictions.timeSlots.afternoon.suitabilityScore)
      };
    }
    activities.push(afternoonActivity);
    
    // Evening activity
    const eveningActivity = {
      id: generateUniqueId(),
      time: '07:00 PM',
      title: 'Dinner Experience',
      description: userData.preferences.dietaryRestrictions.length > 0 
        ? `Enjoy dinner at a restaurant with ${userData.preferences.dietaryRestrictions.join(', ')} options.`
        : 'Enjoy dinner at a highly-rated local restaurant.',
      location: 'Downtown Restaurant',
      cost: Math.round(modelPredictions.timeSlots.evening.cost * 100), // Scale to realistic cost
      weatherDependent: false,
      reservationRequired: true,
      reservationStatus: 'Pending',
      suitableFor: 'Everyone'
    };
    activities.push(eveningActivity);
    
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
    mlModelConfidence: modelPredictions.confidenceScore,
    dynamicAdjustments: {
      weatherBased: true,
      feedbackBased: !!feedbackData && Object.keys(feedbackData.responses || {}).length > 0,
      eventsBased: eventsData.events.length > 0,
      mlBased: true
    }
  };
  
  return itinerary;
};

/**
 * Generate a unique ID for itinerary items
 * 
 * @returns {string} A unique ID
 */
export const generateUniqueId = () => {
  return 'id_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Generate a title for the itinerary based on preferences and weather
 * 
 * @param {Object} preferences - User preferences
 * @param {Object} weatherData - Weather forecast data
 * @param {number} numDays - Number of days in the itinerary
 * @returns {string} A descriptive title for the itinerary
 */
export const generateItineraryTitle = (preferences, weatherData, numDays) => {
  // Get the dominant weather condition
  const weatherConditions = weatherData.forecast.map(day => day.condition.toLowerCase());
  const isMostlySunny = weatherConditions.filter(condition => 
    condition.includes('sun') || condition.includes('clear')
  ).length > weatherConditions.length / 2;
  
  const isMostlyRainy = weatherConditions.filter(condition => 
    condition.includes('rain') || condition.includes('shower')
  ).length > weatherConditions.length / 2;
  
  // Get the trip duration type
  let durationType = 'Adventure';
  if (numDays <= 2) {
    durationType = 'Weekend Getaway';
  } else if (numDays <= 5) {
    durationType = 'Short Vacation';
  } else {
    durationType = 'Extended Journey';
  }
  
  // Get the style descriptor based on preferences
  let styleDescriptor = '';
  if (preferences.travelStyle === 'adventurous') {
    styleDescriptor = 'Adventurous';
  } else if (preferences.travelStyle === 'relaxed') {
    styleDescriptor = 'Relaxing';
  } else {
    styleDescriptor = 'Balanced';
  }
  
  // Get activity focus
  let activityFocus = '';
  if (preferences.activityTypes.includes('hiking') || preferences.activityTypes.includes('parks')) {
    activityFocus = 'Nature';
  } else if (preferences.activityTypes.includes('museums') || preferences.activityTypes.includes('galleries')) {
    activityFocus = 'Cultural';
  } else if (preferences.activityTypes.includes('food') || preferences.activityTypes.includes('restaurants')) {
    activityFocus = 'Culinary';
  } else {
    activityFocus = 'Personalized';
  }
  
  // Combine elements to create a title
  let title = `${styleDescriptor} ${activityFocus} ${durationType}`;
  
  // Add weather context if significant
  if (isMostlySunny) {
    title = `Sunny ${title}`;
  } else if (isMostlyRainy) {
    title = `Cozy ${title} (Rain-Friendly)`;
  }
  
  return title;
};

/**
 * Generate a title for an activity based on its type and time of day
 * 
 * @param {string} activityType - Type of activity
 * @param {string} timeOfDay - Time of day (morning, afternoon, evening)
 * @returns {string} Activity title
 */
const generateActivityTitle = (activityType, timeOfDay) => {
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
const generateActivityDescription = (activityType, weather, preferences) => {
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
const generateActivityLocation = (activityType) => {
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
const getSuitabilityLabel = (score) => {
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