import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import FeedbackPopup from '../components/FeedbackPopup';
import { scheduleNotification, sendWelcomeNotification } from '../utils/notifications';
import { getTimeBasedGreeting, shouldShowFeedback } from '../utils/homeScreenHelper';

const HomeScreen = ({ navigation }) => {
  const { user, preferences, updateSurveyData, surveyData } = useContext(AuthContext);
  
  const [showFeedback, setShowFeedback] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    sendWelcomeNotification();
  }, []);

  const updateUserFeedback = (feedbackData) => {
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

    scheduleNotification({
      title: 'Preferences Updated',
      message: 'Your adventure preferences have been updated based on your feedback.',
      data: { screen: 'Profile' },
      triggerTime: 2
    });

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
          onPress: () => {
            navigation.navigate('Itinerary', { regenerate: true });
            
            scheduleNotification({
              title: 'Itinerary Regenerated',
              message: 'Your itinerary has been updated based on your new preferences.',
              data: { screen: 'Itinerary', action: 'view_regenerated' },
              triggerTime: 5
            });
          }
        }
      ]
    );
  };

  const simulateItineraryUpdate = () => {
    scheduleNotification({
      title: 'Itinerary Update',
      message: 'Weather alert: We\'ve adjusted your afternoon activities due to expected rain.',
      data: { screen: 'Itinerary', action: 'view_updated' },
      triggerTime: null
    });

    Alert.alert(
      "Itinerary Updated",
      "We've adjusted your afternoon activities due to expected rain. Check your itinerary for details.",
      [
        { 
          text: "View Changes", 
          onPress: () => navigation.navigate('Itinerary', { viewChanges: true })
        },
        {
          text: "Later",
          style: "cancel"
        }
      ]
    );
  };

  useEffect(() => {
    const lastFeedback = surveyData && surveyData.responses ? 
      Object.values(surveyData.responses).sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )[0] : null;
    
    if (shouldShowFeedback(lastFeedback, 0.5)) {
      timerRef.current = setInterval(() => {
        setShowFeedback(true);
      }, 30000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [surveyData]);

  const greeting = getTimeBasedGreeting(user ? user.name : null);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subtitle}>Ready for your next adventure?</Text>
      </View>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan Together</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Collaborative Adventure</Text>
          <Text style={styles.cardText}>
            Create a joint itinerary with friends or family that balances everyone's preferences.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('CollaborativeItinerary')}
          >
            <Text style={styles.buttonText}>Start Planning</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Future Plans</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Plan Ahead</Text>
          <Text style={styles.cardText}>
            Create itineraries for future dates that update as the day approaches.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('FutureItinerary')}
          >
            <Text style={styles.buttonText}>Plan Future Trip</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.updateButton}
          onPress={simulateItineraryUpdate}
        >
          <Text style={styles.updateButtonText}>Simulate Itinerary Update</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Complete Your Profile</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileButtonText}>Update Preferences</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.feedbackButton}
          onPress={() => setShowFeedback(true)}
        >
          <Text style={styles.feedbackButtonText}>Give Feedback</Text>
        </TouchableOpacity>
      </View>

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
  updateButton: {
    backgroundColor: '#f0ad4e',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  updateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HomeScreen;