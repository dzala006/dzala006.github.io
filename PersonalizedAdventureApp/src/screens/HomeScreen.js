import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import FeedbackPopup from '../components/FeedbackPopup';

const HomeScreen = ({ navigation }) => {
  const { user, preferences, updateSurveyData } = useContext(AuthContext);
  
  // State to control the visibility of the FeedbackPopup
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Reference to store the timer
  const timerRef = useRef(null);

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

    // Optionally trigger a re-generation of the itinerary
    // This could call an API or update local state
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

    // Clean up the timer when the component unmounts
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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

      {/* Future Plans Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan Ahead</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Future Adventures</Text>
          <Text style={styles.cardText}>
            Plan your adventures for upcoming dates and get real-time updates.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('FutureItinerary')}
          >
            <Text style={styles.buttonText}>Plan Future Trip</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Collaborative Planning Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan Together</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Collaborative Adventure</Text>
          <Text style={styles.cardText}>
            Create a joint itinerary with a friend or family member by merging your preferences.
          </Text>
          <TouchableOpacity 
            style={styles.collaborativeButton}
            onPress={() => navigation.navigate('CollaborativeItinerary')}
          >
            <Text style={styles.buttonText}>Start Collaborative Planning</Text>
          </TouchableOpacity>
        </View>
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
  collaborativeButton: {
    backgroundColor: '#9c27b0', // Purple color for collaborative features
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
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
});

export default HomeScreen;