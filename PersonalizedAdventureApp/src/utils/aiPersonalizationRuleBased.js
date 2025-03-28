/**
 * Rule-based Personalization Utility
 * 
 * This utility provides a fallback method for generating personalized itineraries
 * when the TensorFlow.js model is unavailable or fails.
 */

/**
 * Generates a personalized itinerary using rule-based methods
 * 
 * @param {Object} userData - User profile and preferences
 * @param {Object} feedbackData - Recent user feedback
 * @param {Object} weatherData - Weather forecast data
 * @param {Object} eventsData - Local events data
 * @returns {Promise<Object>} A promise that resolves to the generated itinerary
 */
export const generateRuleBasedItinerary = async (userData, feedbackData, weatherData, eventsData) => {
  try {
    console.log('Generating personalized itinerary with rule-based system...');
    
    // Extract user preferences
    const { 
      activityTypes = [], 
      budgetRange = { min: 0, max: 500 }, 
      travelStyle = 'balanced',
      accessibility = false,
      dietaryRestrictions = []
    } = userData.preferences;
    
    // Process recent feedback to adjust preferences
    const adjustedPreferences = processUserFeedback(userData.preferences, feedbackData);
    
    // Generate itinerary days based on weather forecast length
    const days = [];
    const numDays = weatherData.forecast.length;
    let totalCost = 0;
    
    for (let i = 0; i < numDays; i++) {
      const dayWeather = weatherData.forecast[i];
      const dayDate = dayWeather.date;
      
      // Get events happening on this day
      const dayEvents = eventsData.events.filter(event => 
        event.date === dayDate || new Date(event.date).toISOString().split('T')[0] === dayDate
      );
      
      // Generate activities for this day
      const activities = generateDayActivities(
        dayDate,
        dayWeather,
        dayEvents,
        adjustedPreferences,
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
      title: generateItineraryTitle(adjustedPreferences, weatherData, days.length),
      startDate: days[0].date,
      endDate: days[days.length - 1].date,
      days: days,
      totalCost: totalCost,
      preferences: adjustedPreferences,
      generatedAt: new Date().toISOString(),
      dynamicAdjustments: {
        weatherBased: true,
        feedbackBased: !!feedbackData && Object.keys(feedbackData.responses || {}).length > 0,
        eventsBased: eventsData.events.length > 0,
        mlBased: false // Rule-based, not ML-based
      }
    };
    
    console.log(`Generated rule-based itinerary with ${days.length} days and ${days.reduce((sum, day) => sum + day.activities.length, 0)} activities`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return itinerary;
  } catch (error) {
    console.error('Error generating rule-based itinerary:', error);
    throw new Error(`Failed to generate itinerary: ${error.message}`);
  }
};

/**
 * Process user feedback to adjust preferences
 * 
 * @param {Object} basePreferences - Base user preferences
 * @param {Object} feedbackData - Recent user feedback
 * @returns {Object} Adjusted preferences
 */
const processUserFeedback = (basePreferences, feedbackData) => {
  // Create a copy of base preferences
  const adjustedPreferences = { ...basePreferences };
  
  // If no feedback data, return base preferences
  if (!feedbackData || !feedbackData.responses) {
    return adjustedPreferences;
  }
  
  // Get all feedback responses
  const responses = feedbackData.responses;
  
  // Process each feedback response
  Object.values(responses).forEach(response => {
    const { context, response: userResponse } = response;
    
    // Skip if missing context or response
    if (!context || !userResponse) return;
    
    // Adjust preferences based on feedback context
    switch (context) {
      case 'mood':
        // Adjust travel style based on mood
        if (userResponse.toLowerCase().includes('adventurous') || 
            userResponse.toLowerCase().includes('excited') ||
            userResponse.toLowerCase().includes('energetic')) {
          adjustedPreferences.travelStyle = 'adventurous';
        } else if (userResponse.toLowerCase().includes('tired') || 
                  userResponse.toLowerCase().includes('relaxed') ||
                  userResponse.toLowerCase().includes('calm')) {
          adjustedPreferences.travelStyle = 'relaxed';
        }
        break;
        
      case 'budget':
        // Adjust budget based on feedback
        if (userResponse.toLowerCase().includes('important') ||
            userResponse.toLowerCase().includes('concerned') ||
            userResponse.toLowerCase().includes('limit')) {
          // Reduce max budget by 20%
          adjustedPreferences.budgetRange = {
            min: adjustedPreferences.budgetRange.min,
            max: adjustedPreferences.budgetRange.max * 0.8
          };
        } else if (userResponse.toLowerCase().includes('not important') ||
                  userResponse.toLowerCase().includes('flexible')) {
          // Increase max budget by 20%
          adjustedPreferences.budgetRange = {
            min: adjustedPreferences.budgetRange.min,
            max: adjustedPreferences.budgetRange.max * 1.2
          };
        }
        break;
        
      // Add other cases as needed
      
      default:
        // Unknown context, no adjustment
        break;
    }
  });
  
  return adjustedPreferences;
};

/**
 * Generate activities for a specific day
 * 
 * @param {string} date - The date for this day
 * @param {Object} weather - Weather forecast for this day
 * @param {Array} events - Events happening on this day
 * @param {Object} preferences - Adjusted user preferences
 * @param {boolean} isFirstDay - Whether this is the first day of the itinerary
 * @returns {Array} List of activities for the day
 */
const generateDayActivities = (date, weather, events, preferences, isFirstDay) => {
  const activities = [];
  const { condition, precipitation } = weather;
  const isRainy = condition.toLowerCase().includes('rain') || precipitation > 50;
  
  // Morning activity (8:00 AM - 12:00 PM)
  let morningActivity;
  
  if (isFirstDay) {
    // First day usually starts with orientation
    morningActivity = {
      id: generateUniqueId(),
      time: '09:00 AM',
      title: 'Orientation and City Overview',
      description: 'Get oriented with the area and plan your adventure.',
      location: 'City Center',
      cost: 0,
      weatherDependent: false,
      reservationRequired: false,
      reservationStatus: 'Not Required',
      suitableFor: 'Everyone'
    };
  } else if (isRainy) {
    // Rainy day morning - indoor activity
    morningActivity = {
      id: generateUniqueId(),
      time: '10:00 AM',
      title: 'Museum Visit',
      description: 'Explore the local museum and learn about the area\'s history and culture.',
      location: 'City Museum',
      cost: 15,
      weatherDependent: false,
      reservationRequired: false,
      reservationStatus: 'Not Required',
      suitableFor: 'Everyone'
    };
  } else {
    // Standard morning activity
    morningActivity = {
      id: generateUniqueId(),
      time: '09:00 AM',
      title: 'Morning Walk',
      description: 'Start your day with a refreshing walk through the city.',
      location: 'City Park',
      cost: 0,
      weatherDependent: true,
      reservationRequired: false,
      reservationStatus: 'Not Required',
      suitableFor: 'Everyone'
    };
  }
  
  activities.push(morningActivity);
  
  // Lunch activity (12:00 PM - 2:00 PM)
  const lunchActivity = {
    id: generateUniqueId(),
    time: '12:30 PM',
    title: 'Lunch',
    description: 'Enjoy lunch at a popular local restaurant.',
    location: 'Local Restaurant',
    cost: 25,
    weatherDependent: false,
    reservationRequired: true,
    reservationStatus: 'Confirmed',
    suitableFor: 'Everyone'
  };
  
  activities.push(lunchActivity);
  
  // Afternoon activity (2:00 PM - 6:00 PM)
  let afternoonActivity;
  
  // Check if there's a relevant event
  const afternoonEvent = events.find(event => 
    event.cost <= preferences.budgetRange.max
  );
  
  if (afternoonEvent) {
    // Use the event as the afternoon activity
    afternoonActivity = {
      id: generateUniqueId(),
      time: '03:00 PM',
      title: afternoonEvent.name,
      description: `Special local event: ${afternoonEvent.name}`,
      location: afternoonEvent.location,
      cost: afternoonEvent.cost,
      weatherDependent: false,
      reservationRequired: true,
      reservationStatus: 'Confirmed',
      suitableFor: 'Everyone'
    };
  } else if (isRainy) {
    // Rainy afternoon - indoor activity
    afternoonActivity = {
      id: generateUniqueId(),
      time: '02:30 PM',
      title: 'Art Gallery Tour',
      description: 'Explore local art at the city\'s premier gallery.',
      location: 'City Art Gallery',
      cost: 12,
      weatherDependent: false,
      reservationRequired: false,
      reservationStatus: 'Not Required',
      suitableFor: 'Art Enthusiasts'
    };
  } else {
    // Standard afternoon activity
    afternoonActivity = {
      id: generateUniqueId(),
      time: '02:30 PM',
      title: 'Sightseeing Tour',
      description: 'Explore the city\'s most famous landmarks.',
      location: 'City Center',
      cost: 30,
      weatherDependent: true,
      reservationRequired: true,
      reservationStatus: 'Confirmed',
      suitableFor: 'Everyone'
    };
  }
  
  activities.push(afternoonActivity);
  
  // Evening activity (6:00 PM onwards)
  const eveningActivity = {
    id: generateUniqueId(),
    time: '07:00 PM',
    title: 'Dinner Experience',
    description: 'Enjoy dinner at a highly-rated local restaurant.',
    location: 'Downtown Restaurant',
    cost: 40,
    weatherDependent: false,
    reservationRequired: true,
    reservationStatus: 'Pending',
    suitableFor: 'Everyone'
  };
  
  activities.push(eveningActivity);
  
  return activities;
};

/**
 * Generate a unique ID for itinerary items
 * 
 * @returns {string} A unique ID
 */
const generateUniqueId = () => {
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
const generateItineraryTitle = (preferences, weatherData, numDays) => {
  // Get the dominant weather condition
  const weatherConditions = weatherData.forecast.map(day => day.condition.toLowerCase());
  const isMostlySunny = weatherConditions.filter(condition => 
    condition.includes('sun') || condition.includes('clear')
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
  
  // Combine elements to create a title
  let title = `${styleDescriptor} ${durationType}`;
  
  // Add weather context if significant
  if (isMostlySunny) {
    title = `Sunny ${title}`;
  }
  
  return title;
};