import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { scheduleNotification } from './notifications';

/**
 * Constants for update types
 */
export const UPDATE_TYPES = {
  ITINERARY: 'itinerary',
  RESERVATION: 'reservation',
  WEATHER: 'weather',
  EVENT: 'event',
};

/**
 * Constants for update methods
 */
export const UPDATE_METHODS = {
  POLLING: 'polling',
  WEBSOCKET: 'websocket',
};

/**
 * Simulated WebSocket connection for real-time updates
 * In a production app, this would be a real WebSocket connection
 */
class SimulatedWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.isConnected = false;
    this.listeners = {
      open: [],
      message: [],
      close: [],
      error: [],
    };
    this.simulatedEvents = [
      {
        type: UPDATE_TYPES.WEATHER,
        data: {
          location: 'San Francisco, CA',
          forecast: 'Rain expected in the afternoon',
          affectedActivities: ['outdoor_activity_1', 'outdoor_activity_2'],
        },
        delay: 10000, // 10 seconds
      },
      {
        type: UPDATE_TYPES.EVENT,
        data: {
          eventName: 'Street Festival',
          location: 'Downtown',
          time: '2:00 PM - 8:00 PM',
          description: 'A new street festival has been announced near your planned activities',
        },
        delay: 20000, // 20 seconds
      },
      {
        type: UPDATE_TYPES.RESERVATION,
        data: {
          activityId: 'activity_3',
          status: 'confirmed',
          reservationId: 'RES123456',
          time: '7:30 PM',
          notes: 'Your reservation has been confirmed',
        },
        delay: 15000, // 15 seconds
      },
    ];
  }

  connect() {
    // Simulate connection delay
    setTimeout(() => {
      this.isConnected = true;
      this.listeners.open.forEach(callback => callback());
      
      // Set up simulated events
      this.simulatedEvents.forEach(event => {
        setTimeout(() => {
          if (this.isConnected) {
            this.listeners.message.forEach(callback => 
              callback({ data: JSON.stringify(event) })
            );
          }
        }, event.delay);
      });
    }, 1000);
    
    return this;
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return this;
  }

  close() {
    if (this.isConnected) {
      this.isConnected = false;
      this.listeners.close.forEach(callback => callback());
      this.listeners = {
        open: [],
        message: [],
        close: [],
        error: [],
      };
    }
  }
}

/**
 * Create a WebSocket connection for real-time updates
 * @param {string} url - WebSocket URL
 * @param {Object} options - WebSocket options
 * @returns {SimulatedWebSocket} WebSocket connection
 */
export const createWebSocketConnection = (url, options = {}) => {
  return new SimulatedWebSocket(url, options);
};

/**
 * Hook for polling-based real-time updates
 * @param {Function} fetchFunction - Function to fetch updated data
 * @param {number} interval - Polling interval in milliseconds
 * @param {boolean} enabled - Whether polling is enabled
 * @returns {Object} Object containing the latest data and loading state
 */
export const usePolling = (fetchFunction, interval = 30000, enabled = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const fetchData = async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      const result = await fetchFunction();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Polling error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    if (enabled) {
      fetchData();
    }

    // Set up polling
    if (enabled && interval > 0) {
      timerRef.current = setInterval(fetchData, interval);
    }

    // Handle app state changes (background/foreground)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active' && 
        enabled
      ) {
        // App has come to the foreground, refresh data
        fetchData();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      subscription.remove();
    };
  }, [fetchFunction, interval, enabled]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for WebSocket-based real-time updates
 * @param {string} url - WebSocket URL
 * @param {Object} options - WebSocket options
 * @param {boolean} enabled - Whether WebSocket is enabled
 * @returns {Object} Object containing the latest data, connection state, and methods
 */
export const useWebSocket = (url, options = {}, enabled = true) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!enabled) return;

    // Create and connect WebSocket
    socketRef.current = createWebSocketConnection(url, options)
      .on('open', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      })
      .on('message', (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
          
          // Send notification based on update type
          if (parsedData.type === UPDATE_TYPES.WEATHER) {
            scheduleNotification({
              title: 'Weather Update',
              message: parsedData.data.forecast,
              data: { 
                screen: 'Itinerary', 
                params: { weatherUpdate: true, affectedActivities: parsedData.data.affectedActivities } 
              },
              triggerTime: null
            });
          } else if (parsedData.type === UPDATE_TYPES.EVENT) {
            scheduleNotification({
              title: 'New Event Nearby',
              message: `${parsedData.data.eventName} at ${parsedData.data.location}`,
              data: { 
                screen: 'Itinerary', 
                params: { newEvent: parsedData.data } 
              },
              triggerTime: null
            });
          } else if (parsedData.type === UPDATE_TYPES.RESERVATION) {
            scheduleNotification({
              title: 'Reservation Update',
              message: parsedData.data.notes,
              data: { 
                screen: 'Itinerary', 
                params: { reservationUpdate: parsedData.data } 
              },
              triggerTime: null
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          setError(err);
        }
      })
      .on('close', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      })
      .on('error', (err) => {
        console.error('WebSocket error:', err);
        setError(err);
        setIsConnected(false);
      })
      .connect();

    // Handle app state changes (background/foreground)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active' && 
        socketRef.current && 
        !socketRef.current.isConnected
      ) {
        // App has come to the foreground, reconnect WebSocket
        socketRef.current.connect();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      subscription.remove();
    };
  }, [url, enabled]);

  // Method to manually reconnect
  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current.connect();
    }
  };

  return { data, isConnected, error, reconnect };
};

/**
 * Fetch itinerary updates from the server
 * @param {string} itineraryId - ID of the itinerary to fetch
 * @returns {Promise<Object>} Updated itinerary data
 */
export const fetchItineraryUpdates = async (itineraryId) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate random updates
      const updates = [
        {
          type: 'weather_change',
          description: 'Rain expected in the afternoon',
          affectedActivities: ['activity_2', 'activity_4'],
          alternativeActivities: [
            {
              id: 'alt_1',
              time: '2:00 PM',
              title: 'Museum Visit',
              description: 'Visit the local art museum',
              location: 'Downtown Museum',
              cost: 15,
              weatherDependent: false,
              reservationRequired: false
            }
          ]
        },
        {
          type: 'new_event',
          description: 'Local festival happening tonight',
          event: {
            id: 'event_1',
            time: '7:00 PM',
            title: 'Street Festival',
            description: 'Enjoy local food and music at the street festival',
            location: 'Main Street',
            cost: 0,
            weatherDependent: true,
            reservationRequired: false
          }
        }
      ];
      
      // Randomly select one update
      const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
      
      resolve({
        itineraryId,
        timestamp: new Date().toISOString(),
        update: randomUpdate
      });
    }, 1000);
  });
};

/**
 * Fetch reservation updates from the server
 * @param {string} reservationIds - Array of reservation IDs to check
 * @returns {Promise<Object>} Updated reservation data
 */
export const fetchReservationUpdates = async (reservationIds) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate random updates
      const statuses = ['confirmed', 'pending', 'cancelled', 'changed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      resolve({
        reservationId: reservationIds[0],
        status: randomStatus,
        timestamp: new Date().toISOString(),
        notes: randomStatus === 'changed' 
          ? 'Your reservation time has been changed to 8:00 PM' 
          : `Your reservation is now ${randomStatus}`
      });
    }, 1000);
  });
};

/**
 * Initialize real-time updates for the app
 * @param {string} method - Update method (polling or websocket)
 * @param {Object} options - Configuration options
 * @returns {Function} Cleanup function
 */
export const initializeRealTimeUpdates = (method = UPDATE_METHODS.WEBSOCKET, options = {}) => {
  if (method === UPDATE_METHODS.WEBSOCKET) {
    const socket = createWebSocketConnection('wss://api.personalizedadventure.com/updates', options)
      .on('open', () => {
        console.log('Real-time updates initialized (WebSocket)');
      })
      .on('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Real-time update received:', data);
          
          // Process update based on type
          if (data.type === UPDATE_TYPES.ITINERARY) {
            // Handle itinerary update
          } else if (data.type === UPDATE_TYPES.RESERVATION) {
            // Handle reservation update
          } else if (data.type === UPDATE_TYPES.WEATHER) {
            // Handle weather update
          } else if (data.type === UPDATE_TYPES.EVENT) {
            // Handle event update
          }
        } catch (err) {
          console.error('Error processing real-time update:', err);
        }
      })
      .connect();
      
    return () => {
      socket.close();
    };
  } else if (method === UPDATE_METHODS.POLLING) {
    const { interval = 30000 } = options;
    const timerId = setInterval(async () => {
      try {
        // Fetch updates from various endpoints
        const [itineraryUpdates, reservationUpdates] = await Promise.all([
          fetchItineraryUpdates('current'),
          fetchReservationUpdates(['res1', 'res2'])
        ]);
        
        console.log('Polling updates:', { itineraryUpdates, reservationUpdates });
        
        // Process updates
        // ...
      } catch (err) {
        console.error('Error fetching polling updates:', err);
      }
    }, interval);
    
    return () => {
      clearInterval(timerId);
    };
  }
  
  return () => {};
};