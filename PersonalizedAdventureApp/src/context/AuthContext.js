import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as apiService from '../utils/apiService';
import { isAuthenticated, getToken, parseToken, removeToken } from '../utils/tokenStorage';

// Create the Authentication Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // State for user authentication
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  
  // State for user preferences
  const [preferences, setPreferences] = useState({
    activityTypes: [],
    budgetRange: { min: 0, max: 1000 },
    travelStyle: 'balanced',
    accessibility: false,
    dietaryRestrictions: []
  });
  
  // State for survey data
  const [surveyData, setSurveyData] = useState({
    completed: false,
    responses: {}
  });

  // Load user data from storage on app start
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        // Check if user is authenticated with a valid token
        const isAuth = await isAuthenticated();
        
        if (isAuth) {
          // Get the token
          const token = await getToken();
          setAuthToken(token);
          
          // Parse token to get user ID
          const tokenData = parseToken(token);
          
          if (tokenData && tokenData.user && tokenData.user.id) {
            // Fetch user data from API
            try {
              const userData = await apiService.get(`/users/${tokenData.user.id}`);
              if (userData && userData.data) {
                setUser(userData.data);
              }
            } catch (error) {
              console.error('Failed to fetch user data from API', error);
              // Token might be invalid, remove it
              await removeToken();
              setAuthToken(null);
            }
          }
        }
        
        // Load preferences and survey data from AsyncStorage
        const preferencesJson = await AsyncStorage.getItem('preferences');
        const surveyJson = await AsyncStorage.getItem('surveyData');
        
        if (preferencesJson) setPreferences(JSON.parse(preferencesJson));
        if (surveyJson) setSurveyData(JSON.parse(surveyJson));
      } catch (error) {
        console.error('Failed to load user data from storage', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserFromStorage();
  }, []);

  // Save preferences to AsyncStorage whenever they change
  useEffect(() => {
    const savePreferencesToStorage = async () => {
      try {
        await AsyncStorage.setItem('preferences', JSON.stringify(preferences));
      } catch (error) {
        console.error('Failed to save preferences to storage', error);
      }
    };
    
    if (!isLoading) {
      savePreferencesToStorage();
    }
  }, [preferences, isLoading]);

  // Save survey data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveSurveyToStorage = async () => {
      try {
        await AsyncStorage.setItem('surveyData', JSON.stringify(surveyData));
      } catch (error) {
        console.error('Failed to save survey data to storage', error);
      }
    };
    
    if (!isLoading) {
      saveSurveyToStorage();
    }
  }, [surveyData, isLoading]);

  // Login function
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // Call the API service login function
      const result = await apiService.login(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        // Get the token after successful login
        const token = await getToken();
        setAuthToken(token);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password) => {
    setIsLoading(true);
    try {
      // Call the API service register function
      const result = await apiService.register(name, email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        // Get the token after successful registration
        const token = await getToken();
        setAuthToken(token);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      // Call the API service logout function
      const result = await apiService.logout();
      
      if (result.success) {
        // Clear user data
        setUser(null);
        setAuthToken(null);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Logout failed' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Update preferences function
  const updatePreferences = (newPreferences) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  };

  // Update survey data function
  const updateSurveyData = (newData) => {
    setSurveyData(prev => ({ 
      ...prev, 
      ...newData,
      responses: { ...prev.responses, ...newData.responses }
    }));
  };

  // Provide the context value to children components
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        authToken,
        login,
        register,
        logout,
        preferences,
        updatePreferences,
        surveyData,
        updateSurveyData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};