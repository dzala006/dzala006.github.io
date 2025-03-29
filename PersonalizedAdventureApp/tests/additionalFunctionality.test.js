/**
 * Additional Functionality Tests for Personalized Adventure App
 * 
 * This file contains comprehensive tests for additional features of the app:
 * - Push Notifications
 * - Real-Time Updates and Deep Linking
 * - Collaborative Itinerary Planning
 * - Security and Authentication
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import components for testing
import App from '../App';
import HomeScreen from '../src/screens/HomeScreen';
import ItineraryScreen from '../src/screens/ItineraryScreen';
import CollaborativeItineraryScreen from '../src/screens/CollaborativeItineraryScreen';

// Import utilities for testing
import { scheduleNotification, cancelAllNotifications } from '../src/utils/notifications';
import { setupWebSocket, pollForUpdates, processRealTimeUpdate } from '../src/utils/realTimeUpdates';
import * as tokenStorage from '../src/utils/tokenStorage';
import * as apiService from '../src/utils/apiService';

// Mock external dependencies
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id-123')),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-linking', () => ({
  parse: jest.fn(),
  createURL: jest.fn(path => `personalizedadventure://${path}`),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
    connected: true,
  };
  return jest.fn(() => mockSocket);
});

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

// Sample data for testing
const sampleItinerary = {
  id: 'itinerary-123',
  title: 'Weekend Adventure',
  days: [
    {
      date: '2025-03-29',
      weather: { condition: 'sunny', temperature: 75 },
      activities: [
        {
          id: 'activity-1',
          time: '09:00 AM',
          title: 'Morning Hike',
          description: 'Scenic trail with mountain views',
          location: 'Mountain Park',
          cost: 0,
          weatherDependent: true,
          reservationRequired: false,
          reservationStatus: 'not-required'
        }
      ]
    }
  ]
};

const sampleUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  preferences: {
    activityTypes: ['hiking', 'food'],
    budgetRange: { min: 50, max: 200 },
    travelStyle: 'balanced'
  }
};

// Mock authentication token
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('Additional Functionality Tests', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  // 1. Push Notifications Tests
  describe('Push Notifications', () => {
    test('scheduleNotification creates and schedules a notification', async () => {
      // Call the function
      const notificationId = await scheduleNotification(
        'New itinerary update!',
        'Your weekend plans have been updated due to weather changes.',
        { screen: 'Itinerary', params: { id: 'itinerary-123' } }
      );
      
      // Verify notification was scheduled
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'New itinerary update!',
            body: 'Your weekend plans have been updated due to weather changes.',
            data: { screen: 'Itinerary', params: { id: 'itinerary-123' } }
          }),
          trigger: null // Immediate notification
        })
      );
      
      // Verify notification ID was returned
      expect(notificationId).toBe('notification-id-123');
    });
    
    test('scheduleNotification with future trigger time', async () => {
      // Create a future date (1 hour from now)
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      
      // Call the function with future trigger
      await scheduleNotification(
        'Upcoming reservation',
        'Your dinner reservation is in 1 hour',
        { screen: 'Itinerary', params: { id: 'itinerary-123' } },
        futureDate
      );
      
      // Verify notification was scheduled with future trigger
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: futureDate
        })
      );
    });
    
    test('cancelAllNotifications cancels all scheduled notifications', async () => {
      // Call the function
      await cancelAllNotifications();
      
      // Verify all notifications were dismissed
      expect(Notifications.dismissAllNotificationsAsync).toHaveBeenCalled();
    });
    
    test('Notification click navigates to the correct screen', async () => {
      // Mock notification response
      const notificationResponse = {
        notification: {
          request: {
            content: {
              data: {
                screen: 'Itinerary',
                params: { id: 'itinerary-123' }
              }
            }
          }
        }
      };
      
      // Get the notification response handler
      const handlers = {};
      Notifications.addNotificationResponseReceivedListener.mockImplementation(handler => {
        handlers.responseReceived = handler;
        return { remove: jest.fn() };
      });
      
      // Render the App component to set up notification handlers
      render(<NavigationContainer><App /></NavigationContainer>);
      
      // Simulate notification response
      if (handlers.responseReceived) {
        handlers.responseReceived(notificationResponse);
      }
      
      // Verify navigation was called with the correct screen and params
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Itinerary', { id: 'itinerary-123' });
      });
    });
  });

  // 2. Real-Time Updates and Deep Linking Tests
  describe('Real-Time Updates and Deep Linking', () => {
    test('WebSocket connection receives and processes real-time updates', async () => {
      // Mock socket.io implementation
      const mockSocket = require('socket.io-client')();
      
      // Set up WebSocket connection
      setupWebSocket('user-123');
      
      // Simulate receiving a real-time update
      const updateData = {
        type: 'itinerary_update',
        itineraryId: 'itinerary-123',
        changes: {
          'days.0.activities.0.title': 'Updated Hike Title',
          'days.0.activities.0.location': 'New Trail Location'
        }
      };
      
      // Find the 'update' event handler and call it with the update data
      const updateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'update')[1];
      updateHandler(updateData);
      
      // Mock the HomeScreen component's state update function
      const mockUpdateItinerary = jest.fn();
      
      // Process the update
      processRealTimeUpdate(updateData, sampleItinerary, mockUpdateItinerary);
      
      // Verify the itinerary was updated correctly
      expect(mockUpdateItinerary).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'itinerary-123',
          days: [
            expect.objectContaining({
              activities: [
                expect.objectContaining({
                  title: 'Updated Hike Title',
                  location: 'New Trail Location'
                })
              ]
            })
          ]
        })
      );
    });
    
    test('Polling mechanism fetches and processes updates', async () => {
      // Mock API response with updates
      apiService.get.mockResolvedValueOnce({
        data: {
          updates: [
            {
              type: 'weather_update',
              date: '2025-03-29',
              newWeather: { condition: 'rainy', temperature: 65 }
            }
          ]
        }
      });
      
      // Mock the update processing function
      const mockProcessUpdate = jest.fn();
      
      // Start polling
      await pollForUpdates('itinerary-123', mockProcessUpdate);
      
      // Verify API was called correctly
      expect(apiService.get).toHaveBeenCalledWith('/api/itineraries/itinerary-123/updates');
      
      // Verify updates were processed
      expect(mockProcessUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'weather_update',
          date: '2025-03-29',
          newWeather: { condition: 'rainy', temperature: 65 }
        })
      );
    });
    
    test('Deep linking parses URL and navigates to correct screen', async () => {
      // Mock deep link URL
      Linking.getInitialURL.mockResolvedValueOnce('personalizedadventure://itinerary/itinerary-123');
      Linking.parse.mockReturnValueOnce({
        hostname: 'itinerary',
        path: 'itinerary-123',
        queryParams: {}
      });
      
      // Get the URL handler
      const handlers = {};
      Linking.addEventListener.mockImplementation((event, handler) => {
        handlers.url = handler;
        return { remove: jest.fn() };
      });
      
      // Render the App component to set up deep link handlers
      render(<NavigationContainer><App /></NavigationContainer>);
      
      // Wait for initial URL check
      await waitFor(() => {
        expect(Linking.getInitialURL).toHaveBeenCalled();
      });
      
      // Simulate receiving a deep link
      if (handlers.url) {
        handlers.url({ url: 'personalizedadventure://itinerary/itinerary-123' });
      }
      
      // Verify navigation was called with the correct screen and params
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Itinerary', { id: 'itinerary-123' });
      });
    });
  });

  // 3. Collaborative Itinerary Planning Tests
  describe('Collaborative Itinerary Planning', () => {
    test('CollaborativeItineraryScreen invites user and merges preferences', async () => {
      // Mock API responses
      apiService.get.mockResolvedValueOnce({
        data: {
          user: {
            id: 'partner-456',
            name: 'Partner User',
            email: 'partner@example.com',
            preferences: {
              activityTypes: ['museums', 'food'],
              budgetRange: { min: 100, max: 300 },
              travelStyle: 'luxury'
            }
          }
        }
      });
      
      apiService.post.mockResolvedValueOnce({
        data: {
          success: true,
          collaborativeItinerary: {
            id: 'collab-789',
            title: 'Collaborative Weekend',
            participants: ['user-123', 'partner-456'],
            mergedPreferences: {
              activityTypes: ['food'], // Common interest
              budgetRange: { min: 100, max: 200 }, // Overlapping range
              travelStyle: 'balanced' // Compromise
            },
            days: [
              {
                date: '2025-03-29',
                activities: [
                  {
                    id: 'activity-1',
                    title: 'Brunch at Cafe',
                    suitableFor: ['user-123', 'partner-456'] // Both users
                  },
                  {
                    id: 'activity-2',
                    title: 'Museum Visit',
                    suitableFor: ['partner-456'] // Partner preference
                  },
                  {
                    id: 'activity-3',
                    title: 'Hiking Trail',
                    suitableFor: ['user-123'] // User preference
                  }
                ]
              }
            ]
          }
        }
      });
      
      // Render the component
      const { getByText, getByPlaceholderText, queryByText } = render(
        <CollaborativeItineraryScreen
          route={{ params: { userId: 'user-123' } }}
        />
      );
      
      // Enter partner email
      const emailInput = getByPlaceholderText(/partner's email/i);
      fireEvent.changeText(emailInput, 'partner@example.com');
      
      // Press invite button
      const inviteButton = getByText(/invite/i);
      fireEvent.press(inviteButton);
      
      // Wait for partner info to be fetched
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/api/users/lookup', {
          params: { email: 'partner@example.com' }
        });
      });
      
      // Verify partner info is displayed
      await waitFor(() => {
        expect(getByText(/Partner User/i)).toBeTruthy();
      });
      
      // Press generate collaborative itinerary button
      const generateButton = getByText(/generate collaborative itinerary/i);
      fireEvent.press(generateButton);
      
      // Wait for collaborative itinerary to be generated
      await waitFor(() => {
        expect(apiService.post).toHaveBeenCalledWith('/api/itineraries/generate/collaborative', {
          participants: ['user-123', 'partner-456']
        });
      });
      
      // Verify collaborative itinerary is displayed
      await waitFor(() => {
        expect(getByText(/Collaborative Weekend/i)).toBeTruthy();
        expect(getByText(/Brunch at Cafe/i)).toBeTruthy();
        expect(getByText(/Museum Visit/i)).toBeTruthy();
        expect(getByText(/Hiking Trail/i)).toBeTruthy();
      });
      
      // Verify suitability indicators
      await waitFor(() => {
        // Both users
        expect(queryByText(/Both/i)).toBeTruthy();
        // Partner preference
        expect(queryByText(/Partner/i)).toBeTruthy();
        // User preference
        expect(queryByText(/You/i)).toBeTruthy();
      });
    });
    
    test('CollaborativeItineraryScreen handles preference conflicts', async () => {
      // Mock API responses with conflicting preferences
      apiService.get.mockResolvedValueOnce({
        data: {
          user: {
            id: 'partner-456',
            name: 'Partner User',
            preferences: {
              activityTypes: ['shopping', 'nightlife'],
              budgetRange: { min: 300, max: 500 },
              travelStyle: 'luxury',
              accessibility: true
            }
          }
        }
      });
      
      // Render the component
      const { getByText, getByPlaceholderText } = render(
        <CollaborativeItineraryScreen
          route={{ params: { userId: 'user-123' } }}
        />
      );
      
      // Enter partner email
      const emailInput = getByPlaceholderText(/partner's email/i);
      fireEvent.changeText(emailInput, 'partner@example.com');
      
      // Press invite button
      const inviteButton = getByText(/invite/i);
      fireEvent.press(inviteButton);
      
      // Wait for partner info to be fetched
      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/api/users/lookup', {
          params: { email: 'partner@example.com' }
        });
      });
      
      // Verify conflict warnings are displayed
      await waitFor(() => {
        expect(getByText(/preference conflicts detected/i)).toBeTruthy();
        expect(getByText(/no common activity types/i)).toBeTruthy();
        expect(getByText(/budget ranges don't overlap/i)).toBeTruthy();
        expect(getByText(/different travel styles/i)).toBeTruthy();
      });
      
      // Verify resolution options are displayed
      await waitFor(() => {
        expect(getByText(/resolve conflicts/i)).toBeTruthy();
      });
    });
  });

  // 4. Security and Authentication Tests
  describe('Security and Authentication', () => {
    test('Protected routes require valid JWT token', async () => {
      // Mock token retrieval to return null (no token)
      jest.spyOn(tokenStorage, 'getToken').mockResolvedValueOnce(null);
      
      // Call a protected endpoint
      try {
        await apiService.get('/api/itineraries');
      } catch (error) {
        // Verify error was thrown
        expect(error.message).toContain('Authentication required');
      }
      
      // Verify navigation to login screen
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
    
    test('Expired token triggers re-authentication', async () => {
      // Mock token retrieval to return an expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5MDIzfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      jest.spyOn(tokenStorage, 'getToken').mockResolvedValueOnce(expiredToken);
      
      // Mock token validation to indicate expiration
      jest.spyOn(tokenStorage, 'isTokenExpired').mockReturnValueOnce(true);
      
      // Mock token removal
      const removeTokenSpy = jest.spyOn(tokenStorage, 'removeToken');
      
      // Call a protected endpoint
      try {
        await apiService.get('/api/itineraries');
      } catch (error) {
        // Verify error was thrown
        expect(error.message).toContain('Token expired');
      }
      
      // Verify token was removed
      expect(removeTokenSpy).toHaveBeenCalled();
      
      // Verify navigation to login screen
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
    
    test('Error messages do not expose sensitive information', async () => {
      // Mock API response with a server error
      apiService.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: {
            error: 'Internal server error: Failed to connect to database at mongodb://username:password@localhost:27017/personalized-adventure'
          }
        }
      });
      
      // Call the API
      try {
        await apiService.post('/api/users/login', {
          email: 'test@example.com',
          password: 'password123'
        });
      } catch (error) {
        // Verify error message does not contain sensitive information
        expect(error.message).not.toContain('mongodb://');
        expect(error.message).not.toContain('username:password');
        expect(error.message).toContain('Internal server error');
      }
    });
    
    test('Authentication headers are properly formatted', async () => {
      // Mock token retrieval
      jest.spyOn(tokenStorage, 'getToken').mockResolvedValueOnce(mockToken);
      
      // Mock API service to capture headers
      const originalGet = apiService.get;
      apiService.get.mockImplementation((url, options = {}) => {
        return originalGet(url, options);
      });
      
      // Call a protected endpoint
      await apiService.get('/api/itineraries');
      
      // Verify headers format
      expect(apiService.get).toHaveBeenCalledWith('/api/itineraries', 
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-auth-token': mockToken,
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });
});