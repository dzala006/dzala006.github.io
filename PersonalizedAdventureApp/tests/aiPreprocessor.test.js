/**
 * Tests for the AI Preprocessor module
 * 
 * This file contains Jest tests for the functions in the aiPreprocessor.js module.
 */

import {
  preprocessDataForModel,
  encodeUserPreferences,
  encodeFeedbackData,
  encodeWeatherData,
  encodeEventsData
} from '../src/utils/aiPreprocessor';

describe('aiPreprocessor', () => {
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
  });

  describe('preprocessDataForModel', () => {
    test('returns a properly structured object with all required properties', () => {
      const result = preprocessDataForModel(userData, feedbackData, weatherData, eventsData);
      
      // Check that the result has all expected properties
      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('userFeatures');
      expect(result).toHaveProperty('feedbackFeatures');
      expect(result).toHaveProperty('weatherFeatures');
      expect(result).toHaveProperty('eventsFeatures');
      expect(result).toHaveProperty('flattenedFeatures');
      
      // Check that the flattened features array is the combination of all feature arrays
      expect(result.flattenedFeatures.length).toBe(
        result.userFeatures.length + 
        result.feedbackFeatures.length + 
        result.weatherFeatures.length + 
        result.eventsFeatures.length
      );
    });

    test('handles missing feedback data gracefully', () => {
      const result = preprocessDataForModel(userData, null, weatherData, eventsData);
      
      // Check that feedback features still exist but use default values
      expect(result).toHaveProperty('feedbackFeatures');
      expect(result.feedbackFeatures.length).toBeGreaterThan(0);
      
      // All feedback features should be 0.5 (neutral) when no feedback data is provided
      expect(result.feedbackFeatures.every(value => value === 0.5)).toBe(true);
    });
  });

  describe('encodeUserPreferences', () => {
    test('correctly encodes activity types', () => {
      const result = encodeUserPreferences(
        ['hiking', 'museums', 'food'],
        { min: 50, max: 200 },
        'balanced',
        false,
        ['vegetarian']
      );
      
      // The first 5 values should be one-hot encoded activity types
      // [hiking, museums, food, shopping, tours]
      expect(result[0]).toBe(1.0); // hiking is included
      expect(result[1]).toBe(1.0); // museums is included
      expect(result[2]).toBe(1.0); // food is included
      expect(result[3]).toBe(0.0); // shopping is not included
      expect(result[4]).toBe(0.0); // tours is not included
    });

    test('correctly encodes budget range', () => {
      const result = encodeUserPreferences(
        [],
        { min: 100, max: 500 },
        'balanced',
        false,
        []
      );
      
      // Budget values should be normalized to 0-1 range
      expect(result[5]).toBe(0.1); // min: 100/1000 = 0.1
      expect(result[6]).toBe(0.5); // max: 500/1000 = 0.5
    });

    test('correctly encodes travel style', () => {
      const adventurousResult = encodeUserPreferences(
        [],
        { min: 0, max: 0 },
        'adventurous',
        false,
        []
      );
      
      const balancedResult = encodeUserPreferences(
        [],
        { min: 0, max: 0 },
        'balanced',
        false,
        []
      );
      
      const relaxedResult = encodeUserPreferences(
        [],
        { min: 0, max: 0 },
        'relaxed',
        false,
        []
      );
      
      // Travel style should be one-hot encoded
      // [adventurous, balanced, relaxed]
      expect(adventurousResult[7]).toBe(1.0);
      expect(adventurousResult[8]).toBe(0.0);
      expect(adventurousResult[9]).toBe(0.0);
      
      expect(balancedResult[7]).toBe(0.0);
      expect(balancedResult[8]).toBe(1.0);
      expect(balancedResult[9]).toBe(0.0);
      
      expect(relaxedResult[7]).toBe(0.0);
      expect(relaxedResult[8]).toBe(0.0);
      expect(relaxedResult[9]).toBe(1.0);
    });

    test('correctly encodes accessibility requirement', () => {
      const accessibleResult = encodeUserPreferences(
        [],
        { min: 0, max: 0 },
        'balanced',
        true,
        []
      );
      
      const nonAccessibleResult = encodeUserPreferences(
        [],
        { min: 0, max: 0 },
        'balanced',
        false,
        []
      );
      
      // Accessibility should be a boolean flag
      expect(accessibleResult[10]).toBe(1.0);
      expect(nonAccessibleResult[10]).toBe(0.0);
    });

    test('correctly encodes dietary restrictions', () => {
      const result = encodeUserPreferences(
        [],
        { min: 0, max: 0 },
        'balanced',
        false,
        ['vegetarian', 'gluten-free']
      );
      
      // Dietary restrictions should be one-hot encoded
      // [vegetarian, vegan, gluten-free]
      expect(result[11]).toBe(1.0); // vegetarian is included
      expect(result[12]).toBe(0.0); // vegan is not included
      expect(result[13]).toBe(1.0); // gluten-free is included
    });
  });

  describe('encodeFeedbackData', () => {
    test('correctly encodes mood from feedback', () => {
      const happyFeedback = {
        responses: {
          'feedback-1': { context: 'mood', response: 'I feel happy today' }
        }
      };
      
      const tiredFeedback = {
        responses: {
          'feedback-1': { context: 'mood', response: 'I feel tired today' }
        }
      };
      
      const neutralFeedback = {
        responses: {
          'feedback-1': { context: 'mood', response: 'I feel normal today' }
        }
      };
      
      const happyResult = encodeFeedbackData(happyFeedback);
      const tiredResult = encodeFeedbackData(tiredFeedback);
      const neutralResult = encodeFeedbackData(neutralFeedback);
      
      // Mood should be encoded as a value between 0 and 1
      expect(happyResult[0]).toBe(1.0); // happy = 1.0
      expect(tiredResult[0]).toBe(0.0); // tired = 0.0
      expect(neutralResult[0]).toBe(0.5); // neutral = 0.5
    });

    test('handles missing feedback data gracefully', () => {
      const result = encodeFeedbackData(null);
      
      // Should return default values for all feedback features
      expect(result.length).toBe(5);
      expect(result.every(value => value === 0.5)).toBe(true);
    });

    test('correctly encodes multiple feedback contexts', () => {
      const mixedFeedback = {
        responses: {
          'feedback-1': { context: 'mood', response: 'I feel happy today' },
          'feedback-2': { context: 'budget', response: 'I want to save money today' },
          'feedback-3': { context: 'environment', response: 'I prefer indoor activities today' }
        }
      };
      
      const result = encodeFeedbackData(mixedFeedback);
      
      // Each context should be encoded correctly
      expect(result[0]).toBe(1.0); // happy mood = 1.0
      expect(result[1]).toBe(1.0); // budget conscious = 1.0
      expect(result[2]).toBe(1.0); // indoor preference = 1.0
    });
  });

  describe('encodeWeatherData', () => {
    test('correctly encodes temperature', () => {
      const hotWeather = {
        forecast: [{ temperature: 95, condition: 'sunny', precipitation: 0 }]
      };
      
      const coldWeather = {
        forecast: [{ temperature: 35, condition: 'sunny', precipitation: 0 }]
      };
      
      const hotResult = encodeWeatherData(hotWeather);
      const coldResult = encodeWeatherData(coldWeather);
      
      // Temperature should be normalized to 0-1 range
      expect(hotResult[0]).toBe(0.95); // 95/100 = 0.95
      expect(coldResult[0]).toBe(0.35); // 35/100 = 0.35
    });

    test('correctly encodes precipitation', () => {
      const rainyWeather = {
        forecast: [{ temperature: 70, condition: 'rainy', precipitation: 80 }]
      };
      
      const dryWeather = {
        forecast: [{ temperature: 70, condition: 'sunny', precipitation: 5 }]
      };
      
      const rainyResult = encodeWeatherData(rainyWeather);
      const dryResult = encodeWeatherData(dryWeather);
      
      // Precipitation should be normalized to 0-1 range
      expect(rainyResult[1]).toBe(0.8); // 80/100 = 0.8
      expect(dryResult[1]).toBe(0.05); // 5/100 = 0.05
    });

    test('correctly encodes weather condition', () => {
      const sunnyWeather = {
        forecast: [{ temperature: 70, condition: 'sunny', precipitation: 0 }]
      };
      
      const cloudyWeather = {
        forecast: [{ temperature: 70, condition: 'partly cloudy', precipitation: 0 }]
      };
      
      const rainyWeather = {
        forecast: [{ temperature: 70, condition: 'rainy', precipitation: 0 }]
      };
      
      const sunnyResult = encodeWeatherData(sunnyWeather);
      const cloudyResult = encodeWeatherData(cloudyWeather);
      const rainyResult = encodeWeatherData(rainyWeather);
      
      // Weather condition should be encoded as a value between 0 and 1
      expect(sunnyResult[2]).toBe(1.0); // sunny = 1.0
      expect(cloudyResult[2]).toBe(0.5); // cloudy = 0.5
      expect(rainyResult[2]).toBe(0.0); // rainy = 0.0
    });
  });

  describe('encodeEventsData', () => {
    test('correctly encodes number of events', () => {
      const manyEvents = {
        events: Array(15).fill({ name: 'Event', category: 'general', cost: 10 })
      };
      
      const fewEvents = {
        events: Array(3).fill({ name: 'Event', category: 'general', cost: 10 })
      };
      
      const noEvents = {
        events: []
      };
      
      const manyResult = encodeEventsData(manyEvents);
      const fewResult = encodeEventsData(fewEvents);
      const noResult = encodeEventsData(noEvents);
      
      // Number of events should be normalized to 0-1 range, capped at 10 events
      expect(manyResult[0]).toBe(1.0); // 15 events, capped at 1.0
      expect(fewResult[0]).toBe(0.3); // 3/10 = 0.3
      expect(noResult[0]).toBe(0.0); // 0 events = 0.0
    });

    test('correctly encodes average event cost', () => {
      const expensiveEvents = {
        events: [
          { name: 'Event 1', category: 'general', cost: 150 },
          { name: 'Event 2', category: 'general', cost: 250 }
        ]
      };
      
      const cheapEvents = {
        events: [
          { name: 'Event 1', category: 'general', cost: 10 },
          { name: 'Event 2', category: 'general', cost: 20 }
        ]
      };
      
      const expensiveResult = encodeEventsData(expensiveEvents);
      const cheapResult = encodeEventsData(cheapEvents);
      
      // Average cost should be normalized to 0-1 range, assuming 0-200 range
      expect(expensiveResult[1]).toBe(1.0); // (150+250)/2/200 = 1.0 (capped)
      expect(cheapResult[1]).toBe(0.075); // (10+20)/2/200 = 0.075
    });

    test('correctly encodes event categories', () => {
      const culturalEvents = {
        events: [
          { name: 'Event 1', category: 'cultural', cost: 10 },
          { name: 'Event 2', category: 'art', cost: 20 }
        ]
      };
      
      const sportsEvents = {
        events: [
          { name: 'Event 1', category: 'sports', cost: 30 },
          { name: 'Event 2', category: 'football', cost: 40 }
        ]
      };
      
      const mixedEvents = {
        events: [
          { name: 'Event 1', category: 'cultural', cost: 10 },
          { name: 'Event 2', category: 'sports', cost: 20 },
          { name: 'Event 3', category: 'music', cost: 30 }
        ]
      };
      
      const culturalResult = encodeEventsData(culturalEvents);
      const sportsResult = encodeEventsData(sportsEvents);
      const mixedResult = encodeEventsData(mixedEvents);
      
      // Event categories should be one-hot encoded
      // [cultural, sports, music]
      expect(culturalResult[2]).toBe(1.0); // has cultural events
      expect(culturalResult[3]).toBe(0.0); // no sports events
      expect(culturalResult[4]).toBe(0.0); // no music events
      
      expect(sportsResult[2]).toBe(0.0); // no cultural events
      expect(sportsResult[3]).toBe(1.0); // has sports events
      expect(sportsResult[4]).toBe(0.0); // no music events
      
      expect(mixedResult[2]).toBe(1.0); // has cultural events
      expect(mixedResult[3]).toBe(1.0); // has sports events
      expect(mixedResult[4]).toBe(1.0); // has music events
    });
  });
});