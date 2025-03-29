/**
 * LocationBasedScreen.js
 * 
 * This screen demonstrates the integration of the locationTracker utility
 * to provide location-based recommendations and nearby points of interest.
 */

import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, Callout } from 'react-native-maps';
import { AuthContext } from '../context/AuthContext';
import { generateDynamicItinerary } from '../utils/aiPersonalization';
import locationTracker from '../utils/locationTracker';
import { scheduleNotification } from '../utils/notifications';
import { Button, Card, Typography, Container } from '../components/ui-package';
import { useWebSocket } from '../utils/realTimeUpdates';

const LocationBasedScreen = ({ navigation }) => {
  const { user, preferences } = useContext(AuthContext);
  const { t } = useTranslation();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyPOIs, setNearbyPOIs] = useState([]);
  const [locationBasedItinerary, setLocationBasedItinerary] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Connect to WebSocket for real-time updates
  const { data: wsData } = useWebSocket('wss://api.personalizedadventure.com/location-updates');

  // Categories for filtering POIs
  const categories = [
    { id: 'all', name: t('location.allCategories') },
    { id: 'food', name: t('location.food') },
    { id: 'culture', name: t('location.culture') },
    { id: 'outdoors', name: t('location.outdoors') },
    { id: 'shopping', name: t('location.shopping') }
  ];

  // Initialize location tracking when component mounts
  useEffect(() => {
    initializeLocationTracking();
    
    // Clean up location tracking when component unmounts
    return () => {
      locationTracker.stopLocationTracking();
      locationTracker.removeLocationChangeListener(handleLocationChange);
    };
  }, []);

  // Handle WebSocket updates
  useEffect(() => {
    if (wsData && wsData.type === 'NEARBY_POI_UPDATE') {
      // Add the new POI to our list if it's not already there
      setNearbyPOIs(prevPOIs => {
        const exists = prevPOIs.some(poi => poi.id === wsData.data.id);
        if (!exists) {
          // Notify user about new POI
          scheduleNotification({
            title: t('location.newPlaceNearby'),
            body: `${wsData.data.name} - ${wsData.data.distance}m away`,
            data: { screen: 'LocationBased', poiId: wsData.data.id }
          });
          return [...prevPOIs, wsData.data];
        }
        return prevPOIs;
      });
    }
  }, [wsData]);

  // Initialize location tracking
  const initializeLocationTracking = async () => {
    try {
      // Request location permissions
      const permissionsGranted = await locationTracker.requestLocationPermissions();
      setLocationPermissionGranted(permissionsGranted);
      
      if (!permissionsGranted) {
        setLoading(false);
        return;
      }
      
      // Start tracking location with a callback
      await locationTracker.startLocationTracking(handleLocationChange);
      
      // Get initial location
      const location = await locationTracker.getCurrentLocation();
      if (location) {
        handleLocationChange(location);
      }
    } catch (error) {
      console.error('Error initializing location tracking:', error);
      setLoading(false);
      Alert.alert(
        t('location.errorTitle'),
        t('location.errorInitializing')
      );
    }
  };

  // Handle location changes
  const handleLocationChange = async (location) => {
    console.log('Location changed:', location);
    setCurrentLocation(location);
    
    // Update map region
    setMapRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    });
    
    // Fetch nearby points of interest
    fetchNearbyPOIs();
    
    // Generate location-based itinerary
    generateLocationBasedItinerary();
    
    setLoading(false);
  };

  // Fetch nearby points of interest
  const fetchNearbyPOIs = async () => {
    try {
      const pois = await locationTracker.getNearbyPointsOfInterest(1000);
      setNearbyPOIs(pois);
    } catch (error) {
      console.error('Error fetching nearby POIs:', error);
      Alert.alert(
        t('location.errorTitle'),
        t('location.errorFetchingPOIs')
      );
    }
  };

  // Generate a location-based itinerary
  const generateLocationBasedItinerary = async () => {
    try {
      // Mock data for demonstration
      const mockWeatherData = {
        forecast: [
          { date: new Date().toISOString().split('T')[0], condition: 'sunny', temperature: 75 }
        ]
      };
      
      const mockEventsData = {
        events: [
          { name: 'Local Festival', location: 'City Park', date: new Date().toISOString().split('T')[0] }
        ]
      };
      
      // Generate itinerary based on current location
      const itinerary = await locationTracker.updateItineraryBasedOnLocation(
        user,
        preferences,
        mockWeatherData,
        mockEventsData
      );
      
      setLocationBasedItinerary(itinerary);
    } catch (error) {
      console.error('Error generating location-based itinerary:', error);
    }
  };

  // Filter POIs by category
  const getFilteredPOIs = () => {
    if (selectedCategory === 'all') {
      return nearbyPOIs;
    }
    return nearbyPOIs.filter(poi => poi.category === selectedCategory);
  };

  // Render a POI item
  const renderPOIItem = ({ item }) => (
    <Card 
      style={styles.poiCard}
      accessibilityLabel={`${item.name}, ${item.category}, ${item.distance} meters away, rating ${item.rating}`}
    >
      <View style={styles.poiContent}>
        <View style={styles.poiInfo}>
          <Typography variant="h3">{item.name}</Typography>
          <Typography variant="body2" style={styles.categoryText}>
            {t(`location.category.${item.category}`)}
          </Typography>
          <Typography variant="body2">
            {t('location.distance', { distance: item.distance })}
          </Typography>
          <View style={styles.ratingContainer}>
            <Typography variant="body2">{t('location.rating')}: </Typography>
            <Typography variant="body2" style={styles.rating}>{item.rating}</Typography>
            <Text style={styles.stars}>{'★'.repeat(Math.round(item.rating))}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => navigation.navigate('Itinerary', { poiId: item.id })}
          accessibilityLabel={t('location.viewDetails')}
          accessibilityRole="button"
        >
          <Typography variant="button">{t('location.viewDetails')}</Typography>
        </TouchableOpacity>
      </View>
    </Card>
  );

  // Render category filter buttons
  const renderCategoryButton = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.selectedCategoryButton
      ]}
      onPress={() => setSelectedCategory(category.id)}
      accessibilityLabel={category.name}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedCategory === category.id }}
    >
      <Typography 
        variant="button" 
        style={selectedCategory === category.id ? styles.selectedCategoryText : null}
      >
        {category.name}
      </Typography>
    </TouchableOpacity>
  );

  // If still loading, show loading indicator
  if (loading) {
    return (
      <Container style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Typography variant="h3" style={styles.loadingText}>
          {t('location.gettingYourLocation')}
        </Typography>
      </Container>
    );
  }

  // If location permission was denied, show permission screen
  if (!locationPermissionGranted) {
    return (
      <Container style={styles.permissionContainer}>
        <Image 
          source={require('../../assets/location-permission.png')} 
          style={styles.permissionImage}
          accessibilityLabel={t('location.permissionImageAlt')}
        />
        <Typography variant="h2" style={styles.permissionTitle}>
          {t('location.permissionRequired')}
        </Typography>
        <Typography variant="body1" style={styles.permissionText}>
          {t('location.permissionExplanation')}
        </Typography>
        <Button 
          title={t('location.grantPermission')} 
          onPress={initializeLocationTracking}
          accessibilityLabel={t('location.grantPermission')}
        />
      </Container>
    );
  }

  return (
    <Container style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h1">{t('location.nearbyTitle')}</Typography>
        <Typography variant="body1">
          {currentLocation ? 
            t('location.currentlyAt', { 
              latitude: currentLocation.latitude.toFixed(6), 
              longitude: currentLocation.longitude.toFixed(6) 
            }) : 
            t('location.locationUnknown')
          }
        </Typography>
      </View>

      {/* Map View */}
      {mapRegion && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
            accessibilityLabel={t('location.mapOfNearbyPlaces')}
          >
            {nearbyPOIs.map((poi) => (
              <Marker
                key={poi.id}
                coordinate={{
                  latitude: poi.location.latitude,
                  longitude: poi.location.longitude
                }}
                title={poi.name}
                description={t(`location.category.${poi.category}`)}
              >
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{poi.name}</Text>
                    <Text>{t(`location.category.${poi.category}`)}</Text>
                    <Text>{t('location.distance', { distance: poi.distance })}</Text>
                    <Text>{t('location.rating')}: {poi.rating}</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </View>
      )}

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
        accessibilityLabel={t('location.categoryFilter')}
      >
        {categories.map(renderCategoryButton)}
      </ScrollView>

      {/* Nearby POIs List */}
      <View style={styles.listContainer}>
        <Typography variant="h2" style={styles.sectionTitle}>
          {t('location.nearbyPlaces')}
        </Typography>
        
        {getFilteredPOIs().length > 0 ? (
          <FlatList
            data={getFilteredPOIs()}
            renderItem={renderPOIItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.poiList}
            showsVerticalScrollIndicator={false}
            accessibilityLabel={t('location.poiList')}
          />
        ) : (
          <View style={styles.emptyState}>
            <Typography variant="body1">
              {t('location.noPlacesFound')}
            </Typography>
          </View>
        )}
      </View>

      {/* Generate Itinerary Button */}
      <Button
        title={t('location.generateItinerary')}
        onPress={generateLocationBasedItinerary}
        style={styles.generateButton}
        accessibilityLabel={t('location.generateItinerary')}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 20,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  permissionImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  permissionTitle: {
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 30,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  mapContainer: {
    height: 200,
    margin: 15,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  callout: {
    width: 150,
    padding: 10,
  },
  calloutTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  categoryContainer: {
    marginVertical: 10,
  },
  categoryContent: {
    paddingHorizontal: 15,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedCategoryButton: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  poiList: {
    paddingBottom: 20,
  },
  poiCard: {
    marginBottom: 10,
  },
  poiContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poiInfo: {
    flex: 1,
  },
  categoryText: {
    color: '#4A90E2',
    marginVertical: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  rating: {
    fontWeight: 'bold',
  },
  stars: {
    color: '#FFD700',
    marginLeft: 5,
  },
  detailsButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  generateButton: {
    margin: 15,
  },
});

export default LocationBasedScreen;