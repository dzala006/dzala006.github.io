/**
 * Comprehensive Test Suite for Personalized Adventure App
 * 
 * This file contains end-to-end tests for the Personalized Adventure App,
 * including authentication, itinerary generation, offline caching, API retries,
 * error handling, and UI component testing.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../src/context/AuthContext';
import App from '../App';

// Import components for testing
import FeedbackPopup from '../src/components/FeedbackPopup';
import SocialShareButton from '../src/components/SocialShareButton';
import ChatRoom from '../src/components/ChatRoom';

// Import utilities for testing
import { generateDynamicItinerary } from '../src/utils/aiPersonalization';
import { preprocessDataForModel } from '../src/utils/aiPreprocessor';
import { postProcessModelOutput } from '../src/utils/aiPostprocessor';
import { getCachedItinerary, cacheItinerary, getItineraryWithOfflineSupport } from '../src/utils/offlineCache';
import { fetchWithExponentialBackoff, shouldRetryRequest } from '../src/utils/enhancedApiRetry';
import * as tokenStorage from '../src/utils/tokenStorage';
import * as apiService from '../src/utils/apiService';

// Mock external dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@tensorflow/tfjs', () => ({
  sequential: jest.fn(() => ({
    add: jest.fn(),
    compile: jest.fn(),
    predict: jest.fn(() => ({
      array: jest.fn(() => Promise.resolve([[
        // Mock model output (40 values)
        0.8, 0.2, 0.1, 0.5, 0.9, 0.7, 0.3, 0.6, 0.8, 0.2, // Morning
        0.3, 0.7, 0.2, 0.1, 0.8, 0.6, 0.9, 0.4, 0.7, 0.5, // Lunch
        0.5, 0.3, 0.8, 0.2, 0.1, 0.4, 0.7, 0.9, 0.6, 0.3, // Afternoon
        0.2, 0.8, 0.4, 0.6, 0.3, 0.7, 0.1, 0.5, 0.9, 0.4  // Evening
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

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10
    },
    timestamp: Date.now()
  }))
}));

jest.mock('../src/utils/enhancedDataIntegration', () => ({
  fetchMultipleApiData: jest.fn(() => Promise.resolve({
    yelp: [{ id: 'yelp-1', name: 'Test Business' }],
    eventbrite: [{ id: 'event-1', name: { text: 'Test Event' } }],
    openTable: [{ id: 'restaurant-1', name: 'Test Restaurant' }],
    viator: [{ id: 'tour-1', title: 'Test Tour' }]
  })),
  fetchCrowdsourcedData: jest.fn(() => Promise.resolve({
    trending_places: [{ id: 'trend-1', name: 'Trending Place' }],
    trending_activities: [{ id: 'activity-1', name: 'Trending Activity' }],
    user_reviews: []
  })),
  getUserLocation: jest.fn(() => Promise.resolve({
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10
  })),
  applyContextualFilters: jest.fn(() => Promise.resolve([
    { id: 'yelp-1', name: 'Test Business', contextual_score: 85 }
  ])),
  predictTrendingActivities: jest.fn(() => Promise.resolve({
    trending_activities: [{ id: 'trend-1', name: 'Trending Place', trending_score: 85 }],
    all_predictions: []
  })),
  formatDataForMap: jest.fn(() => ({
    markers: [{ id: 'marker-1', coordinate: { latitude: 37.77, longitude: -122.42 } }],
    regions: []
  })),
  applyUserPreferenceFilters: jest.fn((activities) => activities)
}));

jest.mock('../src/utils/apiService', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  del: jest.fn(() => Promise.resolve({ data: {} }))
}));

// Mock fetch for API retry testing
global.fetch = jest.fn();

// Sample test data
const sampleUserData = {
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

const sampleFeedbackData = {
  responses: {
    'feedback-1': { context: 'mood', response: 'I feel energetic today' },
    'feedback-2': { context: 'budget', response: 'I want to save money today' }
  },
  history: [
    { timestamp: '2025-03-28T10:00:00Z', context: 'mood', response: 'I felt tired yesterday' }
  ]
};

const sampleWeatherData = {
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

const sampleEventsData = {
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

// Mock authentication token
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('Personalized Adventure App', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockClear();
    AsyncStorage.setItem.mockClear();
    global.fetch.mockClear();
  });

  // 1. Authentication Flow Tests
  describe('Authentication Flow', () => {
    test('User registration process creates account and stores token', async () => {
      // Mock successful registration response
      apiService.post.mockResolvedValueOnce({
        data: {
          token: mockToken,
          user: {
            id: '123',
            name: 'Test User',
            email: 'test@example.com'
          }
        }
      });
      
      // Mock token storage
      const setTokenSpy = jest.spyOn(tokenStorage, 'setToken');
      
      // Register a new user
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        preferences: {
          activityTypes: ['hiking', 'food'],
          budgetRange: { min: 50, max: 200 },
          travelStyle: 'balanced'
        }
      };
      
      // Call the registration function
      const result = await apiService.post('/api/users/register', registerData);
      
      // Verify API was called with correct data
      expect(apiService.post).toHaveBeenCalledWith('/api/users/register', registerData);
      
      // Verify token was stored
      expect(setTokenSpy).toHaveBeenCalledWith(mockToken);
      
      // Verify response contains user data
      expect(result.data.user).toBeDefined();
      expect(result.data.user.id).toBe('123');
    });
    
    test('Login process authenticates user and stores token', async () => {
      // Mock successful login response
      apiService.post.mockResolvedValueOnce({
        data: {
          token: mockToken,
          user: {
            id: '123',
            name: 'Test User',
            email: 'test@example.com'
          }
        }
      });
      
      // Mock token storage
      const setTokenSpy = jest.spyOn(tokenStorage, 'setToken');
      
      // Login credentials
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!'
      };
      
      // Call the login function
      const result = await apiService.post('/api/users/login', loginData);
      
      // Verify API was called with correct data
      expect(apiService.post).toHaveBeenCalledWith('/api/users/login', loginData);
      
      // Verify token was stored
      expect(setTokenSpy).toHaveBeenCalledWith(mockToken);
      
      // Verify response contains user data
      expect(result.data.user).toBeDefined();
      expect(result.data.user.id).toBe('123');
    });
    
    test('Protected routes include authentication token in headers', async () => {
      // Mock token retrieval
      jest.spyOn(tokenStorage, 'getToken').mockResolvedValue(mockToken);
      
      // Mock API service to capture headers
      const originalGet = apiService.get;
      apiService.get.mockImplementation((url, options = {}) => {
        return originalGet(url, options);
      });
      
      // Call a protected endpoint
      await apiService.get('/api/itineraries');
      
      // Verify token was included in headers
      expect(apiService.get).toHaveBeenCalledWith('/api/itineraries', 
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-auth-token': mockToken
          })
        })
      );
    });
  });

  // 2. Itinerary Generation Tests
  describe('Itinerary Generation', () => {
    test('generateDynamicItinerary produces well-structured itinerary with valid inputs', async () => {
      // Call the function with sample data
      const itinerary = await generateDynamicItinerary(
        sampleUserData,
        sampleFeedbackData,
        sampleWeatherData,
        sampleEventsData
      );
      
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
    });
    
    test('preprocessDataForModel correctly formats input data for the model', () => {
      // Call the preprocessor
      const preprocessedData = preprocessDataForModel(
        sampleUserData,
        sampleFeedbackData,
        sampleWeatherData,
        sampleEventsData
      );
      
      // Verify the structure of the preprocessed data
      expect(preprocessedData).toBeDefined();
      expect(preprocessedData.features).toBeInstanceOf(Array);
      expect(preprocessedData.userFeatures).toBeInstanceOf(Array);
      expect(preprocessedData.feedbackFeatures).toBeInstanceOf(Array);
      expect(preprocessedData.weatherFeatures).toBeInstanceOf(Array);
      expect(preprocessedData.eventsFeatures).toBeInstanceOf(Array);
      
      // Verify the features array contains all the individual feature arrays
      expect(preprocessedData.features.length).toBe(
        preprocessedData.userFeatures.length +
        preprocessedData.feedbackFeatures.length +
        preprocessedData.weatherFeatures.length +
        preprocessedData.eventsFeatures.length
      );
    });
    
    test('postProcessModelOutput converts model output into structured itinerary', () => {
      // Sample model output (40 values as described in the code)
      const modelOutput = [
        // Morning activity features (10 values)
        0.8, 0.2, 0.1, 0.5, 0.9, 0.7, 0.3, 0.6, 0.8, 0.2,
        // Lunch activity features (10 values)
        0.3, 0.7, 0.2, 0.1, 0.8, 0.6, 0.9, 0.4, 0.7, 0.5,
        // Afternoon activity features (10 values)
        0.5, 0.3, 0.8, 0.2, 0.1, 0.4, 0.7, 0.9, 0.6, 0.3,
        // Evening activity features (10 values)
        0.2, 0.8, 0.4, 0.6, 0.3, 0.7, 0.1, 0.5, 0.9, 0.4
      ];
      
      // Call the postprocessor
      const itinerary = postProcessModelOutput(
        modelOutput,
        sampleUserData,
        sampleWeatherData,
        sampleEventsData
      );
      
      // Verify the structure of the returned itinerary
      expect(itinerary).toBeDefined();
      expect(itinerary.id).toBeDefined();
      expect(itinerary.title).toBeDefined();
      expect(itinerary.days).toBeInstanceOf(Array);
      expect(itinerary.days.length).toBe(2); // Should match the number of days in weatherData
      
      // Verify each day has activities
      itinerary.days.forEach(day => {
        expect(day.activities).toBeInstanceOf(Array);
        expect(day.activities.length).toBeGreaterThan(0);
      });
    });
  });

  // 3. Offline Cache Tests
  describe('Offline Cache', () => {
    test('cacheItinerary stores itinerary data in AsyncStorage', async () => {
      // Sample itinerary data
      const itineraryId = 'test-itinerary-123';
      const itineraryData = {
        id: itineraryId,
        title: 'Test Itinerary',
        days: [
          {
            date: '2025-03-29',
            activities: [
              { id: 'act1', title: 'Morning Hike', time: '09:00 AM' }
            ]
          }
        ]
      };
      
      // Cache the itinerary
      await cacheItinerary(itineraryId, itineraryData);
      
      // Verify AsyncStorage was called with the correct data
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining(itineraryId),
        JSON.stringify(itineraryData)
      );
    });
    
    test('getCachedItinerary retrieves itinerary data from AsyncStorage', async () => {
      // Sample itinerary data
      const itineraryId = 'test-itinerary-123';
      const itineraryData = {
        id: itineraryId,
        title: 'Test Itinerary',
        days: [
          {
            date: '2025-03-29',
            activities: [
              { id: 'act1', title: 'Morning Hike', time: '09:00 AM' }
            ]
          }
        ]
      };
      
      // Mock AsyncStorage to return the sample data
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(itineraryData));
      
      // Get the cached itinerary
      const result = await getCachedItinerary(itineraryId);
      
      // Verify AsyncStorage was called with the correct key
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        expect.stringContaining(itineraryId)
      );
      
      // Verify the returned data matches the sample data
      expect(result).toEqual(itineraryData);
    });
    
    test('getItineraryWithOfflineSupport falls back to cache when offline', async () => {
      // Sample itinerary data
      const itineraryId = 'test-itinerary-123';
      const itineraryData = {
        id: itineraryId,
        title: 'Test Itinerary',
        days: [
          {
            date: '2025-03-29',
            activities: [
              { id: 'act1', title: 'Morning Hike', time: '09:00 AM' }
            ]
          }
        ]
      };
      
      // Mock isOnline to return false (offline)
      jest.mock('../src/utils/offlineCache', () => ({
        ...jest.requireActual('../src/utils/offlineCache'),
        isOnline: jest.fn(() => Promise.resolve(false))
      }));
      
      // Mock getCachedItinerary to return the sample data
      jest.spyOn(require('../src/utils/offlineCache'), 'getCachedItinerary')
        .mockResolvedValueOnce(itineraryData);
      
      // Mock fetch function that would fail if called
      const fetchFunction = jest.fn(() => Promise.reject(new Error('Network error')));
      
      // Get the itinerary with offline support
      const result = await getItineraryWithOfflineSupport(itineraryId, fetchFunction);
      
      // Verify fetch function was not called (because we're offline)
      expect(fetchFunction).not.toHaveBeenCalled();
      
      // Verify the returned data matches the cached data
      expect(result).toEqual(itineraryData);
    });
  });

  // 4. API Retry Tests
  describe('API Retry Mechanism', () => {
    test('fetchWithExponentialBackoff retries failed requests with increasing delays', async () => {
      // Mock fetch to fail twice then succeed
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn(() => 'application/json')
          },
          json: jest.fn(() => Promise.resolve({ success: true }))
        });
      
      // Call the function
      const result = await fetchWithExponentialBackoff('https://api.example.com/test', {}, {
        maxRetries: 3,
        baseDelay: 100 // Use a small delay for testing
      });
      
      // Verify fetch was called 3 times (2 failures + 1 success)
      expect(global.fetch).toHaveBeenCalledTimes(3);
      
      // Verify the result is correct
      expect(result).toEqual({ success: true });
    });
    
    test('shouldRetryRequest correctly identifies retryable errors', () => {
      // Network error (should retry)
      expect(shouldRetryRequest(new Error('network error'), null, 0, 3)).toBe(true);
      
      // Server error (should retry)
      expect(shouldRetryRequest(new Error('Server error'), 500, 0, 3)).toBe(true);
      
      // Rate limiting (should retry)
      expect(shouldRetryRequest(new Error('Too many requests'), 429, 0, 3)).toBe(true);
      
      // Client error (should not retry)
      expect(shouldRetryRequest(new Error('Not found'), 404, 0, 3)).toBe(false);
      
      // Max retries reached (should not retry)
      expect(shouldRetryRequest(new Error('network error'), null, 3, 3)).toBe(false);
    });
  });

  // 5. Error Handling Tests
  describe('Error Handling', () => {
    test('generateDynamicItinerary falls back to rule-based approach when ML model fails', async () => {
      // Force an error in the TensorFlow.js model
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const originalTensorFlow = require('@tensorflow/tfjs');
      jest.mock('@tensorflow/tfjs', () => ({
        ...originalTensorFlow,
        sequential: jest.fn(() => {
          throw new Error('TensorFlow.js model error');
        })
      }));
      
      // Call the function
      const itinerary = await generateDynamicItinerary(
        sampleUserData,
        sampleFeedbackData,
        sampleWeatherData,
        sampleEventsData
      );
      
      // Verify the function falls back to rule-based approach
      expect(itinerary).toBeDefined();
      expect(itinerary.days).toBeInstanceOf(Array);
      expect(console.log).toHaveBeenCalledWith('Falling back to rule-based itinerary generation...');
    });
    
    test('API service handles authentication errors by clearing token', async () => {
      // Mock token storage
      const removeTokenSpy = jest.spyOn(tokenStorage, 'removeToken');
      
      // Mock API response with 401 Unauthorized
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: jest.fn(() => Promise.resolve('Unauthorized'))
      });
      
      // Call the API
      try {
        await fetchWithExponentialBackoff('https://api.example.com/protected', {
          headers: { 'x-auth-token': mockToken }
        });
      } catch (error) {
        // Verify token was removed
        expect(removeTokenSpy).toHaveBeenCalled();
      }
    });
  });

  // 6. UI Component Tests
  describe('UI Components', () => {
    test('FeedbackPopup renders correctly and submits feedback', async () => {
      // Mock callback function
      const onSubmit = jest.fn();
      const onClose = jest.fn();
      
      // Render the component
      const { getByText, getByPlaceholderText } = render(
        <FeedbackPopup
          visible={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      );
      
      // Verify the component renders
      expect(getByText(/How do you feel/i)).toBeTruthy();
      
      // Enter feedback
      const input = getByPlaceholderText(/Enter your response/i);
      fireEvent.changeText(input, 'I feel great today!');
      
      // Submit feedback
      const submitButton = getByText(/Submit/i);
      fireEvent.press(submitButton);
      
      // Verify callback was called with the feedback
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
          response: 'I feel great today!'
        }));
      });
    });
    
    test('SocialShareButton triggers share dialog when pressed', async () => {
      // Mock Share API
      const mockShare = jest.fn(() => Promise.resolve({ action: 'sharedAction' }));
      jest.mock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Share: {
          share: mockShare
        }
      }));
      
      // Render the component
      const { getByText } = render(
        <SocialShareButton
          title="Test Itinerary"
          message="Check out my awesome itinerary!"
          url="https://example.com/itinerary/123"
        />
      );
      
      // Press the share button
      const shareButton = getByText(/Share/i);
      fireEvent.press(shareButton);
      
      // Verify Share.share was called with the correct data
      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Itinerary',
            message: 'Check out my awesome itinerary!'
          })
        );
      });
    });
    
    test('ChatRoom connects to socket and displays messages', async () => {
      // Mock socket.io client
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn()
      };
      
      jest.mock('socket.io-client', () => jest.fn(() => mockSocket));
      
      // Render the component
      const { getByText, getByPlaceholderText } = render(
        <ChatRoom
          roomId="itinerary-123"
          username="TestUser"
        />
      );
      
      // Verify connection status
      expect(getByText(/Connecting/i)).toBeTruthy();
      
      // Simulate socket connection
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          callback();
        }
      });
      
      // Verify connected status
      await waitFor(() => {
        expect(getByText(/Connected/i)).toBeTruthy();
      });
      
      // Enter a message
      const input = getByPlaceholderText(/Type a message/i);
      fireEvent.changeText(input, 'Hello, partner!');
      
      // Send the message
      const sendButton = getByText(/Send/i);
      fireEvent.press(sendButton);
      
      // Verify socket.emit was called with the message
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'message',
        expect.objectContaining({
          text: 'Hello, partner!',
          sender: 'TestUser'
        })
      );
    });
  });
});