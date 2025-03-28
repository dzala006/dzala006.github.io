import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import FeedbackPopup from '../components/FeedbackPopup';
import { scheduleNotification, addNotificationListener, removeNotificationListener } from '../utils/notifications';

const HomeScreen = ({ navigation }) => {
  const { user, preferences, updateSurveyData } = useContext(AuthContext);
  
  // State to control the visibility of the FeedbackPopup
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Reference to store the timer
  const timerRef = useRef(null);
  
  // Reference to store notification listener
  const notificationListenerRef = useRef(null);

  // Function to handle feedback submission
  const updateUserFeedback = (feedbackData) => {
    // Update the global state with the new feedback
    updateSurveyData({
      responses: {
        [feedbackData.questionId]: {
          questionId: feedbackData.questionId,
          response: feedbackData.response,
          context: feedbackData.context,
          timestamp: new Date().toISOString()
        }
      }
    });

    // Schedule a notification to inform the user that their preferences have been updated
    scheduleNotification({
      title: 'Preferences Updated',
      message: 'Your adventure preferences have been updated based on your feedback!',
      data: { screen: 'Itinerary', action: 'regenerate' },
      triggerTime: 5 // Show notification after 5 seconds
    });

    // Optionally trigger a re-generation of the itinerary
    Alert.alert(
      "Feedback Applied",
      "Your preferences have been updated. Would you like to regenerate your itinerary?",
      [
        {
          text: "Not Now",
          style: "cancel"
        },
        { 
          text: "Yes", 
          onPress: () => navigation.navigate('Itinerary', { regenerate: true })
        }
      ]
    );
  };

  // Set up a timer to show the feedback popup at regular intervals
  useEffect(() => {
    // Show feedback popup every 30 minutes (1800000 ms)
    // For testing purposes, we're using a shorter interval (30 seconds = 30000 ms)
    timerRef.current = setInterval(() => {
      setShowFeedback(true);
    }, 30000);

    // Set up notification listener
    notificationListenerRef.current = addNotificationListener(notification => {
      console.log('Notification received:', notification);
      
      // Handle notification based on its data
      const data = notification.request.content.data;
      if (data && data.screen) {
        // Navigate to the specified screen if the app is in the foreground
        navigation.navigate(data.screen, data.action ? { action: data.action } : {});
      }
    });

    // Request initial notification permissions
    scheduleNotification({
      title: 'Welcome to Personalized Adventure',
      message: 'Your adventure companion is ready to help you plan amazing experiences!',
      triggerTime: null // Send immediately
    });

    // Clean up the timer and notification listener when the component unmounts
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (notificationListenerRef.current) {
        removeNotificationListener(notificationListenerRef.current);
      }
    };
  }, []);

  // Function to handle real-time itinerary updates
  const handleItineraryUpdate = () => {
    // In a real app, this would be triggered by a backend event
    // For demo purposes, we'll simulate an update
    scheduleNotification({
      title: 'Itinerary Update',
      message: 'Your itinerary has been updated with new recommendations based on weather changes!',
      data: { screen: 'Itinerary', action: 'view_updates' },
      triggerTime: null // Send immediately
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user ? user.name : 'Guest'}!</Text>
        <Text style={styles.subtitle}>Ready for your next adventure?</Text>
      </View>

      {/* Upcoming Adventures Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Upcoming Adventures</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No upcoming adventures</Text>
          <Text style={styles.cardText}>
            Create your first personalized itinerary to get started!
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Itinerary')}
          >
            <Text style={styles.buttonText}>Create Itinerary</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recommendations Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended For You</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekend Getaway</Text>
          <Text style={styles.cardText}>
            Based on your preferences, we've curated a perfect weekend escape.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Itinerary')}
          >
            <Text style={styles.buttonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Collaborative Planning Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan Together</Text>
        <TouchableOpacity 
          style={styles.collaborativeButton}
          onPress={() => navigation.navigate('CollaborativeItinerary')}
        >
          <Text style={styles.collaborativeButtonText}>Create Joint Adventure</Text>
        </TouchableOpacity>
      </View>

      {/* Future Planning Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan Ahead</Text>
        <TouchableOpacity 
          style={styles.futureButton}
          onPress={() => navigation.navigate('FutureItinerary')}
        >
          <Text style={styles.futureButtonText}>Future Itineraries</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Complete Your Profile</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileButtonText}>Update Preferences</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Button */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.feedbackButton}
          onPress={() => setShowFeedback(true)}
        >
          <Text style={styles.feedbackButtonText}>Give Feedback</Text>
        </TouchableOpacity>
      </View>

      {/* Test Notification Button (for development purposes) */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={handleItineraryUpdate}
        >
          <Text style={styles.testButtonText}>Simulate Itinerary Update</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Popup Component */}
      <FeedbackPopup
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={updateUserFeedback}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#4a90e2',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#4a90e2',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  profileButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  profileButtonText: {
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  feedbackButton: {
    backgroundColor: '#5cb85c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  collaborativeButton: {
    backgroundColor: '#9c27b0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  collaborativeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  futureButton: {
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  futureButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HomeScreen;