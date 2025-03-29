/**
 * Tests for the AI Personalization module
 * 
 * This file contains Jest tests for the generateDynamicItinerary function
 * in the utils/aiPersonalization.js module.
 */

import { generateDynamicItinerary } from '../src/utils/aiPersonalization';
import * as enhancedDataIntegration from '../src/utils/enhancedDataIntegration';

// Mock the enhancedDataIntegration module
jest.mock('../src/utils/enhancedDataIntegration', () => ({
  fetchMultipleApiData: jest.fn(),
  fetchCrowdsourcedData: jest.fn(),
  getUserLocation: jest.fn(),
  applyContextualFilters: jest.fn(),
  predictTrendingActivities: jest.fn(),
  formatDataForMap: jest.fn(),
  applyUserPreferenceFilters: jest.fn()
}));

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  sequential: jest.fn(() => ({
    add: jest.fn(),
    compile: jest.fn(),
    predict: jest.fn(() => ({
      array: jest.fn(() => Promise.resolve([[
        // Morning activity features (10 values)
        0.8, 0.2, 0.1, 0.5, 0.9, 0.7, 0.3, 0.6, 0.8, 0.2,
        // Lunch activity features (10 values)
        0.3, 0.7, 0.2, 0.1, 0.8, 0.6, 0.9, 0.4, 0.7, 0.5,
        // Afternoon activity features (10 values)
        0.5, 0.3, 0.8, 0.2, 0.1, 0.4, 0.7, 0.9, 0.6, 0.3,
        // Evening activity features (10 values)
        0.2, 0.8, 0.4, 0.6, 0.3, 0.7, 0.1, 0.5, 0.9, 0.4
      ]])),
      dispose: jest.fn()
    }))
  })),
  layers: {
    dense: jest.fn(() => ({}))
  },
  tensor2d: jest.fn(() => ({
    dispose: jest.fn()
  }))
}));

describe('generateDynamicItinerary', () => {
  // Set up mock data for each test
  let userData;
  let feedbackData;
  let weatherData;
  let eventsData;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set up mock user data
    userData = {
      preferences: {
        activityTypes: ['hiking', 'museums', 'food'],
        budgetRange: { min: 50, max: 200 },
        travelStyle: 'balanced',
        accessibility: false,
        dietaryRestrictions: ['vegetarian']
      },
      surveyResponses: [
        { question: 'How adventurous are you?', answer: 'Somewhat adventurous' },
        { question: 'Do you prefer indoor or outdoor activities?', answer: 'Both' }
      ]
    };

    // Set up mock feedback data
    feedbackData = {
      responses: {
        'feedback-1': { context: 'mood', response: 'I feel energetic today' },
        'feedback-2': { context: 'budget', response: 'I want to save money today' }
      },
      history: [
        { timestamp: '2025-03-28T10:00:00Z', context: 'mood', response: 'I felt tired yesterday' }
      ]
    };

    // Set up mock weather data
    weatherData = {
      forecast: [
        { 
          date: '2025-03-29', 
          condition: 'sunny', 
          temperature: 75, 
          precipitation: 10 
        },
        { 
          date: '2025-03-30', 
          condition: 'partly cloudy', 
          temperature: 70, 
          precipitation: 20 
        }
      ]
    };

    // Set up mock events data
    eventsData = {
      events: [
        {
          name: 'Local Food Festival',
          location: 'Downtown Square',
          date: '2025-03-29',
          category: 'food',
          cost: 15
        },
        {
          name: 'Museum Exhibition Opening',
          location: 'City Museum',
          date: '2025-03-30',
          category: 'cultural',
          cost: 25
        }
      ]
    };

    // Mock enhancedDataIntegration functions
    enhancedDataIntegration.getUserLocation.mockResolvedValue({
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10
    });

    enhancedDataIntegration.fetchMultipleApiData.mockResolvedValue({
      yelp: [
        { id: 'yelp-1', name: 'Hiking Trail', categories: [{ alias: 'hiking' }] },
        { id: 'yelp-2', name: 'Museum', categories: [{ alias: 'museums' }] }
      ],
      eventbrite: [
        { id: 'event-1', name: { text: 'Concert' }, venue: { latitude: 37.78, longitude: -122.41 } }
      ],
      openTable: [
        { id: 'restaurant-1', name: 'Italian Restaurant', cuisine: 'Italian' }
      ],
      viator: [
        { id: 'tour-1', title: 'City Tour', location: { latitude: 37.77, longitude: -122.42 } }
      ]
    });

    enhancedDataIntegration.fetchCrowdsourcedData.mockResolvedValue({
      trending_places: [
        { id: 'trend-1', name: 'Trending Cafe', trending_score: 85 }
      ],
      trending_activities: [
        { id: 'activity-1', name: 'Hiking in Golden Gate Park', trending_score: 90 }
      ],
      user_reviews: []
    });

    enhancedDataIntegration.applyContextualFilters.mockResolvedValue([
      { id: 'yelp-1', name: 'Hiking Trail', contextual_score: 85 },
      { id: 'restaurant-1', name: 'Italian Restaurant', contextual_score: 75 }
    ]);

    enhancedDataIntegration.predictTrendingActivities.mockResolvedValue({
      trending_activities: [
        { id: 'trend-1', name: 'Trending Cafe', trending_score: 85 }
      ],
      all_predictions: []
    });

    enhancedDataIntegration.applyUserPreferenceFilters.mockReturnValue([
      { id: 'yelp-1', name: 'Hiking Trail', contextual_score: 85 },
      { id: 'restaurant-1', name: 'Italian Restaurant', contextual_score: 75 }
    ]);

    enhancedDataIntegration.formatDataForMap.mockReturnValue({
      markers: [
        { id: 'marker-1', coordinate: { latitude: 37.77, longitude: -122.42 } }
      ],
      regions: []
    });
  });

  test('generates a well-structured itinerary with favorable conditions', async () => {
    // Execute the function
    const itinerary = await generateDynamicItinerary(userData, feedbackData, weatherData, eventsData);

    // Verify the structure of the returned itinerary
    expect(itinerary).toBeDefined();
    expect(itinerary.id).toBeDefined();
    expect(itinerary.title).toBeDefined();
    expect(itinerary.days).toBeInstanceOf(Array);
    expect(itinerary.days.length).toBe(2); // Should match the number of days in weatherData
    expect(itinerary.totalCost).toBeGreaterThan(0);
    expect(itinerary.mapData).toBeDefined();

    // Verify each day has the correct structure
    itinerary.days.forEach(day => {
      expect(day.date).toBeDefined();
      expect(day.weather).toBeDefined();
      expect(day.activities).toBeInstanceOf(Array);
      expect(day.activities.length).toBeGreaterThan(0);

      // Verify each activity has the correct structure
      day.activities.forEach(activity => {
        expect(activity.id).toBeDefined();
        expect(activity.time).toBeDefined();
        expect(activity.title).toBeDefined();
        expect(activity.description).toBeDefined();
        expect(activity.location).toBeDefined();
        expect(activity.cost).toBeDefined();
        expect(typeof activity.weatherDependent).toBe('boolean');
        expect(typeof activity.reservationRequired).toBe('boolean');
        expect(activity.reservationStatus).toBeDefined();
      });
    });

    // Verify the enhanced data integration functions were called
    expect(enhancedDataIntegration.getUserLocation).toHaveBeenCalled();
    expect(enhancedDataIntegration.fetchMultipleApiData).toHaveBeenCalled();
    expect(enhancedDataIntegration.fetchCrowdsourcedData).toHaveBeenCalled();
    expect(enhancedDataIntegration.applyContextualFilters).toHaveBeenCalled();
    expect(enhancedDataIntegration.predictTrendingActivities).toHaveBeenCalled();
    expect(enhancedDataIntegration.formatDataForMap).toHaveBeenCalled();
  });

  test('handles limited external API data gracefully', async () => {
    // Simulate limited API data
    enhancedDataIntegration.fetchMultipleApiData.mockResolvedValue({
      yelp: [],
      eventbrite: [],
      openTable: [],
      viator: []
    });

    enhancedDataIntegration.fetchCrowdsourcedData.mockResolvedValue({
      trending_places: [],
      trending_activities: [],
      user_reviews: []
    });

    // Execute the function
    const itinerary = await generateDynamicItinerary(userData, feedbackData, weatherData, eventsData);

    // Verify the itinerary was still generated
    expect(itinerary).toBeDefined();
    expect(itinerary.days).toBeInstanceOf(Array);
    expect(itinerary.days.length).toBe(2);

    // Verify each day still has activities
    itinerary.days.forEach(day => {
      expect(day.activities.length).toBeGreaterThan(0);
    });
  });

  test('strongly considers user preferences when generating itinerary', async () => {
    // Modify user preferences to be very specific
    userData.preferences.activityTypes = ['museums']; // Only museums
    userData.preferences.budgetRange = { min: 0, max: 50 }; // Low budget
    userData.preferences.travelStyle = 'relaxed'; // Relaxed style

    // Execute the function
    const itinerary = await generateDynamicItinerary(userData, feedbackData, weatherData, eventsData);

    // Verify the itinerary reflects user preferences
    expect(itinerary).toBeDefined();
    
    // Check if at least one activity is museum-related
    const hasMuseumActivity = itinerary.days.some(day => 
      day.activities.some(activity => 
        activity.title.toLowerCase().includes('museum') || 
        activity.description.toLowerCase().includes('museum')
      )
    );
    expect(hasMuseumActivity).toBe(true);
    
    // Check if the total cost is within budget
    expect(itinerary.totalCost).toBeLessThanOrEqual(userData.preferences.budgetRange.max * itinerary.days.length * 2);
    
    // Check if the itinerary title reflects the relaxed style
    expect(itinerary.title.toLowerCase()).toContain('relaxing');
  });

  test('handles invalid input gracefully', async () => {
    // Test with missing user data
    const itinerary1 = await generateDynamicItinerary(null, feedbackData, weatherData, eventsData);
    expect(itinerary1).toBeDefined(); // Should fall back to rule-based approach
    
    // Test with missing weather data
    const itinerary2 = await generateDynamicItinerary(userData, feedbackData, null, eventsData);
    expect(itinerary2).toBeDefined();
    expect(itinerary2.days).toBeInstanceOf(Array);
    
    // Test with missing events data
    const itinerary3 = await generateDynamicItinerary(userData, feedbackData, weatherData, null);
    expect(itinerary3).toBeDefined();
    expect(itinerary3.days).toBeInstanceOf(Array);
    
    // Test with missing feedback data
    const itinerary4 = await generateDynamicItinerary(userData, null, weatherData, eventsData);
    expect(itinerary4).toBeDefined();
    expect(itinerary4.days).toBeInstanceOf(Array);
  });

  test('handles TensorFlow.js model errors gracefully', async () => {
    // Mock a TensorFlow.js error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Force an error in the TensorFlow.js model
    const originalTensorFlow = require('@tensorflow/tfjs');
    jest.mock('@tensorflow/tfjs', () => ({
      ...originalTensorFlow,
      sequential: jest.fn(() => {
        throw new Error('TensorFlow.js model error');
      })
    }));
    
    // Execute the function
    const itinerary = await generateDynamicItinerary(userData, feedbackData, weatherData, eventsData);
    
    // Verify the function falls back to rule-based approach
    expect(itinerary).toBeDefined();
    expect(itinerary.days).toBeInstanceOf(Array);
    expect(console.log).toHaveBeenCalledWith('Falling back to rule-based itinerary generation...');
  });
});