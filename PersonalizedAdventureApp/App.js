import React, { useContext } from 'react';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import ItineraryScreen from './src/screens/ItineraryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Import context provider
import { AuthContext, AuthProvider } from './src/context/AuthContext';

// Create stack navigator
const Stack = createStackNavigator();

// Define screen options
const screenOptions = {
  headerStyle: {
    backgroundColor: '#4a90e2',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
};

// App content with access to auth context
const AppContent = () => {
  const { user, isLoading } = useContext(AuthContext);
  
  // Show loading screen while checking authentication state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>Loading...</Text>
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#4a90e2" />
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
        </Stack.Navigator>
      ) : (
        // No user - show authentication screens
        <Stack.Navigator screenOptions={{ headerShown: false }}>
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