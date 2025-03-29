/**
 * Enhanced Data Integration Utility
 * 
 * This utility provides advanced data integration capabilities for the Personalized Adventure App,
 * including multiple external API integrations, crowdsourced data, enhanced geolocation,
 * contextual filtering, machine learning for predictive recommendations, real-time updates,
 * interactive map UI support, and customizable user preferences.
 */

import * as tf from '@tensorflow/tfjs';
import * as Location from 'expo-location';
import { weatherAPI } from './weatherAPI';
import { initializeModel } from './tensorflowSetup';

// API Keys (in a real app, these would be stored securely)
const API_KEYS = {
  yelp: 'simulated-yelp-api-key',
  eventbrite: 'simulated-eventbrite-api-key',
  openTable: 'simulated-opentable-api-key',
  viator: 'simulated-viator-api-key'
};

// Base URLs for API endpoints
const API_ENDPOINTS = {
  yelp: 'https://api.yelp.com/v3',
  eventbrite: 'https://www.eventbriteapi.com/v3',
  openTable: 'https://api.opentable.com/v1',
  viator: 'https://api.viator.com/v1'
};

/**
 * 1. MULTIPLE EXTERNAL API INTEGRATION
 */

/**
 * Fetch data from Yelp API for local businesses and activities
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.location - Location to search near
 * @param {number} params.latitude - Latitude coordinate
 * @param {number} params.longitude - Longitude coordinate
 * @param {string} params.term - Search term (e.g., "coffee", "hiking")
 * @param {number} params.radius - Search radius in meters
 * @param {string} params.categories - Comma-separated list of categories
 * @param {string} params.price - Comma-separated list of price levels (1-4)
 * @param {string} params.sort_by - Sort method: "best_match", "rating", "review_count", "distance"
 * @returns {Promise<Array>} Array of businesses/activities
 */
export const fetchYelpData = async (params) => {
  try {
    console.log('Fetching data from Yelp API...', params);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate Yelp API response
    const businesses = [];
    const categories = ['food', 'arts', 'active', 'nightlife', 'shopping'];
    const names = [
      'Artisan Coffee House', 'Mountain Trail Adventures', 'The Local Bistro',
      'City Museum', 'Lakeside Park', 'Downtown Shopping Center',
      'Historic Theater', 'Sunset Yoga Studio', 'Craft Brewery Tour'
    ];
    
    // Generate 10-20 random businesses based on params
    const count = 10 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < count; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      const rating = (3 + Math.random() * 2).toFixed(1);
      const reviewCount = Math.floor(Math.random() * 500) + 10;
      const priceLevel = '$'.repeat(Math.floor(Math.random() * 3) + 1);
      
      // Calculate a position near the provided coordinates
      const latOffset = (Math.random() - 0.5) * 0.01;
      const lngOffset = (Math.random() - 0.5) * 0.01;
      
      businesses.push({
        id: `yelp-${i}-${Date.now()}`,
        name: `${name} ${i+1}`,
        rating: parseFloat(rating),
        review_count: reviewCount,
        price: priceLevel,
        categories: [{ alias: category, title: category.charAt(0).toUpperCase() + category.slice(1) }],
        coordinates: {
          latitude: params.latitude + latOffset,
          longitude: params.longitude + lngOffset
        },
        location: {
          address1: `${Math.floor(Math.random() * 999) + 1} Main St`,
          city: params.location || 'Sample City',
          state: 'CA',
          zip_code: '90210'
        },
        phone: `+1${Math.floor(Math.random() * 1000000000) + 1000000000}`,
        distance: Math.floor(Math.random() * params.radius),
        source: 'yelp'
      });
    }
    
    return businesses;
  } catch (error) {
    console.error('Error fetching Yelp data:', error);
    throw new Error(`Yelp API error: ${error.message}`);
  }
};

/**
 * Fetch data from Eventbrite API for local events
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.location - Location to search near
 * @param {number} params.latitude - Latitude coordinate
 * @param {number} params.longitude - Longitude coordinate
 * @param {string} params.q - Search query
 * @param {string} params.categories - Comma-separated list of category IDs
 * @param {string} params.start_date - Start date (ISO format)
 * @param {string} params.end_date - End date (ISO format)
 * @returns {Promise<Array>} Array of events
 */
export const fetchEventbriteData = async (params) => {
  try {
    console.log('Fetching data from Eventbrite API...', params);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Simulate Eventbrite API response
    const events = [];
    const eventTypes = ['Concert', 'Festival', 'Workshop', 'Conference', 'Exhibition', 'Meetup'];
    const venues = ['City Hall', 'Convention Center', 'Community Park', 'Art Gallery', 'Local Theater'];
    
    // Generate 5-15 random events based on params
    const count = 5 + Math.floor(Math.random() * 10);
    
    // Parse dates or use current date range
    const now = new Date();
    const startDate = params.start_date ? new Date(params.start_date) : now;
    const endDate = params.end_date ? new Date(params.end_date) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < count; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const venue = venues[Math.floor(Math.random() * venues.length)];
      
      // Random date between start and end
      const eventDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      
      // Calculate a position near the provided coordinates
      const latOffset = (Math.random() - 0.5) * 0.01;
      const lngOffset = (Math.random() - 0.5) * 0.01;
      
      events.push({
        id: `eventbrite-${i}-${Date.now()}`,
        name: { text: `${eventType} - ${Math.floor(Math.random() * 100) + 1}` },
        description: { text: `Join us for this amazing ${eventType.toLowerCase()} event!` },
        start: {
          utc: eventDate.toISOString(),
          timezone: 'America/Los_Angeles'
        },
        end: {
          utc: new Date(eventDate.getTime() + 3 * 60 * 60 * 1000).toISOString(),
          timezone: 'America/Los_Angeles'
        },
        venue: {
          name: `${venue} ${i+1}`,
          address: {
            address_1: `${Math.floor(Math.random() * 999) + 1} Event St`,
            city: params.location || 'Sample City',
            region: 'CA',
            postal_code: '90210'
          },
          latitude: params.latitude + latOffset,
          longitude: params.longitude + lngOffset
        },
        capacity: Math.floor(Math.random() * 500) + 50,
        ticket_availability: {
          has_available_tickets: Math.random() > 0.2,
          minimum_ticket_price: {
            value: Math.floor(Math.random() * 50) + 10,
            currency: 'USD'
          },
          maximum_ticket_price: {
            value: Math.floor(Math.random() * 100) + 50,
            currency: 'USD'
          }
        },
        source: 'eventbrite'
      });
    }
    
    return events;
  } catch (error) {
    console.error('Error fetching Eventbrite data:', error);
    throw new Error(`Eventbrite API error: ${error.message}`);
  }
};

/**
 * Fetch data from OpenTable API for restaurant reservations
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.location - Location to search near
 * @param {number} params.latitude - Latitude coordinate
 * @param {number} params.longitude - Longitude coordinate
 * @param {string} params.date - Date for reservation (YYYY-MM-DD)
 * @param {string} params.time - Time for reservation (HH:MM)
 * @param {number} params.party_size - Number of people
 * @returns {Promise<Array>} Array of available restaurants
 */
export const fetchOpenTableData = async (params) => {
  try {
    console.log('Fetching data from OpenTable API...', params);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 550));
    
    // Simulate OpenTable API response
    const restaurants = [];
    const cuisines = ['American', 'Italian', 'Japanese', 'Mexican', 'Indian', 'French', 'Thai'];
    const names = [
      'The Capital Grille', 'Olive Garden', 'Nobu', 'Carrabba\'s', 
      'Seasons 52', 'The Cheesecake Factory', 'P.F. Chang\'s'
    ];
    
    // Generate 5-15 random restaurants based on params
    const count = 5 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < count; i++) {
      const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      const rating = (3 + Math.random() * 2).toFixed(1);
      const reviewCount = Math.floor(Math.random() * 1000) + 50;
      const priceLevel = '$'.repeat(Math.floor(Math.random() * 3) + 1);
      
      // Calculate a position near the provided coordinates
      const latOffset = (Math.random() - 0.5) * 0.01;
      const lngOffset = (Math.random() - 0.5) * 0.01;
      
      // Generate available time slots around the requested time
      const timeSlots = [];
      if (params.time) {
        const [hours, minutes] = params.time.split(':').map(Number);
        const baseTime = new Date();
        baseTime.setHours(hours, minutes, 0, 0);
        
        // Add time slots 30 minutes before and after requested time
        for (let offset = -60; offset <= 60; offset += 30) {
          if (Math.random() > 0.3) { // 70% chance of availability for each slot
            const slotTime = new Date(baseTime.getTime() + offset * 60000);
            timeSlots.push(slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      }
      
      restaurants.push({
        id: `opentable-${i}-${Date.now()}`,
        name: `${name} ${i+1}`,
        address: `${Math.floor(Math.random() * 999) + 1} Restaurant Row`,
        city: params.location || 'Sample City',
        state: 'CA',
        postal_code: '90210',
        phone: `+1${Math.floor(Math.random() * 1000000000) + 1000000000}`,
        latitude: params.latitude + latOffset,
        longitude: params.longitude + lngOffset,
        cuisine: cuisine,
        price: priceLevel,
        rating: parseFloat(rating),
        reviews: reviewCount,
        available_times: timeSlots,
        has_availability: timeSlots.length > 0,
        source: 'opentable'
      });
    }
    
    return restaurants;
  } catch (error) {
    console.error('Error fetching OpenTable data:', error);
    throw new Error(`OpenTable API error: ${error.message}`);
  }
};

/**
 * Fetch data from Viator API for tours and activities
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.location - Location to search near
 * @param {number} params.latitude - Latitude coordinate
 * @param {number} params.longitude - Longitude coordinate
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {number} params.count - Number of results to return
 * @returns {Promise<Array>} Array of available tours and activities
 */
export const fetchViatorData = async (params) => {
  try {
    console.log('Fetching data from Viator API...', params);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Simulate Viator API response
    const activities = [];
    const activityTypes = ['Tour', 'Adventure', 'Class', 'Excursion', 'Experience'];
    const themes = ['Cultural', 'Outdoor', 'Food & Drink', 'Historical', 'Wildlife', 'Adrenaline'];
    
    // Generate activities based on params
    const count = params.count || 5 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < count; i++) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const theme = themes[Math.floor(Math.random() * themes.length)];
      const duration = [2, 3, 4, 6, 8][Math.floor(Math.random() * 5)];
      const price = Math.floor(Math.random() * 150) + 50;
      const rating = (3.5 + Math.random() * 1.5).toFixed(1);
      const reviewCount = Math.floor(Math.random() * 500) + 20;
      
      // Calculate a position near the provided coordinates
      const latOffset = (Math.random() - 0.5) * 0.02;
      const lngOffset = (Math.random() - 0.5) * 0.02;
      
      activities.push({
        id: `viator-${i}-${Date.now()}`,
        title: `${theme} ${activityType} #${i+1}`,
        description: `Experience this amazing ${theme.toLowerCase()} ${activityType.toLowerCase()} in ${params.location || 'Sample City'}!`,
        duration: `${duration} hours`,
        price: {
          amount: price,
          currency: 'USD',
          formatted: `$${price}.00`
        },
        rating: parseFloat(rating),
        reviewCount: reviewCount,
        location: {
          name: params.location || 'Sample City',
          latitude: params.latitude + latOffset,
          longitude: params.longitude + lngOffset
        },
        images: [
          `https://example.com/tour-image-${i}-1.jpg`,
          `https://example.com/tour-image-${i}-2.jpg`
        ],
        available: Math.random() > 0.2, // 80% chance of availability
        bookingAvailable: Math.random() > 0.3, // 70% chance of booking availability
        source: 'viator'
      });
    }
    
    return activities;
  } catch (error) {
    console.error('Error fetching Viator data:', error);
    throw new Error(`Viator API error: ${error.message}`);
  }
};

/**
 * 2. CROWDSOURCED DATA
 */

/**
 * Fetch crowdsourced data about trending activities and locations
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.location - Location to search near
 * @param {number} params.latitude - Latitude coordinate
 * @param {number} params.longitude - Longitude coordinate
 * @param {number} params.radius - Search radius in meters
 * @returns {Promise<Object>} Object containing trending data
 */
export const fetchCrowdsourcedData = async (params) => {
  try {
    console.log('Fetching crowdsourced data...', params);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate crowdsourced data
    const trendingPlaces = [];
    const placeTypes = ['Restaurant', 'Bar', 'Park', 'Museum', 'Shop', 'Beach', 'Trail'];
    const trendingKeywords = ['hidden gem', 'local favorite', 'instagram-worthy', 'family-friendly', 'romantic'];
    
    // Generate 5-10 trending places
    const placeCount = 5 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < placeCount; i++) {
      const placeType = placeTypes[Math.floor(Math.random() * placeTypes.length)];
      const keyword = trendingKeywords[Math.floor(Math.random() * trendingKeywords.length)];
      const checkIns = Math.floor(Math.random() * 500) + 50;
      const photos = Math.floor(Math.random() * 200) + 20;
      
      // Calculate a position near the provided coordinates
      const latOffset = (Math.random() - 0.5) * 0.01;
      const lngOffset = (Math.random() - 0.5) * 0.01;
      
      trendingPlaces.push({
        id: `trend-${i}-${Date.now()}`,
        name: `Trending ${placeType} ${i+1}`,
        type: placeType,
        keyword: keyword,
        checkIns: checkIns,
        photos: photos,
        rating: (4 + Math.random()).toFixed(1),
        coordinates: {
          latitude: params.latitude + latOffset,
          longitude: params.longitude + lngOffset
        },
        trending_score: Math.floor(Math.random() * 100) + 50,
        trending_reason: `Popular ${keyword} spot with ${checkIns} recent check-ins`,
        source: 'crowdsourced'
      });
    }
    
    // Generate trending activities
    const trendingActivities = [];
    const activityTypes = ['Hiking', 'Dining', 'Shopping', 'Sightseeing', 'Entertainment'];
    
    // Generate 3-8 trending activities
    const activityCount = 3 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < activityCount; i++) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const mentions = Math.floor(Math.random() * 300) + 30;
      
      trendingActivities.push({
        id: `activity-${i}-${Date.now()}`,
        name: `${activityType} in ${params.location || 'Sample City'}`,
        type: activityType,
        mentions: mentions,
        trending_score: Math.floor(Math.random() * 100) + 50,
        trending_reason: `${mentions} people talking about this`,
        source: 'crowdsourced'
      });
    }
    
    // Generate user reviews
    const userReviews = [];
    const reviewCount = 10 + Math.floor(Math.random() * 15);
    
    for (let i = 0; i < reviewCount; i++) {
      const placeType = placeTypes[Math.floor(Math.random() * placeTypes.length)];
      const rating = Math.floor(Math.random() * 5) + 1;
      const helpfulCount = Math.floor(Math.random() * 50);
      
      userReviews.push({
        id: `review-${i}-${Date.now()}`,
        place_name: `${placeType} Place ${i+1}`,
        user_name: `User${Math.floor(Math.random() * 1000)}`,
        rating: rating,
        review_text: `This is a ${rating >= 4 ? 'great' : 'decent'} place to visit. ${
          rating >= 4 ? 'Highly recommended!' : 'Could be better.'
        }`,
        date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        helpful_count: helpfulCount,
        source: 'crowdsourced'
      });
    }
    
    return {
      trending_places: trendingPlaces,
      trending_activities: trendingActivities,
      user_reviews: userReviews
    };
  } catch (error) {
    console.error('Error fetching crowdsourced data:', error);
    throw new Error(`Crowdsourced data error: ${error.message}`);
  }
};

/**
 * 3. ENHANCED GEOLOCATION
 */

/**
 * Get high-accuracy user location using expo-location
 * 
 * @returns {Promise<Object>} Object containing user's coordinates
 */
export const getUserLocation = async () => {
  try {
    console.log('Getting user location...');
    
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }
    
    // Get current position with high accuracy
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      maximumAge: 10000, // Accept positions that are up to 10 seconds old
      timeout: 15000 // Wait up to 15 seconds for a position
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      timestamp: location.timestamp
    };
  } catch (error) {
    console.error('Error getting user location:', error);
    
    // Return a default location (simulated for testing)
    return {
      latitude: 37.7749, // San Francisco coordinates as fallback
      longitude: -122.4194,
      accuracy: 100,
      altitude: 0,
      timestamp: Date.now(),
      simulated: true
    };
  }
};

/**
 * Fetch nearby activities based on user coordinates
 * 
 * @param {Object} params - Search parameters
 * @param {number} params.latitude - Latitude coordinate
 * @param {number} params.longitude - Longitude coordinate
 * @param {number} params.radius - Search radius in meters (default: 1000)
 * @param {string} params.types - Comma-separated list of place types
 * @returns {Promise<Array>} Array of nearby activities
 */
export const fetchNearbyActivities = async (params) => {
  try {
    console.log('Fetching nearby activities...', params);
    
    // Default radius if not provided
    const radius = params.radius || 1000;
    
    // Fetch data from multiple sources in parallel
    const [yelpData, eventbriteData, viatorData] = await Promise.all([
      fetchYelpData({
        latitude: params.latitude,
        longitude: params.longitude,
        radius: radius,
        categories: params.types
      }),
      fetchEventbriteData({
        latitude: params.latitude,
        longitude: params.longitude,
        location: 'Current Location'
      }),
      fetchViatorData({
        latitude: params.latitude,
        longitude: params.longitude,
        location: 'Current Location'
      })
    ]);
    
    // Combine and sort results by distance
    const allActivities = [
      ...yelpData,
      ...eventbriteData.map(event => ({
        id: event.id,
        name: event.name.text,
        type: 'event',
        coordinates: {
          latitude: event.venue.latitude,
          longitude: event.venue.longitude
        },
        distance: calculateDistance(
          params.latitude,
          params.longitude,
          event.venue.latitude,
          event.venue.longitude
        ),
        source: 'eventbrite'
      })),
      ...viatorData.map(activity => ({
        id: activity.id,
        name: activity.title,
        type: 'tour',
        coordinates: {
          latitude: activity.location.latitude,
          longitude: activity.location.longitude
        },
        distance: calculateDistance(
          params.latitude,
          params.longitude,
          activity.location.latitude,
          activity.location.longitude
        ),
        source: 'viator'
      }))
    ];
    
    // Sort by distance
    return allActivities.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error fetching nearby activities:', error);
    throw new Error(`Nearby activities error: ${error.message}`);
  }
};

/**
 * Calculate distance between two coordinates using the Haversine formula
 * 
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
};

/**
 * 4. CONTEXTUAL FILTERING
 */

/**
 * Apply contextual filters to activity data based on time, weather, and distance
 * 
 * @param {Array} activities - Array of activities to filter
 * @param {Object} context - Contextual information
 * @param {Object} context.time - Current time information
 * @param {Object} context.weather - Weather information
 * @param {Object} context.location - User location
 * @param {Object} context.preferences - User preferences
 * @returns {Array} Filtered and sorted activities
 */
export const applyContextualFilters = async (activities, context) => {
  try {
    console.log('Applying contextual filters...');
    
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return [];
    }
    
    // Extract context information
    const { time, weather, location, preferences } = context;
    const currentHour = time?.hour || new Date().getHours();
    const isEvening = currentHour >= 18 || currentHour < 6;
    const isWeekend = time?.isWeekend || [0, 6].includes(new Date().getDay());
    
    // Apply time-based filters
    let filteredActivities = activities.filter(activity => {
      // Skip activities that are closed at the current time
      if (activity.hours && activity.hours.is_open_now === false) {
        return false;
      }
      
      // Filter nightlife activities for evening hours
      if (activity.categories && activity.categories.some(c => c.alias === 'nightlife')) {
        return isEvening;
      }
      
      return true;
    });
    
    // Apply weather-based filters
    if (weather) {
      const isRainy = weather.condition?.toLowerCase().includes('rain') || false;
      const isCold = (weather.temperature && weather.temperature < 50) || false;
      const isHot = (weather.temperature && weather.temperature > 85) || false;
      
      filteredActivities = filteredActivities.filter(activity => {
        // For rainy weather, prefer indoor activities
        if (isRainy && activity.is_outdoor) {
          return false;
        }
        
        // For very hot weather, avoid strenuous outdoor activities
        if (isHot && activity.is_strenuous && activity.is_outdoor) {
          return false;
        }
        
        // For cold weather, prefer indoor or warm activities
        if (isCold && activity.is_outdoor && !activity.is_heated) {
          return false;
        }
        
        return true;
      });
    }
    
    // Apply distance-based filters
    if (location) {
      // Calculate distance for each activity if not already present
      filteredActivities = filteredActivities.map(activity => {
        if (!activity.distance && activity.coordinates) {
          activity.distance = calculateDistance(
            location.latitude,
            location.longitude,
            activity.coordinates.latitude,
            activity.coordinates.longitude
          );
        }
        return activity;
      });
      
      // Filter by maximum distance if specified in preferences
      if (preferences && preferences.maxDistance) {
        filteredActivities = filteredActivities.filter(activity => 
          !activity.distance || activity.distance <= preferences.maxDistance
        );
      }
    }
    
    // Apply preference-based scoring
    if (preferences) {
      filteredActivities = filteredActivities.map(activity => {
        let score = 50; // Base score
        
        // Increase score for preferred categories
        if (preferences.activityTypes && activity.categories) {
          const categoryMatch = activity.categories.some(c => 
            preferences.activityTypes.includes(c.alias || c.title.toLowerCase())
          );
          if (categoryMatch) score += 20;
        }
        
        // Adjust score based on price level and budget preference
        if (preferences.budget && activity.price) {
          const priceLevel = activity.price.length || 
                            (typeof activity.price === 'number' ? activity.price : 2);
          
          if (preferences.budget === 'low' && priceLevel <= 1) score += 15;
          else if (preferences.budget === 'medium' && priceLevel === 2) score += 15;
          else if (preferences.budget === 'high' && priceLevel >= 3) score += 15;
          else score -= 10; // Penalize if price doesn't match budget
        }
        
        // Adjust score based on distance
        if (activity.distance) {
          if (activity.distance < 500) score += 15; // Very close
          else if (activity.distance < 1000) score += 10; // Walking distance
          else if (activity.distance < 5000) score += 5; // Short drive
          else score -= Math.min(15, Math.floor(activity.distance / 1000)); // Penalize for distance
        }
        
        // Adjust score based on rating
        if (activity.rating) {
          score += (activity.rating - 3) * 10; // Boost for high ratings
        }
        
        activity.contextual_score = Math.max(0, Math.min(100, score));
        return activity;
      });
      
      // Sort by contextual score (descending)
      filteredActivities.sort((a, b) => b.contextual_score - a.contextual_score);
    }
    
    return filteredActivities;
  } catch (error) {
    console.error('Error applying contextual filters:', error);
    return activities; // Return original activities if filtering fails
  }
};

/**
 * 5. MACHINE LEARNING FOR PREDICTIVE RECOMMENDATIONS
 */

/**
 * Use TensorFlow.js to predict trending events and high-demand reservations
 * 
 * @param {Array} activities - Array of activities to analyze
 * @param {Object} userData - User data and historical preferences
 * @param {Object} timeContext - Time context (day of week, time of day, etc.)
 * @returns {Promise<Object>} Prediction results
 */
export const predictTrendingActivities = async (activities, userData, timeContext) => {
  try {
    console.log('Predicting trending activities with TensorFlow.js...');
    
    // Load or create the model
    const model = await loadTrendingPredictionModel();
    
    // Prepare dummy historical data (in a real app, this would come from a database)
    const historicalData = generateDummyHistoricalData();
    
    // Prepare input features for each activity
    const predictions = [];
    
    for (const activity of activities) {
      // Extract features for this activity
      const features = extractActivityFeatures(activity, userData, timeContext, historicalData);
      
      // Convert features to tensor
      const inputTensor = tf.tensor2d([features]);
      
      // Run prediction
      const predictionTensor = model.predict(inputTensor);
      const predictionArray = await predictionTensor.array();
      const predictionScore = predictionArray[0][0]; // Get the first (and only) value
      
      // Clean up tensors to prevent memory leaks
      inputTensor.dispose();
      predictionTensor.dispose();
      
      // Add prediction to results
      predictions.push({
        id: activity.id,
        name: activity.name || activity.title,
        trending_score: predictionScore * 100, // Convert to percentage
        trending_confidence: calculateConfidence(features),
        is_trending: predictionScore > 0.7, // Consider trending if score > 70%
        reservation_demand: predictionScore > 0.8 ? 'high' : predictionScore > 0.5 ? 'medium' : 'low',
        features: features // Include features for debugging
      });
    }
    
    // Sort by trending score (descending)
    predictions.sort((a, b) => b.trending_score - a.trending_score);
    
    return {
      trending_activities: predictions.filter(p => p.is_trending),
      all_predictions: predictions
    };
  } catch (error) {
    console.error('Error predicting trending activities:', error);
    
    // Return a fallback prediction based on simple heuristics
    return fallbackTrendingPrediction(activities, userData, timeContext);
  }
};

/**
 * Load or create a TensorFlow.js model for trending prediction
 * 
 * @returns {Promise<tf.LayersModel>} TensorFlow.js model
 */
const loadTrendingPredictionModel = async () => {
  try {
    // In a real app, you would load a pre-trained model
    // For this example, we'll create a simple model
    
    const model = tf.sequential();
    
    // Input shape: [activity features (10), user features (5), time context (3), historical data (5)]
    model.add(tf.layers.dense({
      inputShape: [23],
      units: 16,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid' // Output between 0 and 1 (trending score)
    }));
    
    // Compile the model
    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  } catch (error) {
    console.error('Error loading trending prediction model:', error);
    throw error;
  }
};

/**
 * Extract features from an activity for the prediction model
 * 
 * @param {Object} activity - Activity to extract features from
 * @param {Object} userData - User data and preferences
 * @param {Object} timeContext - Time context
 * @param {Object} historicalData - Historical data for this activity
 * @returns {Array} Array of numerical features
 */
const extractActivityFeatures = (activity, userData, timeContext, historicalData) => {
  // Activity features
  const rating = activity.rating || 3.5;
  const reviewCount = activity.review_count || activity.reviewCount || 0;
  const price = typeof activity.price === 'string' ? activity.price.length : 
               (activity.price?.amount ? Math.min(5, Math.ceil(activity.price.amount / 50)) : 2);
  const isWeekendFriendly = activity.categories?.some(c => 
    ['nightlife', 'arts', 'entertainment'].includes(c.alias || c.title?.toLowerCase())
  ) || false;
  const isPopular = reviewCount > 100;
  const hasAvailability = activity.has_availability || activity.available || true;
  
  // User features
  const userPreferenceMatch = userData.preferences?.activityTypes?.some(type => 
    activity.categories?.some(c => c.alias === type || c.title?.toLowerCase() === type)
  ) || false;
  const userBudgetMatch = userData.preferences?.budget === 'low' && price <= 1 ||
                         userData.preferences?.budget === 'medium' && price === 2 ||
                         userData.preferences?.budget === 'high' && price >= 3;
  const userPreviouslyViewed = userData.viewedActivities?.includes(activity.id) || false;
  
  // Time context
  const isWeekend = timeContext.isWeekend || false;
  const isEvening = timeContext.isEvening || false;
  
  // Historical data
  const historicalPopularity = historicalData[activity.id]?.popularity || 0.5;
  const historicalBookingRate = historicalData[activity.id]?.bookingRate || 0.5;
  
  // Combine all features into a single array
  return [
    // Activity features (normalized)
    rating / 5,
    Math.min(1, reviewCount / 1000),
    price / 5,
    isWeekendFriendly ? 1 : 0,
    isPopular ? 1 : 0,
    hasAvailability ? 1 : 0,
    
    // User features
    userPreferenceMatch ? 1 : 0,
    userBudgetMatch ? 1 : 0,
    userPreviouslyViewed ? 1 : 0,
    
    // Time context
    isWeekend ? 1 : 0,
    isEvening ? 1 : 0,
    
    // Historical data
    historicalPopularity,
    historicalBookingRate
  ];
};

/**
 * Generate dummy historical data for activities
 * 
 * @returns {Object} Object with activity IDs as keys and historical data as values
 */
const generateDummyHistoricalData = () => {
  const data = {};
  
  // Generate random data for 100 activities
  for (let i = 0; i < 100; i++) {
    const id = `activity-${i}`;
    data[id] = {
      popularity: Math.random(),
      bookingRate: Math.random(),
      viewCount: Math.floor(Math.random() * 1000),
      averageRating: 3 + Math.random() * 2
    };
  }
  
  return data;
};

/**
 * Calculate confidence score for prediction
 * 
 * @param {Array} features - Feature array
 * @returns {number} Confidence score between 0 and 1
 */
const calculateConfidence = (features) => {
  // In a real app, this would be based on model uncertainty
  // For this example, we'll use a simple heuristic
  const reviewCountFeature = features[1]; // Normalized review count
  const hasAvailabilityFeature = features[5];
  
  // More reviews and confirmed availability increase confidence
  return 0.5 + (reviewCountFeature * 0.3) + (hasAvailabilityFeature * 0.2);
};

/**
 * Fallback method for trending prediction when ML fails
 * 
 * @param {Array} activities - Activities to analyze
 * @param {Object} userData - User data
 * @param {Object} timeContext - Time context
 * @returns {Object} Prediction results
 */
const fallbackTrendingPrediction = (activities, userData, timeContext) => {
  console.log('Using fallback trending prediction...');
  
  const predictions = activities.map(activity => {
    // Simple heuristic: higher ratings and more reviews = more trending
    const rating = activity.rating || 3.5;
    const reviewCount = activity.review_count || activity.reviewCount || 0;
    const normalizedReviewCount = Math.min(1, reviewCount / 1000);
    
    // Calculate a simple trending score
    const trendingScore = (rating / 5 * 0.6) + (normalizedReviewCount * 0.4);
    
    return {
      id: activity.id,
      name: activity.name || activity.title,
      trending_score: trendingScore * 100,
      trending_confidence: 0.5, // Medium confidence for fallback
      is_trending: trendingScore > 0.7,
      reservation_demand: trendingScore > 0.8 ? 'high' : trendingScore > 0.5 ? 'medium' : 'low'
    };
  });
  
  // Sort by trending score (descending)
  predictions.sort((a, b) => b.trending_score - a.trending_score);
  
  return {
    trending_activities: predictions.filter(p => p.is_trending),
    all_predictions: predictions
  };
};

/**
 * 6. REAL-TIME UPDATES
 */

/**
 * Set up a polling mechanism to refresh activity/reservation data at regular intervals
 * 
 * @param {Function} fetchCallback - Function to call to fetch updated data
 * @param {Object} params - Parameters to pass to the fetch callback
 * @param {Function} onUpdate - Callback to handle updated data
 * @param {number} interval - Polling interval in milliseconds (default: 60000 = 1 minute)
 * @returns {Object} Object with start and stop methods to control polling
 */
export const setupRealTimeUpdates = (fetchCallback, params, onUpdate, interval = 60000) => {
  let timerId = null;
  let isPolling = false;
  let lastUpdateTime = null;
  
  // Function to fetch data and call the update callback
  const fetchData = async () => {
    if (!isPolling) return;
    
    try {
      console.log('Fetching real-time updates...');
      const data = await fetchCallback(params);
      lastUpdateTime = new Date();
      onUpdate(data, lastUpdateTime);
    } catch (error) {
      console.error('Error fetching real-time updates:', error);
    }
  };
  
  // Start polling
  const start = () => {
    if (isPolling) return;
    
    isPolling = true;
    console.log(`Starting real-time updates with interval: ${interval}ms`);
    
    // Fetch immediately
    fetchData();
    
    // Set up interval
    timerId = setInterval(fetchData, interval);
    
    return {
      lastUpdateTime,
      isPolling,
      interval
    };
  };
  
  // Stop polling
  const stop = () => {
    if (!isPolling) return;
    
    isPolling = false;
    console.log('Stopping real-time updates');
    
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    
    return {
      lastUpdateTime,
      isPolling,
      interval
    };
  };
  
  // Change polling interval
  const setInterval = (newInterval) => {
    if (newInterval === interval) return;
    
    interval = newInterval;
    console.log(`Changing real-time update interval to: ${interval}ms`);
    
    if (isPolling && timerId) {
      clearInterval(timerId);
      timerId = setInterval(fetchData, interval);
    }
    
    return {
      lastUpdateTime,
      isPolling,
      interval
    };
  };
  
  return {
    start,
    stop,
    setInterval,
    getStatus: () => ({
      lastUpdateTime,
      isPolling,
      interval
    })
  };
};

/**
 * Simulate a WebSocket connection for real-time updates
 * 
 * @param {string} endpoint - WebSocket endpoint
 * @param {Function} onMessage - Callback for incoming messages
 * @param {Function} onError - Callback for errors
 * @returns {Object} WebSocket-like interface
 */
export const simulateWebSocket = (endpoint, onMessage, onError) => {
  let isConnected = false;
  let reconnectTimer = null;
  let messageTimer = null;
  
  // Simulated event types
  const eventTypes = [
    'reservation_update',
    'availability_change',
    'weather_alert',
    'trending_activity',
    'price_change'
  ];
  
  // Connect to the simulated WebSocket
  const connect = () => {
    console.log(`Connecting to simulated WebSocket: ${endpoint}`);
    
    // Simulate connection delay
    setTimeout(() => {
      isConnected = true;
      console.log('WebSocket connected');
      
      // Start sending simulated messages
      startMessageSimulation();
      
      // Send a connection message
      onMessage({
        type: 'connection_status',
        status: 'connected',
        timestamp: new Date().toISOString()
      });
    }, 500);
  };
  
  // Disconnect from the simulated WebSocket
  const disconnect = () => {
    console.log('Disconnecting from simulated WebSocket');
    
    isConnected = false;
    
    // Clear timers
    if (messageTimer) {
      clearInterval(messageTimer);
      messageTimer = null;
    }
    
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    // Send a disconnection message
    onMessage({
      type: 'connection_status',
      status: 'disconnected',
      timestamp: new Date().toISOString()
    });
  };
  
  // Start sending simulated messages
  const startMessageSimulation = () => {
    if (!isConnected || messageTimer) return;
    
    // Send a message every 5-15 seconds
    messageTimer = setInterval(() => {
      if (!isConnected) return;
      
      // Randomly select an event type
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      // Create a simulated message
      const message = createSimulatedMessage(eventType);
      
      // Send the message
      onMessage(message);
    }, 5000 + Math.random() * 10000);
  };
  
  // Create a simulated message
  const createSimulatedMessage = (type) => {
    const baseMessage = {
      type,
      timestamp: new Date().toISOString(),
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    
    switch (type) {
      case 'reservation_update':
        return {
          ...baseMessage,
          reservation_id: `res-${Math.floor(Math.random() * 10000)}`,
          status: ['confirmed', 'pending', 'cancelled'][Math.floor(Math.random() * 3)],
          activity_name: `Activity ${Math.floor(Math.random() * 100)}`,
          time: new Date(Date.now() + Math.random() * 86400000 * 7).toISOString()
        };
        
      case 'availability_change':
        return {
          ...baseMessage,
          activity_id: `act-${Math.floor(Math.random() * 10000)}`,
          activity_name: `Activity ${Math.floor(Math.random() * 100)}`,
          available: Math.random() > 0.3,
          remaining_slots: Math.floor(Math.random() * 20)
        };
        
      case 'weather_alert':
        return {
          ...baseMessage,
          condition: ['rain', 'snow', 'storm', 'heat_wave', 'cold_snap'][Math.floor(Math.random() * 5)],
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          location: 'Current Location',
          start_time: new Date(Date.now() + Math.random() * 86400000).toISOString(),
          end_time: new Date(Date.now() + Math.random() * 86400000 * 2).toISOString()
        };
        
      case 'trending_activity':
        return {
          ...baseMessage,
          activity_id: `act-${Math.floor(Math.random() * 10000)}`,
          activity_name: `Trending Activity ${Math.floor(Math.random() * 100)}`,
          trending_score: Math.floor(Math.random() * 100),
          category: ['food', 'arts', 'active', 'nightlife', 'shopping'][Math.floor(Math.random() * 5)]
        };
        
      case 'price_change':
        return {
          ...baseMessage,
          activity_id: `act-${Math.floor(Math.random() * 10000)}`,
          activity_name: `Activity ${Math.floor(Math.random() * 100)}`,
          old_price: Math.floor(Math.random() * 100) + 50,
          new_price: Math.floor(Math.random() * 100) + 30,
          currency: 'USD'
        };
        
      default:
        return baseMessage;
    }
  };
  
  // Simulate a connection error
  const simulateError = () => {
    if (!isConnected) return;
    
    console.log('Simulating WebSocket error');
    
    // Call the error callback
    onError(new Error('Simulated WebSocket error'));
    
    // Disconnect
    disconnect();
    
    // Attempt to reconnect after a delay
    reconnectTimer = setTimeout(connect, 3000);
  };
  
  // Send a message (in a real WebSocket, this would send to the server)
  const send = (message) => {
    if (!isConnected) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }
    
    console.log('Sending message to simulated WebSocket:', message);
    
    // Simulate a response after a delay
    setTimeout(() => {
      onMessage({
        type: 'message_ack',
        original_message_id: message.id || 'unknown',
        status: 'received',
        timestamp: new Date().toISOString()
      });
    }, 300);
    
    return true;
  };
  
  // Return a WebSocket-like interface
  return {
    connect,
    disconnect,
    send,
    simulateError,
    isConnected: () => isConnected
  };
};

/**
 * 7. INTERACTIVE MAP UI SUPPORT
 */

/**
 * Format data for display on an interactive map
 * 
 * @param {Array} activities - Array of activities to display on the map
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted data for map display
 */
export const formatDataForMap = (activities, options = {}) => {
  if (!activities || !Array.isArray(activities)) {
    return { markers: [], regions: [] };
  }
  
  console.log('Formatting data for map display...');
  
  // Default options
  const defaultOptions = {
    clusterThreshold: 5, // Number of markers to trigger clustering
    includeUserRatings: true,
    colorByCategory: true,
    showDistance: true
  };
  
  // Merge options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Format markers
  const markers = activities.map(activity => {
    // Extract coordinates
    const coordinates = activity.coordinates || 
                       (activity.location && {
                         latitude: activity.location.latitude,
                         longitude: activity.location.longitude
                       }) ||
                       (activity.venue && {
                         latitude: activity.venue.latitude,
                         longitude: activity.venue.longitude
                       });
    
    if (!coordinates) {
      console.warn('Activity missing coordinates:', activity.id);
      return null;
    }
    
    // Determine marker color based on category
    let markerColor = '#3498db'; // Default blue
    
    if (mergedOptions.colorByCategory && activity.categories && activity.categories.length > 0) {
      const category = activity.categories[0].alias || activity.categories[0].title?.toLowerCase();
      
      switch (category) {
        case 'food':
        case 'restaurants':
          markerColor = '#e74c3c'; // Red
          break;
        case 'arts':
        case 'entertainment':
          markerColor = '#9b59b6'; // Purple
          break;
        case 'active':
        case 'outdoors':
          markerColor = '#2ecc71'; // Green
          break;
        case 'nightlife':
          markerColor = '#f39c12'; // Orange
          break;
        case 'shopping':
          markerColor = '#1abc9c'; // Teal
          break;
      }
    }
    
    // Format rating display
    let ratingDisplay = '';
    if (mergedOptions.includeUserRatings && activity.rating) {
      const rating = parseFloat(activity.rating);
      const fullStars = Math.floor(rating);
      const halfStar = rating % 1 >= 0.5;
      
      ratingDisplay = '★'.repeat(fullStars) + (halfStar ? '½' : '');
    }
    
    // Format distance display
    let distanceDisplay = '';
    if (mergedOptions.showDistance && activity.distance) {
      const distance = parseFloat(activity.distance);
      
      if (distance < 1000) {
        distanceDisplay = `${Math.round(distance)}m`;
      } else {
        distanceDisplay = `${(distance / 1000).toFixed(1)}km`;
      }
    }
    
    // Create marker object
    return {
      id: activity.id,
      coordinate: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      },
      title: activity.name || activity.title || 'Unnamed Location',
      description: activity.description?.text || activity.description || '',
      color: markerColor,
      rating: activity.rating,
      ratingDisplay,
      distance: activity.distance,
      distanceDisplay,
      price: activity.price,
      category: activity.categories?.[0]?.title || 'Uncategorized',
      source: activity.source || 'unknown',
      image: activity.image_url || activity.images?.[0] || null,
      contextual_score: activity.contextual_score
    };
  }).filter(Boolean); // Remove null markers
  
  // Cluster markers if needed
  let regions = [];
  if (markers.length > mergedOptions.clusterThreshold) {
    regions = clusterMarkers(markers);
  }
  
  return {
    markers,
    regions
  };
};

/**
 * Cluster markers into regions for better map display
 * 
 * @param {Array} markers - Array of markers to cluster
 * @returns {Array} Array of region objects
 */
const clusterMarkers = (markers) => {
  // Simple clustering algorithm based on proximity
  const regions = [];
  const processedMarkers = new Set();
  
  // For each marker
  markers.forEach(marker => {
    // Skip if already processed
    if (processedMarkers.has(marker.id)) return;
    
    // Find nearby markers
    const nearbyMarkers = markers.filter(m => 
      m.id !== marker.id && 
      !processedMarkers.has(m.id) &&
      calculateDistance(
        marker.coordinate.latitude,
        marker.coordinate.longitude,
        m.coordinate.latitude,
        m.coordinate.longitude
      ) < 500 // 500 meters threshold
    );
    
    // If we have nearby markers, create a cluster
    if (nearbyMarkers.length > 0) {
      // Mark all markers in this cluster as processed
      processedMarkers.add(marker.id);
      nearbyMarkers.forEach(m => processedMarkers.add(m.id));
      
      // Calculate region center and bounds
      const allClusterMarkers = [marker, ...nearbyMarkers];
      const latitudes = allClusterMarkers.map(m => m.coordinate.latitude);
      const longitudes = allClusterMarkers.map(m => m.coordinate.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      // Create region object
      regions.push({
        id: `region-${regions.length + 1}`,
        center: {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2
        },
        bounds: {
          northeast: { latitude: maxLat, longitude: maxLng },
          southwest: { latitude: minLat, longitude: minLng }
        },
        markers: allClusterMarkers.map(m => m.id),
        count: allClusterMarkers.length,
        title: `${allClusterMarkers.length} locations`
      });
    }
  });
  
  return regions;
};

/**
 * 8. CUSTOMIZABLE USER PREFERENCES
 */

/**
 * Apply user preference filters to activity data
 * 
 * @param {Array} activities - Array of activities to filter
 * @param {Object} preferences - User preferences
 * @returns {Array} Filtered activities
 */
export const applyUserPreferenceFilters = (activities, preferences) => {
  if (!activities || !Array.isArray(activities) || !preferences) {
    return activities || [];
  }
  
  console.log('Applying user preference filters...');
  
  let filteredActivities = [...activities];
  
  // Filter by activity types
  if (preferences.activityTypes && preferences.activityTypes.length > 0) {
    filteredActivities = filteredActivities.filter(activity => {
      // Skip if no categories
      if (!activity.categories || activity.categories.length === 0) {
        return true; // Keep activities without categories
      }
      
      // Check if any category matches user preferences
      return activity.categories.some(category => {
        const categoryName = category.alias || category.title?.toLowerCase();
        return preferences.activityTypes.includes(categoryName);
      });
    });
  }
  
  // Filter by budget
  if (preferences.budget) {
    filteredActivities = filteredActivities.filter(activity => {
      // Skip if no price information
      if (!activity.price) return true;
      
      // Convert price to a number for comparison
      let priceLevel;
      if (typeof activity.price === 'string') {
        priceLevel = activity.price.length; // '$' to 1, '$$' to 2, etc.
      } else if (typeof activity.price === 'number') {
        priceLevel = activity.price;
      } else if (activity.price.amount) {
        // Convert dollar amount to price level
        const amount = activity.price.amount;
        if (amount < 25) priceLevel = 1;
        else if (amount < 75) priceLevel = 2;
        else if (amount < 150) priceLevel = 3;
        else priceLevel = 4;
      } else {
        return true; // Keep if price format is unknown
      }
      
      // Compare with user budget preference
      switch (preferences.budget) {
        case 'low':
          return priceLevel <= 1;
        case 'medium':
          return priceLevel <= 2;
        case 'high':
          return priceLevel <= 4; // Accept any price level for high budget
        default:
          return true;
      }
    });
  }
  
  // Filter by distance
  if (preferences.maxDistance && preferences.userLocation) {
    filteredActivities = filteredActivities.filter(activity => {
      // Skip if no coordinates
      if (!activity.coordinates && !activity.location && !activity.venue) {
        return true;
      }
      
      // Get activity coordinates
      const coordinates = activity.coordinates || 
                         (activity.location && {
                           latitude: activity.location.latitude,
                           longitude: activity.location.longitude
                         }) ||
                         (activity.venue && {
                           latitude: activity.venue.latitude,
                           longitude: activity.venue.longitude
                         });
      
      if (!coordinates) return true;
      
      // Calculate distance
      const distance = calculateDistance(
        preferences.userLocation.latitude,
        preferences.userLocation.longitude,
        coordinates.latitude,
        coordinates.longitude
      );
      
      // Store distance for later use
      activity.distance = distance;
      
      // Compare with max distance
      return distance <= preferences.maxDistance;
    });
  }
  
  // Filter by accessibility needs
  if (preferences.accessibility) {
    filteredActivities = filteredActivities.filter(activity => {
      return activity.is_accessible !== false; // Keep if accessible or unknown
    });
  }
  
  // Filter by dietary restrictions
  if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
    filteredActivities = filteredActivities.filter(activity => {
      // Only apply to food-related activities
      if (!activity.categories || !activity.categories.some(c => 
        ['food', 'restaurants', 'cafes'].includes(c.alias || c.title?.toLowerCase())
      )) {
        return true; // Keep non-food activities
      }
      
      // Skip if no dietary information
      if (!activity.dietary_options) return true;
      
      // Check if all user restrictions are accommodated
      return preferences.dietaryRestrictions.every(restriction => 
        activity.dietary_options.includes(restriction)
      );
    });
  }
  
  return filteredActivities;
};

/**
 * Update user preferences based on feedback and behavior
 * 
 * @param {Object} currentPreferences - Current user preferences
 * @param {Object} feedback - User feedback data
 * @param {Object} behavior - User behavior data (e.g., clicks, views)
 * @returns {Object} Updated preferences
 */
export const updateUserPreferences = (currentPreferences, feedback, behavior) => {
  if (!currentPreferences) {
    return {
      activityTypes: [],
      budget: 'medium',
      travelStyle: 'balanced',
      accessibility: false,
      dietaryRestrictions: []
    };
  }
  
  console.log('Updating user preferences based on feedback and behavior...');
  
  // Create a copy of current preferences
  const updatedPreferences = { ...currentPreferences };
  
  // Update based on explicit feedback
  if (feedback) {
    // Update activity types
    if (feedback.likedActivities && feedback.likedActivities.length > 0) {
      // Extract categories from liked activities
      const likedCategories = feedback.likedActivities.flatMap(activity => 
        activity.categories?.map(c => c.alias || c.title?.toLowerCase()) || []
      );
      
      // Add unique categories to preferences
      updatedPreferences.activityTypes = Array.from(new Set([
        ...(updatedPreferences.activityTypes || []),
        ...likedCategories
      ]));
    }
    
    // Update budget preference based on feedback
    if (feedback.budgetFeedback) {
      updatedPreferences.budget = feedback.budgetFeedback;
    }
    
    // Update travel style based on feedback
    if (feedback.travelStyleFeedback) {
      updatedPreferences.travelStyle = feedback.travelStyleFeedback;
    }
    
    // Update accessibility needs
    if (feedback.accessibilityNeeds !== undefined) {
      updatedPreferences.accessibility = feedback.accessibilityNeeds;
    }
    
    // Update dietary restrictions
    if (feedback.dietaryRestrictions) {
      updatedPreferences.dietaryRestrictions = feedback.dietaryRestrictions;
    }
  }
  
  // Update based on implicit behavior
  if (behavior) {
    // Analyze viewed activities
    if (behavior.viewedActivities && behavior.viewedActivities.length > 0) {
      // Count category views
      const categoryViews = {};
      
      behavior.viewedActivities.forEach(activity => {
        activity.categories?.forEach(category => {
          const categoryName = category.alias || category.title?.toLowerCase();
          categoryViews[categoryName] = (categoryViews[categoryName] || 0) + 1;
        });
      });
      
      // Find top categories (viewed more than 3 times)
      const topCategories = Object.entries(categoryViews)
        .filter(([_, count]) => count >= 3)
        .map(([category]) => category);
      
      // Add top categories to preferences
      if (topCategories.length > 0) {
        updatedPreferences.activityTypes = Array.from(new Set([
          ...(updatedPreferences.activityTypes || []),
          ...topCategories
        ]));
      }
    }
    
    // Analyze booked activities
    if (behavior.bookedActivities && behavior.bookedActivities.length > 0) {
      // Calculate average price level of booked activities
      const priceLevels = behavior.bookedActivities
        .map(activity => {
          if (typeof activity.price === 'string') {
            return activity.price.length; // '$' to 1, '$$' to 2, etc.
          } else if (typeof activity.price === 'number') {
            return activity.price;
          } else if (activity.price?.amount) {
            const amount = activity.price.amount;
            if (amount < 25) return 1;
            else if (amount < 75) return 2;
            else if (amount < 150) return 3;
            else return 4;
          }
          return null;
        })
        .filter(Boolean);
      
      if (priceLevels.length > 0) {
        const avgPriceLevel = priceLevels.reduce((sum, level) => sum + level, 0) / priceLevels.length;
        
        // Update budget preference based on booking behavior
        if (avgPriceLevel < 1.5) {
          updatedPreferences.budget = 'low';
        } else if (avgPriceLevel < 2.5) {
          updatedPreferences.budget = 'medium';
        } else {
          updatedPreferences.budget = 'high';
        }
      }
    }
  }
  
  return updatedPreferences;
};