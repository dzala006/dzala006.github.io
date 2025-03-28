import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { scheduleNotification } from '../utils/notifications';

/**
 * CollaborativeItineraryScreen Component
 * 
 * This screen allows users to create a joint itinerary with another user
 * by merging their preferences and generating a collaborative adventure.
 */
const CollaborativeItineraryScreen = ({ navigation }) => {
  const { user, preferences } = useContext(AuthContext);
  
  // State variables
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerUser, setPartnerUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mergedPreferences, setMergedPreferences] = useState(null);
  const [collaborativeItinerary, setCollaborativeItinerary] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  
  // Load user's contacts on component mount
  useEffect(() => {
    // In a real app, this would fetch from an API or local storage
    // For demo purposes, we'll use dummy data
    const dummyContacts = [
      { id: '1', name: 'Alex Johnson', email: 'alex@example.com' },
      { id: '2', name: 'Jamie Smith', email: 'jamie@example.com' },
      { id: '3', name: 'Taylor Wilson', email: 'taylor@example.com' },
      { id: '4', name: 'Jordan Lee', email: 'jordan@example.com' },
    ];
    
    setContacts(dummyContacts);
  }, []);
  
  // Function to search for a user by email
  const searchUser = () => {
    if (!partnerEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }
    
    setIsSearching(true);
    
    // In a real app, this would be an API call
    // For demo purposes, we'll simulate an API response
    setTimeout(() => {
      // Check if the email matches any of our dummy contacts
      const foundContact = contacts.find(contact => 
        contact.email.toLowerCase() === partnerEmail.toLowerCase()
      );
      
      if (foundContact) {
        setPartnerUser({
          id: foundContact.id,
          name: foundContact.name,
          email: foundContact.email,
          preferences: {
            activityTypes: ['hiking', 'museums', 'food'],
            budgetRange: { min: 50, max: 200 },
            travelStyle: 'adventurous',
            accessibility: true,
            dietaryRestrictions: ['vegetarian']
          }
        });
        
        // Once we have both users, merge their preferences
        mergePreferences(preferences, {
          activityTypes: ['hiking', 'museums', 'food'],
          budgetRange: { min: 50, max: 200 },
          travelStyle: 'adventurous',
          accessibility: true,
          dietaryRestrictions: ['vegetarian']
        });

        // Send a notification that a partner has been found
        scheduleNotification({
          title: 'Partner Found',
          message: `${foundContact.name} has been added as your adventure partner!`,
          triggerTime: null // Send immediately
        });
      } else {
        Alert.alert('User Not Found', 'No user found with that email address');
        setPartnerUser(null);
      }
      
      setIsSearching(false);
    }, 1500);
  };
  
  // Function to select a contact from the list
  const selectContact = (contact) => {
    setPartnerEmail(contact.email);
    setPartnerUser({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      preferences: {
        activityTypes: ['hiking', 'museums', 'food'],
        budgetRange: { min: 50, max: 200 },
        travelStyle: 'adventurous',
        accessibility: true,
        dietaryRestrictions: ['vegetarian']
      }
    });
    
    // Merge preferences
    mergePreferences(preferences, {
      activityTypes: ['hiking', 'museums', 'food'],
      budgetRange: { min: 50, max: 200 },
      travelStyle: 'adventurous',
      accessibility: true,
      dietaryRestrictions: ['vegetarian']
    });
    
    setShowContacts(false);

    // Send a notification that a partner has been selected
    scheduleNotification({
      title: 'Partner Selected',
      message: `${contact.name} has been added as your adventure partner!`,
      triggerTime: null // Send immediately
    });
  };
  
  // Function to merge user preferences
  const mergePreferences = (userPrefs, partnerPrefs) => {
    // Find common activity types
    const commonActivities = userPrefs.activityTypes.filter(
      activity => partnerPrefs.activityTypes.includes(activity)
    );
    
    // If no common activities, include all from both users
    const mergedActivities = commonActivities.length > 0 
      ? commonActivities 
      : [...new Set([...userPrefs.activityTypes, ...partnerPrefs.activityTypes])];
    
    // Merge budget ranges
    const mergedBudget = {
      min: Math.max(userPrefs.budgetRange.min, partnerPrefs.budgetRange.min),
      max: Math.min(userPrefs.budgetRange.max, partnerPrefs.budgetRange.max)
    };
    
    // If max < min after merging, take the average of all values
    if (mergedBudget.max < mergedBudget.min) {
      const avgMin = (userPrefs.budgetRange.min + partnerPrefs.budgetRange.min) / 2;
      const avgMax = (userPrefs.budgetRange.max + partnerPrefs.budgetRange.max) / 2;
      mergedBudget.min = avgMin;
      mergedBudget.max = avgMax;
    }
    
    // Balance travel styles
    let mergedTravelStyle = 'balanced';
    if (userPrefs.travelStyle === partnerPrefs.travelStyle) {
      mergedTravelStyle = userPrefs.travelStyle;
    } else if (
      (userPrefs.travelStyle === 'adventurous' && partnerPrefs.travelStyle === 'relaxed') ||
      (userPrefs.travelStyle === 'relaxed' && partnerPrefs.travelStyle === 'adventurous')
    ) {
      mergedTravelStyle = 'balanced';
    }
    
    // Respect accessibility needs
    const mergedAccessibility = userPrefs.accessibility || partnerPrefs.accessibility;
    
    // Combine dietary restrictions
    const mergedDietaryRestrictions = [
      ...new Set([...userPrefs.dietaryRestrictions, ...partnerPrefs.dietaryRestrictions])
    ];
    
    // Set the merged preferences
    const merged = {
      activityTypes: mergedActivities,
      budgetRange: mergedBudget,
      travelStyle: mergedTravelStyle,
      accessibility: mergedAccessibility,
      dietaryRestrictions: mergedDietaryRestrictions
    };
    
    setMergedPreferences(merged);
  };
  
  // Function to generate a collaborative itinerary
  const generateCollaborativeItinerary = () => {
    if (!partnerUser || !mergedPreferences) {
      Alert.alert('Error', 'Please select a partner first');
      return;
    }
    
    setIsGenerating(true);
    
    // In a real app, this would be an API call to the backend
    // For demo purposes, we'll simulate an API response
    setTimeout(() => {
      // Sample collaborative itinerary
      const itinerary = {
        id: 'collab-123',
        title: `Joint Adventure with ${partnerUser.name}`,
        startDate: '2023-08-10',
        endDate: '2023-08-12',
        location: 'Portland, OR',
        participants: [
          { id: user.id, name: user.name },
          { id: partnerUser.id, name: partnerUser.name }
        ],
        days: [
          {
            date: '2023-08-10',
            activities: [
              {
                id: '1',
                time: '10:00 AM',
                title: 'Portland Japanese Garden',
                description: 'Explore the beautiful and tranquil Japanese Garden together.',
                location: 'Portland Japanese Garden',
                cost: 20,
                weatherDependent: true,
                reservationStatus: 'Confirmed',
                suitableFor: 'Both'
              },
              {
                id: '2',
                time: '01:00 PM',
                title: 'Lunch at Food Carts',
                description: 'Enjoy Portland\'s famous food cart scene with options for all dietary needs.',
                location: 'Downtown Food Carts',
                cost: 15,
                weatherDependent: false,
                reservationStatus: 'Not Required',
                suitableFor: 'Both'
              },
              {
                id: '3',
                time: '03:30 PM',
                title: 'Powell\'s Books',
                description: 'Visit the world\'s largest independent bookstore.',
                location: 'Powell\'s City of Books',
                cost: 0,
                weatherDependent: false,
                reservationStatus: 'Not Required',
                suitableFor: 'Both'
              }
            ]
          },
          {
            date: '2023-08-11',
            activities: [
              {
                id: '4',
                time: '09:00 AM',
                title: 'Hiking in Forest Park',
                description: 'Enjoy a moderate hike through one of America\'s largest urban forests.',
                location: 'Forest Park',
                cost: 0,
                weatherDependent: true,
                reservationStatus: 'Not Required',
                suitableFor: partnerUser.name
              },
              {
                id: '5',
                time: '02:00 PM',
                title: 'Portland Art Museum',
                description: 'Explore the diverse collection at Portland\'s premier art museum.',
                location: 'Portland Art Museum',
                cost: 25,
                weatherDependent: false,
                reservationStatus: 'Confirmed',
                suitableFor: user.name
              },
              {
                id: '6',
                time: '07:00 PM',
                title: 'Dinner at Farm-to-Table Restaurant',
                description: 'Enjoy sustainable, local cuisine with vegetarian options.',
                location: 'Farm Spirit',
                cost: 80,
                weatherDependent: false,
                reservationStatus: 'Pending',
                suitableFor: 'Both'
              }
            ]
          }
        ],
        totalCost: 140,
        mergedPreferences: mergedPreferences
      };
      
      setCollaborativeItinerary(itinerary);
      setIsGenerating(false);

      // Send a notification that the itinerary has been generated
      scheduleNotification({
        title: 'Collaborative Itinerary Ready',
        message: `Your joint adventure with ${partnerUser.name} has been created!`,
        data: { screen: 'CollaborativeItinerary' },
        triggerTime: null // Send immediately
      });
    }, 2500);
  };
  
  // Function to confirm the itinerary
  const confirmItinerary = () => {
    // In a real app, this would save the itinerary to both user profiles
    
    // Send a notification to both users that the itinerary has been confirmed
    scheduleNotification({
      title: 'Itinerary Confirmed',
      message: `Your joint adventure with ${partnerUser.name} has been confirmed!`,
      data: { 
        screen: 'Itinerary',
        action: 'view_collaborative',
        itineraryId: 'collab-123'
      },
      triggerTime: null // Send immediately
    });

    // In a real app, we would also send a notification to the partner
    // For demo purposes, we'll just show an alert
    Alert.alert(
      'Itinerary Confirmed',
      'Your collaborative itinerary has been saved to both profiles!',
      [
        { 
          text: 'OK', 
          onPress: () => navigation.navigate('Home')
        }
      ]
    );
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
      <View style={styles.activityFooter}>
        <Text style={[
          styles.reservationText,
          activity.reservationStatus === 'Confirmed' ? styles.confirmedText :
          activity.reservationStatus === 'Pending' ? styles.pendingText :
          styles.notRequiredText
        ]}>
          🎫 {activity.reservationStatus}
        </Text>
        {activity.suitableFor !== 'Both' && (
          <Text style={styles.suitableForText}>
            👤 Preferred by: {activity.suitableFor}
          </Text>
        )}
      </View>
    </View>
  );
  
  // Render day item
  const renderDay = (day, index) => (
    <View key={day.date} style={styles.dayContainer}>
      <Text style={styles.dayTitle}>Day {index + 1} - {day.date}</Text>
      {day.activities.map(activity => renderActivity(activity))}
    </View>
  );
  
  // Render contact item
  const renderContactItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.contactItem}
      onPress={() => selectContact(item)}
    >
      <Text style={styles.contactName}>{item.name}</Text>
      <Text style={styles.contactEmail}>{item.email}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collaborative Adventure</Text>
      </View>
      
      {/* Partner Selection Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite a Partner</Text>
        <Text style={styles.sectionDescription}>
          Create a joint itinerary by inviting someone to plan with you.
          We'll merge your preferences to create the perfect shared adventure!
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter partner's email"
            value={partnerEmail}
            onChangeText={setPartnerEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={searchUser}
            disabled={isSearching}
          >
            <Text style={styles.searchButtonText}>
              {isSearching ? 'Searching...' : 'Search'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.contactsButton}
          onPress={() => setShowContacts(!showContacts)}
        >
          <Text style={styles.contactsButtonText}>
            {showContacts ? 'Hide Contacts' : 'Select from Contacts'}
          </Text>
        </TouchableOpacity>
        
        {showContacts && (
          <View style={styles.contactsContainer}>
            <FlatList
              data={contacts}
              renderItem={renderContactItem}
              keyExtractor={item => item.id}
              style={styles.contactsList}
            />
          </View>
        )}
      </View>
      
      {/* Partner Info Section */}
      {partnerUser && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partner Selected</Text>
          <View style={styles.partnerCard}>
            <Text style={styles.partnerName}>{partnerUser.name}</Text>
            <Text style={styles.partnerEmail}>{partnerUser.email}</Text>
          </View>
        </View>
      )}
      
      {/* Merged Preferences Section */}
      {mergedPreferences && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Merged Preferences</Text>
          <View style={styles.preferencesCard}>
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Activities:</Text>
              <Text style={styles.preferenceValue}>
                {mergedPreferences.activityTypes.join(', ')}
              </Text>
            </View>
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Budget Range:</Text>
              <Text style={styles.preferenceValue}>
                ${Math.round(mergedPreferences.budgetRange.min)} - ${Math.round(mergedPreferences.budgetRange.max)}
              </Text>
            </View>
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Travel Style:</Text>
              <Text style={styles.preferenceValue}>
                {mergedPreferences.travelStyle.charAt(0).toUpperCase() + mergedPreferences.travelStyle.slice(1)}
              </Text>
            </View>
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Accessibility Needed:</Text>
              <Text style={styles.preferenceValue}>
                {mergedPreferences.accessibility ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Dietary Restrictions:</Text>
              <Text style={styles.preferenceValue}>
                {mergedPreferences.dietaryRestrictions.length > 0 
                  ? mergedPreferences.dietaryRestrictions.join(', ') 
                  : 'None'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={generateCollaborativeItinerary}
            disabled={isGenerating}
          >
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating...' : 'Generate Collaborative Itinerary'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Loading Indicator */}
      {isGenerating && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>
            Creating your perfect joint adventure...
          </Text>
        </View>
      )}
      
      {/* Collaborative Itinerary Display */}
      {collaborativeItinerary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Collaborative Itinerary</Text>
          
          <View style={styles.itineraryHeader}>
            <Text style={styles.itineraryTitle}>{collaborativeItinerary.title}</Text>
            <Text style={styles.itineraryDates}>
              {collaborativeItinerary.startDate} to {collaborativeItinerary.endDate}
            </Text>
            <Text style={styles.itineraryLocation}>
              📍 {collaborativeItinerary.location}
            </Text>
          </View>
          
          <View style={styles.participantsContainer}>
            <Text style={styles.participantsTitle}>Participants:</Text>
            {collaborativeItinerary.participants.map(participant => (
              <Text key={participant.id} style={styles.participantName}>
                • {participant.name}
              </Text>
            ))}
          </View>
          
          <View style={styles.daysContainer}>
            {collaborativeItinerary.days.map((day, index) => renderDay(day, index))}
          </View>
          
          <View style={styles.summarySectionContainer}>
            <Text style={styles.summaryTitle}>Trip Summary</Text>
            <Text style={styles.summaryText}>
              Total Cost: ${collaborativeItinerary.totalCost} per person
            </Text>
            <Text style={styles.summaryText}>
              Activities: {collaborativeItinerary.days.reduce((total, day) => total + day.activities.length, 0)}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={confirmItinerary}
          >
            <Text style={styles.confirmButtonText}>
              Confirm Itinerary
            </Text>
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
  section: {
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#4a90e2',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  contactsButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4a90e2',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  contactsButtonText: {
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  contactsContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    maxHeight: 200,
  },
  contactsList: {
    padding: 10,
  },
  contactItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactEmail: {
    fontSize: 14,
    color: '#666',
  },
  partnerCard: {
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
  partnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  partnerEmail: {
    fontSize: 14,
    color: '#666',
  },
  preferencesCard: {
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
  preferenceItem: {
    marginBottom: 10,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  preferenceValue: {
    fontSize: 14,
    color: '#666',
  },
  generateButton: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  generateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  itineraryHeader: {
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
  itineraryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itineraryDates: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itineraryLocation: {
    fontSize: 14,
    color: '#666',
  },
  participantsContainer: {
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
  participantsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  participantName: {
    fontSize: 14,
    marginBottom: 5,
  },
  daysContainer: {
    marginBottom: 15,
  },
  dayContainer: {
    marginBottom: 15,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  activityItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    marginBottom: 5,
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
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reservationText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmedText: {
    color: '#5cb85c',
  },
  pendingText: {
    color: '#f0ad4e',
  },
  notRequiredText: {
    color: '#999',
  },
  suitableForText: {
    fontSize: 14,
    color: '#666',
  },
  summarySectionContainer: {
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  confirmButton: {
    backgroundColor: '#5cb85c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CollaborativeItineraryScreen;