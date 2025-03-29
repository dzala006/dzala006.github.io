import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import FeedbackPopup from '../components/FeedbackPopup';
import { scheduleNotification, sendWelcomeNotification } from '../utils/notifications';
import { getTimeBasedGreeting, shouldShowFeedback } from '../utils/homeScreenHelper';
import { useWebSocket, UPDATE_TYPES } from '../utils/realTimeUpdates';
import { useTranslation } from 'react-i18next';
import '../utils/i18n';

const HomeScreen = ({ navigation }) => {
  const { user, preferences, updateSurveyData, surveyData } = useContext(AuthContext);
  const { t } = useTranslation();
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const timerRef = useRef(null);

  const { 
    data: wsData, 
    isConnected: wsConnected 
  } = useWebSocket('wss://api.personalizedadventure.com/updates');

  useEffect(() => {
    sendWelcomeNotification();
  }, []);

  useEffect(() => {
    if (wsData) {
      console.log('WebSocket update received in HomeScreen:', wsData);
      
      setRecentUpdates(prev => {
        const newUpdates = [wsData, ...prev].slice(0, 5);
        return newUpdates;
      });
      
      if (wsData.type === UPDATE_TYPES.WEATHER) {
        handleWeatherUpdate(wsData.data);
      } else if (wsData.type === UPDATE_TYPES.EVENT) {
        handleEventUpdate(wsData.data);
      } else if (wsData.type === UPDATE_TYPES.RESERVATION) {
        handleReservationUpdate(wsData.data);
      }
    }
  }, [wsData]);

  const handleWeatherUpdate = (weatherData) => {
    Alert.alert(
      t('home.weatherUpdate'),
      `${weatherData.forecast} ${t('itinerary.weatherAffectedActivities')}`,
      [
        {
          text: t('itinerary.viewChanges'),
          onPress: () => {
            navigation.navigate('Itinerary', { 
              weatherUpdate: true, 
              affectedActivities: weatherData.affectedActivities 
            });
          }
        },
        {
          text: t('common.later'),
          style: "cancel"
        }
      ]
    );
  };
  
  const handleEventUpdate = (eventData) => {
    Alert.alert(
      t('home.newEvent'),
      `${eventData.eventName} at ${eventData.location}\n${eventData.description}`,
      [
        {
          text: t('home.viewDetails'),
          onPress: () => {
            navigation.navigate('Itinerary', { 
              newEvent: eventData
            });
          }
        },
        {
          text: t('common.later'),
          style: "cancel"
        }
      ]
    );
  };
  
  const handleReservationUpdate = (reservationData) => {
    Alert.alert(
      t('home.reservationUpdate'),
      reservationData.notes,
      [
        {
          text: t('home.viewDetails'),
          onPress: () => {
            navigation.navigate('Itinerary', { 
              reservationUpdate: reservationData
            });
          }
        },
        {
          text: t('common.ok'),
          style: "default"
        }
      ]
    );
  };

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
      title: t('notifications.feedbackApplied'),
      message: t('feedback.feedbackApplied'),
      data: { screen: 'Profile' },
      triggerTime: 2
    });

    Alert.alert(
      t('feedback.feedbackApplied'),
      t('feedback.regenerateQuestion'),
      [
        {
          text: t('common.no'),
          style: "cancel"
        },
        { 
          text: t('common.yes'), 
          onPress: () => {
            navigation.navigate('Itinerary', { regenerate: true });
            
            scheduleNotification({
              title: t('itinerary.regenerateSuccess'),
              message: t('itinerary.regenerateSuccess'),
              data: { screen: 'Itinerary', params: { regenerate: true } },
              triggerTime: 5
            });
          }
        }
      ]
    );
  };

  const simulateItineraryUpdate = () => {
    scheduleNotification({
      title: t('notifications.itineraryUpdated'),
      message: t('notifications.weatherChange'),
      data: { screen: 'Itinerary', params: { viewChanges: true } },
      triggerTime: null
    });

    Alert.alert(
      t('itinerary.itineraryUpdated'),
      t('itinerary.weatherAffectedActivities'),
      [
        { 
          text: t('itinerary.viewChanges'), 
          onPress: () => navigation.navigate('Itinerary', { viewChanges: true })
        },
        {
          text: t('common.later'),
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

  const renderRecentUpdates = () => {
    if (recentUpdates.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.recentUpdates')}</Text>
        {recentUpdates.map((update, index) => {
          let title, description, onPress;
          
          if (update.type === UPDATE_TYPES.WEATHER) {
            title = t('home.weatherUpdate');
            description = update.data.forecast;
            onPress = () => navigation.navigate('Itinerary', { 
              weatherUpdate: true, 
              affectedActivities: update.data.affectedActivities 
            });
          } else if (update.type === UPDATE_TYPES.EVENT) {
            title = t('home.newEvent');
            description = `${update.data.eventName} at ${update.data.location}`;
            onPress = () => navigation.navigate('Itinerary', { newEvent: update.data });
          } else if (update.type === UPDATE_TYPES.RESERVATION) {
            title = t('home.reservationUpdate');
            description = update.data.notes;
            onPress = () => navigation.navigate('Itinerary', { reservationUpdate: update.data });
          }
          
          return (
            <TouchableOpacity 
              key={`update-${index}`} 
              style={styles.updateCard}
              onPress={onPress}
              accessible={true}
              accessibilityLabel={`${title}: ${description}`}
              accessibilityHint={t('home.viewDetails')}
            >
              <Text style={styles.updateTitle}>{title}</Text>
              <Text style={styles.updateDescription}>{description}</Text>
              <Text style={styles.updateTime}>{t('home.justNow')}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        {wsConnected && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveIndicatorDot} />
            <Text style={styles.liveIndicatorText}>{t('home.liveUpdates')}</Text>
          </View>
        )}
      </View>

      {renderRecentUpdates()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.upcomingAdventures')}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('home.noUpcomingAdventures')}</Text>
          <Text style={styles.cardText}>
            {t('home.createFirstItinerary')}
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Itinerary')}
            accessible={true}
            accessibilityLabel={t('home.createItinerary')}
            accessibilityHint={t('home.createFirstItinerary')}
          >
            <Text style={styles.buttonText}>{t('home.createItinerary')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.recommendedForYou')}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('home.weekendGetaway')}</Text>
          <Text style={styles.cardText}>
            {t('home.weekendGetawayDesc')}
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Itinerary')}
            accessible={true}
            accessibilityLabel={t('home.viewDetails')}
            accessibilityHint={t('home.weekendGetawayDesc')}
          >
            <Text style={styles.buttonText}>{t('home.viewDetails')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.planTogether')}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('home.collaborativeAdventure')}</Text>
          <Text style={styles.cardText}>
            {t('home.collaborativeAdventureDesc')}
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('CollaborativeItinerary')}
            accessible={true}
            accessibilityLabel={t('home.startPlanning')}
            accessibilityHint={t('home.collaborativeAdventureDesc')}
          >
            <Text style={styles.buttonText}>{t('home.startPlanning')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.futurePlans')}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('home.planAhead')}</Text>
          <Text style={styles.cardText}>
            {t('home.planAheadDesc')}
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('FutureItinerary')}
            accessible={true}
            accessibilityLabel={t('home.planFutureTrip')}
            accessibilityHint={t('home.planAheadDesc')}
          >
            <Text style={styles.buttonText}>{t('home.planFutureTrip')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.updateButton}
          onPress={simulateItineraryUpdate}
          accessible={true}
          accessibilityLabel={t('home.simulateUpdate')}
          accessibilityHint={t('notifications.weatherChange')}
        >
          <Text style={styles.updateButtonText}>{t('home.simulateUpdate')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.completeProfile')}</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
          accessible={true}
          accessibilityLabel={t('home.updatePreferences')}
          accessibilityHint={t('profile.preferencesUpdated')}
        >
          <Text style={styles.profileButtonText}>{t('home.updatePreferences')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.feedbackButton}
          onPress={() => setShowFeedback(true)}
          accessible={true}
          accessibilityLabel={t('home.giveFeedback')}
          accessibilityHint={t('feedback.title')}
        >
          <Text style={styles.feedbackButtonText}>{t('home.giveFeedback')}</Text>
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
    position: 'relative',
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
  liveIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
    marginRight: 5,
  },
  liveIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  updateCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  updateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  updateTime: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-end',
  },
});

export default HomeScreen;