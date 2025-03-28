import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';

const ItineraryScreen = ({ navigation, route }) => {
  const { user, preferences } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);

  // Sample itinerary data (in a real app, this would come from an API)
  const sampleItinerary = {
    id: '123',
    title: 'Weekend in San Francisco',
    startDate: '2023-07-15',
    endDate: '2023-07-17',
    location: 'San Francisco, CA',
    days: [
      {
        date: '2023-07-15',
        activities: [
          {
            id: '1',
            time: '09:00 AM',
            title: 'Golden Gate Bridge Visit',
            description: 'Explore the iconic Golden Gate Bridge and take in the stunning views.',
            location: 'Golden Gate Bridge',
            cost: 0,
            weatherDependent: true,
            reservationRequired: false
          },
          {
            id: '2',
            time: '12:30 PM',
            title: 'Lunch at Fisherman\'s Wharf',
            description: 'Enjoy fresh seafood at the famous Fisherman\'s Wharf.',
            location: 'Fisherman\'s Wharf',
            cost: 35,
            weatherDependent: false,
            reservationRequired: true
          },
          {
            id: '3',
            time: '03:00 PM',
            title: 'Alcatraz Island Tour',
            description: 'Take a ferry to Alcatraz Island and tour the historic prison.',
            location: 'Alcatraz Island',
            cost: 45,
            weatherDependent: false,
            reservationRequired: true
          }
        ]
      },
      {
        date: '2023-07-16',
        activities: [
          {
            id: '4',
            time: '10:00 AM',
            title: 'Explore Chinatown',
            description: 'Walk through the oldest Chinatown in North America.',
            location: 'Chinatown',
            cost: 0,
            weatherDependent: false,
            reservationRequired: false
          },
          {
            id: '5',
            time: '01:00 PM',
            title: 'Lunch at Local Restaurant',
            description: 'Try authentic dim sum at a local restaurant.',
            location: 'Chinatown',
            cost: 25,
            weatherDependent: false,
            reservationRequired: false
          },
          {
            id: '6',
            time: '03:30 PM',
            title: 'Visit Museum of Modern Art',
            description: 'Explore contemporary art at SFMOMA.',
            location: 'SFMOMA',
            cost: 25,
            weatherDependent: false,
            reservationRequired: false
          }
        ]
      }
    ],
    totalCost: 130,
    preferences: {
      activityTypes: ['sightseeing', 'food', 'culture'],
      budgetRange: { min: 0, max: 500 },
      travelStyle: 'balanced'
    }
  };

  // Function to generate a new itinerary
  const generateItinerary = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setItinerary(sampleItinerary);
      setLoading(false);
    }, 2000);
  };

  // Render activity item
  const renderActivity = (activity) => (
    <View key={activity.id} style={styles.activityItem}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityTime}>{activity.time}</Text>
        <Text style={styles.activityTitle}>{activity.title}</Text>
      </View>
      <Text style={styles.activityDescription}>{activity.description}</Text>
      <View style={styles.activityDetails}>
        <Text style={styles.activityLocation}>📍 {activity.location}</Text>
        <Text style={styles.activityCost}>💰 ${activity.cost}</Text>
      </View>
      {activity.reservationRequired && (
        <TouchableOpacity style={styles.reserveButton}>
          <Text style={styles.reserveButtonText}>Make Reservation</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render day item
  const renderDay = (day, index) => (
    <View key={day.date} style={styles.dayContainer}>
      <Text style={styles.dayTitle}>Day {index + 1} - {day.date}</Text>
      {day.activities.map(activity => renderActivity(activity))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Personalized Itinerary</Text>
      </View>

      {!itinerary && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No itinerary yet. Generate a personalized itinerary based on your preferences.
          </Text>
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={generateItinerary}
          >
            <Text style={styles.generateButtonText}>Generate Itinerary</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Generating your personalized itinerary...</Text>
        </View>
      )}

      {itinerary && (
        <View style={styles.itineraryContainer}>
          <View style={styles.itineraryHeader}>
            <Text style={styles.itineraryTitle}>{itinerary.title}</Text>
            <Text style={styles.itineraryDates}>
              {itinerary.startDate} to {itinerary.endDate}
            </Text>
            <Text style={styles.itineraryLocation}>📍 {itinerary.location}</Text>
          </View>

          <View style={styles.itinerarySummary}>
            <Text style={styles.summaryTitle}>Trip Summary</Text>
            <Text style={styles.summaryText}>
              Total Cost: ${itinerary.totalCost}
            </Text>
            <Text style={styles.summaryText}>
              Activities: {itinerary.days.reduce((total, day) => total + day.activities.length, 0)}
            </Text>
          </View>

          <View style={styles.daysContainer}>
            {itinerary.days.map((day, index) => renderDay(day, index))}
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Save Itinerary</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
              <Text style={styles.secondaryButtonText}>Modify Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  generateButton: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  generateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  itineraryContainer: {
    padding: 15,
  },
  itineraryHeader: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itineraryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itineraryDates: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  itineraryLocation: {
    fontSize: 16,
    color: '#666',
  },
  itinerarySummary: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  daysContainer: {
    marginBottom: 20,
  },
  dayContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  activityItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  activityTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginRight: 10,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  activityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activityLocation: {
    fontSize: 14,
    color: '#666',
  },
  activityCost: {
    fontSize: 14,
    color: '#666',
  },
  reserveButton: {
    backgroundColor: '#4a90e2',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  reserveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4a90e2',
    marginRight: 0,
    marginLeft: 10,
  },
  secondaryButtonText: {
    color: '#4a90e2',
    fontWeight: 'bold',
  },
});

export default ItineraryScreen;