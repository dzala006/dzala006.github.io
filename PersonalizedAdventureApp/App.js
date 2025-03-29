import React, { useContext, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StatusBar, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import ItineraryScreen from './src/screens/ItineraryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import FutureItineraryScreen from './src/screens/FutureItineraryScreen';
import CollaborativeItineraryScreen from './src/screens/CollaborativeItineraryScreen';

// Import context provider
import { AuthContext, AuthProvider } from './src/context/AuthContext';

// Import theme
import { colors, typography } from './src/theme/theme';

// Import utilities
import { initializeRealTimeUpdates, UPDATE_METHODS } from './src/utils/realTimeUpdates';
import { addNotificationResponseListener } from './src/utils/notifications';

// Create stack navigator
const Stack = createStackNavigator();

// Define screen options
const screenOptions = {
  headerStyle: {
    backgroundColor: colors.primary.main,
  },
  headerTintColor: colors.primary.contrast,
  headerTitleStyle: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.lg,
  },
  cardStyle: {
    backgroundColor: colors.background.primary,
  },
};

// Define linking configuration for deep links
const linking = {
  prefixes: ['personalizedadventure://', 'https://personalizedadventure.com'],
  config: {
    screens: {
      Home: {
        path: 'home',
        screens: {},
      },
      Itinerary: {
        path: 'itinerary/:id?',
        parse: {
          id: (id) => id,
        },
      },
      Profile: 'profile',
      FutureItinerary: 'future-itinerary/:date?',
      CollaborativeItinerary: 'collaborative/:inviteCode?',
      Login: 'login',
      Register: 'register',
    },
  },
};

// App content with access to auth context
const AppContent = () => {
  const { user, isLoading } = useContext(AuthContext);
  const navigationRef = useRef(null);
  
  // Handle notification responses (when user taps a notification)
  useEffect(() => {
    const cleanupNotificationListener = addNotificationResponseListener(response => {
      const { data } = response.notification.request.content;
      
      if (data && data.screen) {
        // Navigate to the specified screen with parameters
        if (navigationRef.current) {
          navigationRef.current.navigate(data.screen, data.params || {});
        }
      }
    });
    
    // Initialize real-time updates
    const cleanupRealTimeUpdates = initializeRealTimeUpdates(UPDATE_METHODS.WEBSOCKET);
    
    // Handle deep links when app is already running
    const handleDeepLink = ({ url }) => {
      if (url && navigationRef.current) {
        // Let the navigation container handle the URL
        // The linking configuration will parse the URL and navigate accordingly
        console.log('Deep link received:', url);
      }
    };
    
    // Add event listener for deep links
    Linking.addEventListener('url', handleDeepLink);
    
    // Check for initial URL (app opened via deep link)
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('App opened with URL:', url);
      }
    });
    
    return () => {
      // Clean up listeners
      cleanupNotificationListener();
      cleanupRealTimeUpdates();
      // Remove deep link listener
      // Note: In newer React Native versions, the listener returns a subscription object
      // that has a remove() method. Check the React Native version and adjust accordingly.
      Linking.removeEventListener('url', handleDeepLink);
    };
  }, []);
  
  // Show loading screen while checking authentication state
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: colors.background.primary 
      }}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={{ 
          marginTop: 20, 
          fontSize: typography.fontSize.md, 
          color: colors.text.secondary,
          fontFamily: typography.fontFamily.regular,
        }}>
          Loading...
        </Text>
      </View>
    );
  }
  
  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary.dark} />
      {user ? (
        // User is signed in - show app screens
        <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Personalized Adventure' }}
          />
          <Stack.Screen 
            name="Itinerary" 
            component={ItineraryScreen} 
            options={{ title: 'Your Itinerary' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: 'Your Profile' }}
          />
          <Stack.Screen 
            name="FutureItinerary" 
            component={FutureItineraryScreen} 
            options={{ title: 'Plan Ahead' }}
          />
          <Stack.Screen 
            name="CollaborativeItinerary" 
            component={CollaborativeItineraryScreen} 
            options={{ title: 'Plan Together' }}
          />
        </Stack.Navigator>
      ) : (
        // No user - show authentication screens
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            cardStyle: { backgroundColor: colors.background.primary }
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

// Main App component
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;