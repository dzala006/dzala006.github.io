/**
 * Tests for the AI Postprocessor module
 * 
 * This file contains Jest tests for the functions in the aiPostprocessor.js module.
 */

import {
  postProcessModelOutput,
  structurePredictions,
  calculateAverageConfidence,
  calculateModelConfidence,
  generateDayActivities,
  generateActivityTitle,
  generateActivityDescription,
  generateActivityLocation,
  getSuitabilityLabel
} from '../src/utils/aiPostprocessor';

// Mock the aiPersonalizationHelpers module
jest.mock('../src/utils/aiPersonalizationHelpers', () => ({
  generateUniqueId: jest.fn(() => 'test-id-123'),
  generateItineraryTitle: jest.fn(() => 'Test Itinerary Title')
}));

describe('aiPostprocessor', () => {
  // Set up mock data for each test
  let modelPredictions;
  let userData;
  let weatherData;
  let eventsData;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set up mock model predictions (40 values as described in the module)
    modelPredictions = [
      // Morning activity (10 values)
      0.8, 0.2, 0.1, 0.5, 0.9, // Activity type probabilities
      0.7, // Cost
      0.3, // Indoor/outdoor (0=outdoor, 1=indoor)
      0.6, // Reservation needed
      0.8, // Suitability score
      0.9, // Confidence
      
      // Lunch activity (10 values)
      0.3, 0.7, 0.2, 0.1, 0.8, // Activity type probabilities
      0.6, // Cost
      0.9, // Indoor/outdoor
      0.4, // Reservation needed
      0.7, // Suitability score
      0.8, // Confidence
      
      // Afternoon activity (10 values)
      0.5, 0.3, 0.8, 0.2, 0.1, // Activity type probabilities
      0.4, // Cost
      0.7, // Indoor/outdoor
      0.9, // Reservation needed
      0.6, // Suitability score
      0.7, // Confidence
      
      // Evening activity (10 values)
      0.2, 0.8, 0.4, 0.6, 0.3, // Activity type probabilities
      0.7, // Cost
      0.1, // Indoor/outdoor
      0.5, // Reservation needed
      0.9, // Suitability score
      0.6  // Confidence
    ];

    // Set up mock user data
    userData = {
      preferences: {
        activityTypes: ['hiking', 'museums', 'food'],
        budgetRange: { min: 50, max: 200 },
        travelStyle: 'balanced',
        accessibility: false,
        dietaryRestrictions: ['vegetarian']
      },
      enhancedData: {
        feedbackBased: true,
        nearbyActivities: [
          { id: 'activity-1', name: 'Hiking Trail', contextual_score: 85 }
        ]
      }
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
  });

  describe('structurePredictions', () => {
    test('correctly structures raw model predictions', () => {
      const result = structurePredictions(modelPredictions);
      
      // Check that the result has the expected structure
      expect(result).toHaveProperty('timeSlots');
      expect(result.timeSlots).toHaveProperty('morning');
      expect(result.timeSlots).toHaveProperty('lunch');
      expect(result.timeSlots).toHaveProperty('afternoon');
      expect(result.timeSlots).toHaveProperty('evening');
      
      // Check that each time slot has the expected properties
      const { morning, lunch, afternoon, evening } = result.timeSlots;
      
      expect(morning).toHaveProperty('activityType');
      expect(morning).toHaveProperty('cost');
      expect(morning).toHaveProperty('isIndoor');
      expect(morning).toHaveProperty('needsReservation');
      expect(morning).toHaveProperty('suitabilityScore');
      expect(morning).toHaveProperty('confidence');
      
      // Check that values are correctly extracted
      expect(morning.activityType).toEqual(modelPredictions.slice(0, 5));
      expect(morning.cost).toBe(modelPredictions[5]);
      expect(morning.isIndoor).toBe(false); // 0.3 < 0.5
      expect(morning.needsReservation).toBe(true); // 0.6 > 0.5
      expect(morning.suitabilityScore).toBe(modelPredictions[8]);
      expect(morning.confidence).toBe(modelPredictions[9]);
      
      // Check that the confidence score is calculated correctly
      expect(result).toHaveProperty('confidenceScore');
      expect(result.confidenceScore).toBe(0.75); // (0.9 + 0.8 + 0.7 + 0.6) / 4
    });
  });

  describe('calculateAverageConfidence', () => {
    test('correctly calculates average confidence from predictions', () => {
      const result = calculateAverageConfidence(modelPredictions);
      
      // Confidence values are at indices 9, 19, 29, 39
      const expected = (modelPredictions[9] + modelPredictions[19] + modelPredictions[29] + modelPredictions[39]) / 4;
      expect(result).toBe(expected);
    });
  });

  describe('calculateModelConfidence', () => {
    test('correctly calculates model confidence from structured predictions', () => {
      const structuredPredictions = {
        timeSlots: {
          morning: { confidence: 0.9 },
          lunch: { confidence: 0.8 },
          afternoon: { confidence: 0.7 },
          evening: { confidence: 0.6 }
        }
      };
      
      const result = calculateModelConfidence(structuredPredictions);
      
      expect(result).toBe(0.75); // (0.9 + 0.8 + 0.7 + 0.6) / 4
    });
  });

  describe('generateActivityTitle', () => {
    test('returns correct title for known activity type and time of day', () => {
      expect(generateActivityTitle('hiking', 'morning')).toBe('Morning Nature Hike');
      expect(generateActivityTitle('museums', 'afternoon')).toBe('Cultural Museum Visit');
      expect(generateActivityTitle('food', 'evening')).toBe('Culinary Dinner Adventure');
    });

    test('returns fallback title for unknown activity type', () => {
      expect(generateActivityTitle('unknown', 'morning')).toBe('Unknown Activity');
    });
  });

  describe('generateActivityDescription', () => {
    test('returns weather-appropriate description', () => {
      const rainyWeather = { condition: 'rainy', temperature: 70, precipitation: 80 };
      const hotWeather = { condition: 'sunny', temperature: 90, precipitation: 0 };
      const coldWeather = { condition: 'sunny', temperature: 40, precipitation: 0 };
      const normalWeather = { condition: 'sunny', temperature: 70, precipitation: 0 };
      
      const preferences = { accessibility: false };
      
      // Test rainy weather descriptions
      expect(generateActivityDescription('museums', rainyWeather, preferences))
        .toContain('Stay dry while exploring');
      
      // Test hot weather descriptions
      expect(generateActivityDescription('hiking', hotWeather, preferences))
        .toContain('shaded hiking trail');
      
      // Test cold weather descriptions
      expect(generateActivityDescription('food', coldWeather, preferences))
        .toContain('Warm up with hearty local cuisine');
      
      // Test normal weather descriptions
      expect(generateActivityDescription('shopping', normalWeather, preferences))
        .toContain('Browse local shops');
    });

    test('adds accessibility information when needed', () => {
      const weather = { condition: 'sunny', temperature: 70, precipitation: 0 };
      const accessiblePreferences = { accessibility: true };
      
      const result = generateActivityDescription('museums', weather, accessiblePreferences);
      
      expect(result).toContain('This activity is fully accessible');
    });
  });

  describe('generateActivityLocation', () => {
    test('returns correct location for known activity type', () => {
      expect(generateActivityLocation('hiking')).toBe('Local Nature Trail');
      expect(generateActivityLocation('museums')).toBe('City Museum');
      expect(generateActivityLocation('food')).toBe('Downtown Food District');
    });

    test('returns fallback location for unknown activity type', () => {
      expect(generateActivityLocation('unknown')).toBe('Local Venue');
    });
  });

  describe('getSuitabilityLabel', () => {
    test('returns correct label based on suitability score', () => {
      expect(getSuitabilityLabel(0.9)).toBe('Everyone');
      expect(getSuitabilityLabel(0.7)).toBe('Most Travelers');
      expect(getSuitabilityLabel(0.5)).toBe('Adventure Seekers');
      expect(getSuitabilityLabel(0.3)).toBe('Experienced Travelers');
      expect(getSuitabilityLabel(0.1)).toBe('Specialized Interests');
    });
  });

  describe('generateDayActivities', () => {
    test('generates a list of activities for a day', () => {
      const structuredPredictions = structurePredictions(modelPredictions);
      const dayWeather = weatherData.forecast[0];
      const dayEvents = eventsData.events.filter(event => event.date === dayWeather.date);
      
      const result = generateDayActivities(
        structuredPredictions,
        dayWeather,
        dayEvents,
        userData.preferences,
        true // First day
      );
      
      // Check that the result is an array of activities
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check that each activity has the expected properties
      result.forEach(activity => {
        expect(activity).toHaveProperty('id');
        expect(activity).toHaveProperty('time');
        expect(activity).toHaveProperty('title');
        expect(activity).toHaveProperty('description');
        expect(activity).toHaveProperty('location');
        expect(activity).toHaveProperty('cost');
        expect(activity).toHaveProperty('weatherDependent');
        expect(activity).toHaveProperty('reservationRequired');
        expect(activity).toHaveProperty('reservationStatus');
        expect(activity).toHaveProperty('suitableFor');
      });
      
      // Check that the activities include a morning activity, lunch, and afternoon activity
      const timeSlots = result.map(activity => activity.time);
      expect(timeSlots).toContain('09:00 AM'); // Morning
      expect(timeSlots).toContain('12:30 PM'); // Lunch
      expect(timeSlots).toContain('07:00 PM'); // Evening
    });

    test('includes relevant events in the itinerary', () => {
      const structuredPredictions = structurePredictions(modelPredictions);
      const dayWeather = weatherData.forecast[0];
      const dayEvents = [
        {
          name: 'Local Food Festival',
          location: 'Downtown Square',
          date: '2025-03-29',
          category: 'food',
          cost: 15
        }
      ];
      
      const result = generateDayActivities(
        structuredPredictions,
        dayWeather,
        dayEvents,
        userData.preferences,
        false // Not first day
      );
      
      // Check if the event is included in the activities
      const eventActivity = result.find(activity => activity.title === 'Local Food Festival');
      expect(eventActivity).toBeDefined();
      expect(eventActivity.location).toBe('Downtown Square');
      expect(eventActivity.cost).toBe(15);
    });
  });

  describe('postProcessModelOutput', () => {
    test('generates a complete itinerary from model predictions', () => {
      const result = postProcessModelOutput(modelPredictions, userData, weatherData, eventsData);
      
      // Check that the result has the expected structure
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result).toHaveProperty('days');
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('preferences');
      expect(result).toHaveProperty('generatedAt');
      expect(result).toHaveProperty('mlModelConfidence');
      expect(result).toHaveProperty('dynamicAdjustments');
      
      // Check that the days array has the correct length
      expect(result.days.length).toBe(weatherData.forecast.length);
      
      // Check that each day has the expected properties
      result.days.forEach(day => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('weather');
        expect(day).toHaveProperty('activities');
        expect(Array.isArray(day.activities)).toBe(true);
        expect(day.activities.length).toBeGreaterThan(0);
      });
      
      // Check that the dynamic adjustments are set correctly
      expect(result.dynamicAdjustments.weatherBased).toBe(true);
      expect(result.dynamicAdjustments.feedbackBased).toBe(true);
      expect(result.dynamicAdjustments.eventsBased).toBe(true);
      expect(result.dynamicAdjustments.mlBased).toBe(true);
    });
  });
});