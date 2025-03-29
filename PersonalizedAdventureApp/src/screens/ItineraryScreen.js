import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useWebSocket, usePolling, fetchItineraryUpdates, UPDATE_TYPES } from '../utils/realTimeUpdates';
import { scheduleNotification } from '../utils/notifications';

const ItineraryScreen = ({ navigation, route }) => {
  const { user, preferences } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [updatedActivities, setUpdatedActivities] = useState([]);
  
  const { 
    data: wsData, 
    isConnected: wsConnected 
  } = useWebSocket('wss://api.personalizedadventure.com/updates', {}, !!itinerary);
  
  const { 
    data: pollingData, 
    loading: pollingLoading, 
    error: pollingError,
    refetch: refetchItinerary
  } = usePolling(
    () => fetchItineraryUpdates(itinerary?.id || 'current'),
    60000,
    !!itinerary
  );
  
  useEffect(() => {
    if (wsData) {
      console.log('WebSocket update received:', wsData);
      
      if (wsData.type === UPDATE_TYPES.WEATHER) {
        handleWeatherUpdate(wsData.data);
      } else if (wsData.type === UPDATE_TYPES.EVENT) {
        handleEventUpdate(wsData.data);
      } else if (wsData.type === UPDATE_TYPES.RESERVATION) {
        handleReservationUpdate(wsData.data);
      }
    }
  }, [wsData]);
  
  useEffect(() => {
    if (pollingData) {
      console.log('Polling update received:', pollingData);
      
      if (pollingData.update) {
        if (pollingData.update.type === 'weather_change') {
          handleWeatherUpdate({
            forecast: pollingData.update.description,
            affectedActivities: pollingData.update.affectedActivities,
            alternativeActivities: pollingData.update.alternativeActivities
          });
        } else if (pollingData.update.type === 'new_event') {
          handleEventUpdate({
            eventName: pollingData.update.event.title,
            description: pollingData.update.event.description,
            location: pollingData.update.event.location,
            time: pollingData.update.event.time,
            event: pollingData.update.event
          });
        }
      }
    }
  }, [pollingData]);
  
  useEffect(() => {
    if (route.params) {
      if (route.params.weatherUpdate) {
        handleWeatherUpdate({ 
          forecast: 'Rain expected in the afternoon',
          affectedActivities: route.params.affectedActivities || []
        });
      }
      
      if (route.params.newEvent) {
        handleEventUpdate(route.params.newEvent);
      }
      
      if (route.params.reservationUpdate) {
        handleReservationUpdate(route.params.reservationUpdate);
      }
      
      if (route.params.regenerate) {
        generateItinerary();
      }
      
      if (route.params.viewChanges) {
        setUpdatedActivities(['activity_2', 'activity_4']);
      }
    }
  }, [route.params]);
  
  const handleWeatherUpdate = (weatherData) => {
    if (!itinerary) return;
    
    if (weatherData.affectedActivities && weatherData.affectedActivities.length > 0) {
      setUpdatedActivities(prev => [...prev, ...weatherData.affectedActivities]);
      
      Alert.alert(
        "Weather Update",
        `${weatherData.forecast} Some activities may be affected.`,
        [
          {
            text: "View Alternatives",
            onPress: () => {
              console.log("Show alternatives for", weatherData.affectedActivities);
            }
          },
          {
            text: "OK",
            style: "cancel"
          }
        ]
      );
    }
  };
  
  const handleEventUpdate = (eventData) => {
    if (!itinerary) return;
    
    Alert.alert(
      "New Event Nearby",
      `${eventData.eventName} at ${eventData.location}\n${eventData.description}`,
      [
        {
          text: "Add to Itinerary",
          onPress: () => {
            console.log("Add event to itinerary", eventData);
            
            const updatedItinerary = { ...itinerary };
            if (updatedItinerary.days && updatedItinerary.days.length > 0) {
              const newActivity = {
                id: `event_${Date.now()}`,
                time: eventData.time || '7:00 PM',
                title: eventData.eventName,
                description: eventData.description,
                location: eventData.location,
                cost: eventData.event?.cost || 0,
                weatherDependent: eventData.event?.weatherDependent || true,
                reservationRequired: eventData.event?.reservationRequired || false,
                isNew: true
              };
              
              updatedItinerary.days[0].activities.push(newActivity);
              setItinerary(updatedItinerary);
              setUpdatedActivities(prev => [...prev, newActivity.id]);
              
              scheduleNotification({
                title: 'Event Added',
                message: `${eventData.eventName} has been added to your itinerary`,
                data: { screen: 'Itinerary' },
                triggerTime: 2
              });
            }
          }
        },
        {
          text: "Ignore",
          style: "cancel"
        }
      ]
    );
  };
  
  const handleReservationUpdate = (reservationData) => {
    if (!itinerary) return;
    
    Alert.alert(
      "Reservation Update",
      reservationData.notes,
      [
        {
          text: "View Details",
          onPress: () => {
            console.log("View reservation details", reservationData);
          }
        },
        {
          text: "OK",
          style: "default"
        }
      ]
    );
    
    if (reservationData.activityId) {
      const updatedItinerary = { ...itinerary };
      let activityUpdated = false;
      
      updatedItinerary.days.forEach(day => {
        day.activities.forEach(activity => {
          if (activity.id === reservationData.activityId) {
            activity.reservationStatus = reservationData.status;
            activity.reservationId = reservationData.reservationId;
            activity.reservationTime = reservationData.time;
            activityUpdated = true;
          }
        });
      });
      
      if (activityUpdated) {
        setItinerary(updatedItinerary);
        setUpdatedActivities(prev => [...prev, reservationData.activityId]);
      }
    }
  };

  const generateItinerary = () => {
    setLoading(true);
    
    setTimeout(() => {
      setItinerary(sampleItinerary);
      setLoading(false);
      
      setUpdatedActivities([]);
      
      scheduleNotification({
        title: 'Itinerary Generated',
        message: 'Your personalized itinerary is ready to view',
        data: { screen: 'Itinerary' },
        triggerTime: 2
      });
    }, 2000);
  };

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
            id: 'activity_1',
            time: '09:00 AM',
            title: 'Golden Gate Bridge Visit',
            description: 'Explore the iconic Golden Gate Bridge and take in the stunning views.',
            location: 'Golden Gate Bridge',
            cost: 0,
            weatherDependent: true,
            reservationRequired: false
          },
          {
            id: 'activity_2',
            time: '12:30 PM',
            title: 'Lunch at Fisherman\'s Wharf',
            description: 'Enjoy fresh seafood at the famous Fisherman\'s Wharf.',
            location: 'Fisherman\'s Wharf',
            cost: 35,
            weatherDependent: false,
            reservationRequired: true,
            reservationStatus: 'confirmed',
            reservationId: 'RES123'
          },
          {
            id: 'activity_3',
            time: '03:00 PM',
            title: 'Alcatraz Island Tour',
            description: 'Take a ferry to Alcatraz Island and tour the historic prison.',
            location: 'Alcatraz Island',
            cost: 45,
            weatherDependent: false,
            reservationRequired: true,
            reservationStatus: 'pending'
          }
        ]
      },
      {
        date: '2023-07-16',
        activities: [
          {
            id: 'activity_4',
            time: '10:00 AM',
            title: 'Explore Chinatown',
            description: 'Walk through the oldest Chinatown in North America.',
            location: 'Chinatown',
            cost: 0,
            weatherDependent: false,
            reservationRequired: false
          },
          {
            id: 'activity_5',
            time: '01:00 PM',
            title: 'Lunch at Local Restaurant',
            description: 'Try authentic dim sum at a local restaurant.',
            location: 'Chinatown',
            cost: 25,
            weatherDependent: false,
            reservationRequired: false
          },
          {
            id: 'activity_6',
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

  const renderActivity = (activity) => {
    const isUpdated = updatedActivities.includes(activity.id);
    const isNew = activity.isNew;
    
    return (
      <View 
        key={activity.id} 
        style={[
          styles.activityItem, 
          isUpdated && styles.updatedActivity,
          isNew && styles.newActivity
        ]}
      >
        <View style={styles.activityHeader}>
          <Text style={styles.activityTime}>{activity.time}</Text>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          {isUpdated && <Text style={styles.updateBadge}>Updated</Text>}
          {isNew && <Text style={styles.newBadge}>New</Text>}
        </View>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        <View style={styles.activityDetails}>
          <Text style={styles.activityLocation}>📍 {activity.location}</Text>
          <Text style={styles.activityCost}>💰 ${activity.cost}</Text>
        </View>
        {activity.reservationRequired && (
          <View>
            {activity.reservationStatus ? (
              <View style={[
                styles.reservationStatus,
                activity.reservationStatus === 'confirmed' && styles.confirmedStatus,
                activity.reservationStatus === 'pending' && styles.pendingStatus,
                activity.reservationStatus === 'cancelled' && styles.cancelledStatus
              ]}>
                <Text style={styles.reservationStatusText}>
                  Reservation: {activity.reservationStatus}
                </Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.reserveButton}>
                <Text style={styles.reserveButtonText}>Make Reservation</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderDay = (day, index) => (
    <View key={day.date} style={styles.dayContainer}>
      <Text style={styles.dayTitle}>Day {index + 1} - {day.date}</Text>
      {day.activities.map(activity => renderActivity(activity))}
    </View>
  );

  const renderConnectionStatus = () => {
    if (!itinerary) return null;
    
    return (
      <View style={styles.connectionStatus}>
        <Text style={styles.connectionStatusText}>
          {wsConnected ? '🟢 Live updates active' : '🔴 Live updates inactive'}
        </Text>
        {pollingLoading && (
          <ActivityIndicator size="small" color="#4a90e2" style={{ marginLeft: 10 }} />
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Personalized Itinerary</Text>
      </View>

      {renderConnectionStatus()}

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
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                Alert.alert("Itinerary Saved", "Your itinerary has been saved successfully.");
              }}
            >
              <Text style={styles.actionButtonText}>Save Itinerary</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.secondaryButtonText}>Modify Preferences</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refetchItinerary}
          >
            <Text style={styles.refreshButtonText}>Check for Updates</Text>
          </TouchableOpacity>
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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    margin: 10,
  },
  connectionStatusText: {
    fontSize: 14,
    color: '#666',
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
  updatedActivity: {
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#f0ad4e',
  },
  newActivity: {
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4a90e2',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    flexWrap: 'wrap',
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
    flex: 1,
  },
  updateBadge: {
    backgroundColor: '#f0ad4e',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
    marginLeft: 10,
  },
  newBadge: {
    backgroundColor: '#4a90e2',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
    marginLeft: 10,
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
  reservationStatus: {
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#f0f0f0',
  },
  confirmedStatus: {
    backgroundColor: '#dff0d8',
    borderColor: '#5cb85c',
    borderWidth: 1,
  },
  pendingStatus: {
    backgroundColor: '#fcf8e3',
    borderColor: '#f0ad4e',
    borderWidth: 1,
  },
  cancelledStatus: {
    backgroundColor: '#f2dede',
    borderColor: '#d9534f',
    borderWidth: 1,
  },
  reservationStatusText: {
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  refreshButton: {
    backgroundColor: '#5cb85c',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ItineraryScreen;