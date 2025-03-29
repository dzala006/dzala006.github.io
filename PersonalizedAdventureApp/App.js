import React, { useContext, useEffect } from 'react';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

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

// App content with access to auth context
const AppContent = () => {
  const { user, isLoading } = useContext(AuthContext);
  
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
    <NavigationContainer>
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