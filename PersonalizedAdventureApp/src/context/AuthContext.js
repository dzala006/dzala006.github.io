import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the Authentication Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // State for user authentication
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
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

  // Load user data from AsyncStorage on app start
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const preferencesJson = await AsyncStorage.getItem('preferences');
        const surveyJson = await AsyncStorage.getItem('surveyData');
        
        if (userJson) setUser(JSON.parse(userJson));
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

  // Save user data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveUserToStorage = async () => {
      try {
        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        } else {
          await AsyncStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Failed to save user data to storage', error);
      }
    };
    
    if (!isLoading) {
      saveUserToStorage();
    }
  }, [user, isLoading]);

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
    // In a real app, you would make an API call here
    // This is a placeholder for demonstration
    setIsLoading(true);
    try {
      // Simulate API call
      const userData = {
        id: '123',
        name: 'Test User',
        email: email,
        token: 'sample-jwt-token'
      };
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password) => {
    // In a real app, you would make an API call here
    setIsLoading(true);
    try {
      // Simulate API call
      const userData = {
        id: '123',
        name: name,
        email: email,
        token: 'sample-jwt-token'
      };
      
      setUser(userData);
      return { success: true };
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
      // Clear user data
      setUser(null);
      return { success: true };
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