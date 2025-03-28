import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../context/AuthContext';

/**
 * FutureItineraryScreen Component
 * 
 * This screen allows users to select a future date and view/manage itineraries
 * planned for that date. It includes real-time updates as the date approaches.
 */
const FutureItineraryScreen = ({ navigation }) => {
  const { user, preferences } = useContext(AuthContext);
  
  // State variables
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Format date for display
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Format date for API requests
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Fetch itinerary data from the backend
  const fetchItinerary = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an actual API call
      // const response = await fetch(`/api/itineraries?date=${formatDateForAPI(selectedDate)}`);
      // const data = await response.json();
      
      // For demo purposes, we'll simulate an API response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if the selected date is within the next 7 days
      const today = new Date();
      const futureDate = new Date(selectedDate);
      const diffTime = futureDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) {
        // Past date
        setItinerary({
          message: "Cannot view itineraries for past dates",
          data: null
        });
      } else if (diffDays <= 7) {
        // Date within next 7 days - show detailed itinerary
        setItinerary({
          id: `future-${formatDateForAPI(selectedDate)}`,
          title: `Adventure on ${formatDate(selectedDate)}`,
          date: formatDate(selectedDate),
          location: "San Francisco, CA",
          weatherForecast: "Sunny, 72°F",
          countdown: `${diffDays} days away`,
          status: "Confirmed",
          activities: [
            {
              id: '1',
              time: '09:00 AM',
              title: 'Golden Gate Park Exploration',
              description: 'Explore the beautiful Golden Gate Park and visit the Japanese Tea Garden.',
              location: 'Golden Gate Park',
              cost: 10,
              weatherDependent: true,
              reservationStatus: 'Confirmed'
            },
            {
              id: '2',
              time: '12:30 PM',
              title: 'Lunch at Local Bistro',
              description: 'Enjoy farm-to-table cuisine at a popular local restaurant.',
              location: 'Hayes Valley',
              cost: 35,
              weatherDependent: false,
              reservationStatus: 'Pending'
            },
            {
              id: '3',
              time: '03:00 PM',
              title: 'Museum of Modern Art',
              description: 'Explore contemporary art exhibits at SFMOMA.',
              location: 'SFMOMA',
              cost: 25,
              weatherDependent: false,
              reservationStatus: 'Not Required'
            }
          ],
          totalCost: 70,
          notes: "Don't forget to bring a light jacket for the evening."
        });
      } else {
        // Date more than 7 days away - show tentative itinerary
        setItinerary({
          id: `future-${formatDateForAPI(selectedDate)}`,
          title: `Planned Adventure on ${formatDate(selectedDate)}`,
          date: formatDate(selectedDate),
          location: "San Francisco, CA",
          weatherForecast: "Forecast not available yet",
          countdown: `${diffDays} days away`,
          status: "Tentative",
          activities: [
            {
              id: '1',
              time: 'Morning',
              title: 'Outdoor Activities',
              description: 'Weather-dependent activities will be finalized closer to the date.',
              location: 'To be determined',
              cost: '15-30',
              weatherDependent: true,
              reservationStatus: 'Not Required'
            },
            {
              id: '2',
              time: 'Afternoon',
              title: 'Cultural Experience',
              description: 'Museum or gallery visit based on current exhibitions.',
              location: 'Downtown',
              cost: '20-25',
              weatherDependent: false,
              reservationStatus: 'To be booked'
            }
          ],
          totalCost: '35-55 (estimated)',
          notes: "This itinerary will be updated as the date approaches with more specific activities and times."
        });
      }
    } catch (err) {
      console.error('Error fetching itinerary:', err);
      setError('Failed to load itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Handle date change from the date picker
  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  // Set up polling for real-time updates
  useEffect(() => {
    // Fetch itinerary when the selected date changes
    fetchItinerary();
    
    // Clear any existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    // Calculate how often to refresh based on how far in the future the date is
    const today = new Date();
    const futureDate = new Date(selectedDate);
    const diffTime = futureDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let intervalTime;
    if (diffDays <= 1) {
      // Less than 1 day away: refresh every 15 minutes
      intervalTime = 15 * 60 * 1000;
    } else if (diffDays <= 3) {
      // 1-3 days away: refresh every hour
      intervalTime = 60 * 60 * 1000;
    } else if (diffDays <= 7) {
      // 3-7 days away: refresh every 3 hours
      intervalTime = 3 * 60 * 60 * 1000;
    } else {
      // More than 7 days away: refresh every 12 hours
      intervalTime = 12 * 60 * 60 * 1000;
    }
    
    // For demo purposes, use a shorter interval (30 seconds)
    const demoIntervalTime = 30 * 1000;
    
    // Set up the new interval
    const interval = setInterval(() => {
      fetchItinerary();
    }, demoIntervalTime);
    
    setRefreshInterval(interval);
    
    // Clean up the interval when the component unmounts
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedDate, fetchItinerary]);

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
      <View style={styles.reservationStatus}>
        <Text style={[
          styles.reservationText,
          activity.reservationStatus === 'Confirmed' ? styles.confirmedText :
          activity.reservationStatus === 'Pending' ? styles.pendingText :
          styles.notRequiredText
        ]}>
          🎫 Reservation: {activity.reservationStatus}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Future Itinerary Planner</Text>
      </View>
      
      {/* Date Selection Section */}
      <View style={styles.dateSelectionContainer}>
        <Text style={styles.sectionTitle}>Select a Future Date</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {formatDate(selectedDate)}
          </Text>
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchItinerary}
        >
          <Text style={styles.refreshButtonText}>Refresh Itinerary</Text>
        </TouchableOpacity>
      </View>
      
      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Loading itinerary...</Text>
        </View>
      )}
      
      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchItinerary}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Itinerary Display */}
      {!loading && !error && itinerary && (
        <View style={styles.itineraryContainer}>
          {itinerary.data === null ? (
            <Text style={styles.noDataText}>{itinerary.message}</Text>
          ) : (
            <>
              <View style={styles.itineraryHeader}>
                <Text style={styles.itineraryTitle}>{itinerary.title}</Text>
                <Text style={styles.itineraryDate}>{itinerary.date}</Text>
                <Text style={styles.itineraryLocation}>📍 {itinerary.location}</Text>
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownText}>{itinerary.countdown}</Text>
                  <Text style={[
                    styles.statusText,
                    itinerary.status === 'Confirmed' ? styles.confirmedStatus : styles.tentativeStatus
                  ]}>
                    Status: {itinerary.status}
                  </Text>
                </View>
              </View>
              
              <View style={styles.weatherContainer}>
                <Text style={styles.weatherTitle}>Weather Forecast</Text>
                <Text style={styles.weatherText}>{itinerary.weatherForecast}</Text>
              </View>
              
              <View style={styles.activitiesContainer}>
                <Text style={styles.activitiesTitle}>Planned Activities</Text>
                {itinerary.activities.map(activity => renderActivity(activity))}
              </View>
              
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Trip Summary</Text>
                <Text style={styles.summaryText}>Total Cost: ${itinerary.totalCost}</Text>
                <Text style={styles.notesText}>Notes: {itinerary.notes}</Text>
              </View>
              
              <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Save Itinerary</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
                  <Text style={styles.secondaryButtonText}>Modify Preferences</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  dateSelectionContainer: {
    padding: 20,
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  dateButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#5cb85c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    margin: 15,
    backgroundColor: '#fff0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#d9534f',
    marginBottom: 15,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#d9534f',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: 100,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  itineraryContainer: {
    margin: 15,
  },
  itineraryHeader: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itineraryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  itineraryDate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  itineraryLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  confirmedStatus: {
    backgroundColor: '#dff0d8',
    color: '#3c763d',
  },
  tentativeStatus: {
    backgroundColor: '#fcf8e3',
    color: '#8a6d3b',
  },
  weatherContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  weatherTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  weatherText: {
    fontSize: 16,
    color: '#666',
  },
  activitiesContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activitiesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  activityItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  activityHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  activityTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginRight: 10,
    width: 80,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  activityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activityLocation: {
    fontSize: 14,
    color: '#666',
  },
  activityCost: {
    fontSize: 14,
    color: '#666',
  },
  reservationStatus: {
    marginTop: 5,
  },
  reservationText: {
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  confirmedText: {
    backgroundColor: '#dff0d8',
    color: '#3c763d',
  },
  pendingText: {
    backgroundColor: '#fcf8e3',
    color: '#8a6d3b',
  },
  notRequiredText: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
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
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4a90e2',
    marginLeft: 10,
    marginRight: 0,
  },
  secondaryButtonText: {
    color: '#4a90e2',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FutureItineraryScreen;