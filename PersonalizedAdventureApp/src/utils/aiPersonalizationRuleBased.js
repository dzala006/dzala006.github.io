/**
 * Rule-based Itinerary Generation
 * 
 * This file contains the rule-based approach for generating itineraries,
 * which serves as a fallback when the TensorFlow.js model fails.
 */

import { generateUniqueId, generateItineraryTitle } from './aiPersonalizationHelpers';

/**
 * Generates a rule-based itinerary as a fallback when ML model fails
 * 
 * @param {Object} userData - User profile and preferences
 * @param {Object} feedbackData - Recent user feedback
 * @param {Object} weatherData - Weather forecast data
 * @param {Object} eventsData - Local events data
 * @returns {Promise<Object>} A promise that resolves to the generated itinerary
 */
export const generateRuleBasedItinerary = async (userData, feedbackData, weatherData, eventsData) => {
  try {
    console.log('Generating rule-based itinerary as fallback...');
    
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
        mlBased: false // This is a rule-based itinerary
      }
    };
    
    console.log(`Generated rule-based itinerary with ${days.length} days and ${days.reduce((sum, day) => sum + day.activities.length, 0)} activities`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return itinerary;
  } catch (error) {
    console.error('Error generating rule-based itinerary:', error);
    throw new Error(`Failed to generate rule-based itinerary: ${error.message}`);
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
        
      case 'activity':
        // Add new activity types based on feedback
        if (userResponse.toLowerCase().includes('outdoor') || 
            userResponse.toLowerCase().includes('nature')) {
          if (!adjustedPreferences.activityTypes.includes('hiking')) {
            adjustedPreferences.activityTypes.push('hiking');
          }
          if (!adjustedPreferences.activityTypes.includes('parks')) {
            adjustedPreferences.activityTypes.push('parks');
          }
        } else if (userResponse.toLowerCase().includes('indoor') || 
                  userResponse.toLowerCase().includes('museum')) {
          if (!adjustedPreferences.activityTypes.includes('museums')) {
            adjustedPreferences.activityTypes.push('museums');
          }
          if (!adjustedPreferences.activityTypes.includes('galleries')) {
            adjustedPreferences.activityTypes.push('galleries');
          }
        } else if (userResponse.toLowerCase().includes('food') || 
                  userResponse.toLowerCase().includes('dining')) {
          if (!adjustedPreferences.activityTypes.includes('food')) {
            adjustedPreferences.activityTypes.push('food');
          }
          if (!adjustedPreferences.activityTypes.includes('restaurants')) {
            adjustedPreferences.activityTypes.push('restaurants');
          }
        }
        break;
        
      case 'environment':
        // Adjust activity types based on indoor/outdoor preference
        if (userResponse.toLowerCase().includes('indoor')) {
          adjustedPreferences.activityTypes = adjustedPreferences.activityTypes.filter(
            type => !['hiking', 'parks', 'beaches'].includes(type)
          );
          if (!adjustedPreferences.activityTypes.includes('museums')) {
            adjustedPreferences.activityTypes.push('museums');
          }
          if (!adjustedPreferences.activityTypes.includes('shopping')) {
            adjustedPreferences.activityTypes.push('shopping');
          }
        } else if (userResponse.toLowerCase().includes('outdoor')) {
          adjustedPreferences.activityTypes = adjustedPreferences.activityTypes.filter(
            type => !['museums', 'galleries', 'shopping'].includes(type)
          );
          if (!adjustedPreferences.activityTypes.includes('hiking')) {
            adjustedPreferences.activityTypes.push('hiking');
          }
          if (!adjustedPreferences.activityTypes.includes('parks')) {
            adjustedPreferences.activityTypes.push('parks');
          }
        }
        break;
        
      case 'social':
        // Adjust activity types based on social preference
        if (userResponse.toLowerCase().includes('solo') || 
            userResponse.toLowerCase().includes('alone')) {
          if (!adjustedPreferences.activityTypes.includes('museums')) {
            adjustedPreferences.activityTypes.push('museums');
          }
          if (!adjustedPreferences.activityTypes.includes('relaxation')) {
            adjustedPreferences.activityTypes.push('relaxation');
          }
        } else if (userResponse.toLowerCase().includes('group') || 
                  userResponse.toLowerCase().includes('social')) {
          if (!adjustedPreferences.activityTypes.includes('tours')) {
            adjustedPreferences.activityTypes.push('tours');
          }
          if (!adjustedPreferences.activityTypes.includes('events')) {
            adjustedPreferences.activityTypes.push('events');
          }
        }
        break;
        
      case 'food':
        // Update dietary restrictions
        if (userResponse.toLowerCase().includes('vegetarian')) {
          if (!adjustedPreferences.dietaryRestrictions.includes('vegetarian')) {
            adjustedPreferences.dietaryRestrictions.push('vegetarian');
          }
        } else if (userResponse.toLowerCase().includes('vegan')) {
          if (!adjustedPreferences.dietaryRestrictions.includes('vegan')) {
            adjustedPreferences.dietaryRestrictions.push('vegan');
          }
        } else if (userResponse.toLowerCase().includes('gluten')) {
          if (!adjustedPreferences.dietaryRestrictions.includes('gluten-free')) {
            adjustedPreferences.dietaryRestrictions.push('gluten-free');
          }
        }
        break;
        
      case 'distance':
        // No direct mapping to preferences, but could be used in activity selection
        break;
        
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
    if (preferences.activityTypes.includes('museums')) {
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
      morningActivity = {
        id: generateUniqueId(),
        time: '10:00 AM',
        title: 'Indoor Shopping Experience',
        description: 'Visit the local mall or shopping center to browse shops and stay dry.',
        location: 'Downtown Mall',
        cost: 0,
        weatherDependent: false,
        reservationRequired: false,
        reservationStatus: 'Not Required',
        suitableFor: 'Everyone'
      };
    }
  } else if (preferences.travelStyle === 'adventurous') {
    // Adventurous morning - outdoor activity
    morningActivity = {
      id: generateUniqueId(),
      time: '08:00 AM',
      title: 'Morning Hike',
      description: 'Start your day with an invigorating hike on a scenic trail.',
      location: 'Local Nature Trail',
      cost: 0,
      weatherDependent: true,
      reservationRequired: false,
      reservationStatus: 'Not Required',
      suitableFor: 'Active Travelers'
    };
  } else {
    // Relaxed morning - cafe or light activity
    morningActivity = {
      id: generateUniqueId(),
      time: '10:00 AM',
      title: 'Breakfast at Local Cafe',
      description: 'Enjoy a leisurely breakfast at a charming local cafe.',
      location: 'Downtown Cafe',
      cost: 15,
      weatherDependent: false,
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
    description: preferences.dietaryRestrictions.length > 0 
      ? `Enjoy lunch at a restaurant with ${preferences.dietaryRestrictions.join(', ')} options.`
      : 'Enjoy lunch at a popular local restaurant.',
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
    event.cost <= preferences.budgetRange.max &&
    preferences.activityTypes.some(type => event.category.toLowerCase().includes(type.toLowerCase()))
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
      weatherDependent: false, // Assuming events are generally not weather dependent
      reservationRequired: true,
      reservationStatus: 'Confirmed',
      suitableFor: 'Everyone'
    };
  } else if (isRainy) {
    // Rainy afternoon - indoor activity
    if (preferences.activityTypes.includes('galleries')) {
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
      afternoonActivity = {
        id: generateUniqueId(),
        time: '03:00 PM',
        title: 'Local Craft Workshop',
        description: 'Participate in a hands-on workshop to learn a local craft.',
        location: 'Community Center',
        cost: 35,
        weatherDependent: false,
        reservationRequired: true,
        reservationStatus: 'Pending',
        suitableFor: 'Everyone'
      };
    }
  } else if (preferences.travelStyle === 'adventurous') {
    // Adventurous afternoon - exciting activity
    afternoonActivity = {
      id: generateUniqueId(),
      time: '02:00 PM',
      title: 'Kayaking Adventure',
      description: 'Paddle through scenic waterways and explore the area from a different perspective.',
      location: 'Local River',
      cost: 45,
      weatherDependent: true,
      reservationRequired: true,
      reservationStatus: 'Confirmed',
      suitableFor: 'Active Travelers'
    };
  } else {
    // Relaxed afternoon - sightseeing or relaxation
    afternoonActivity = {
      id: generateUniqueId(),
      time: '02:30 PM',
      title: 'Scenic City Tour',
      description: 'Take a relaxed tour of the city\'s most famous landmarks and scenic spots.',
      location: 'City Center',
      cost: 30,
      weatherDependent: false,
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
    description: preferences.dietaryRestrictions.length > 0 
      ? `Enjoy dinner at a restaurant with ${preferences.dietaryRestrictions.join(', ')} options.`
      : 'Enjoy dinner at a highly-rated local restaurant.',
    location: 'Downtown Restaurant',
    cost: 40,
    weatherDependent: false,
    reservationRequired: true,
    reservationStatus: 'Pending',
    suitableFor: 'Everyone'
  };
  
  activities.push(eveningActivity);
  
  // Optional late evening activity based on preferences
  if (preferences.travelStyle === 'adventurous') {
    const nightActivity = {
      id: generateUniqueId(),
      time: '09:30 PM',
      title: 'Night City Exploration',
      description: 'Experience the city\'s vibrant nightlife and see the landmarks illuminated.',
      location: 'City Center',
      cost: 0,
      weatherDependent: true,
      reservationRequired: false,
      reservationStatus: 'Not Required',
      suitableFor: 'Night Owls'
    };
    
    activities.push(nightActivity);
  }
  
  return activities;
};