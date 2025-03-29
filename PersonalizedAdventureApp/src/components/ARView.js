/**
 * @fileoverview Augmented Reality view component for the Personalized Adventure App
 * Uses Expo's AR libraries to overlay nearby points of interest on the camera feed
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform
} from 'react-native';
import { Camera } from 'expo-camera';
import { GLView } from 'expo-gl';
import * as Permissions from 'expo-permissions';
import { Asset } from 'expo-asset';
import * as THREE from 'expo-three';
import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Accelerometer, DeviceMotion } from 'expo-sensors';
import { useIsFocused } from '@react-navigation/native';

// Import our location tracking utility
import * as locationTracker from '../utils/locationTracker';
// Import enhanced data integration for POI data
import { fetchNearbyActivities } from '../utils/enhancedDataIntegration';
// Import theme for consistent styling
import { colors, typography, spacing } from '../utils/theme';

const { width, height } = Dimensions.get('window');
const MARKER_SIZE = 30;
const MAX_DISTANCE = 2000; // Maximum distance to show POIs (in meters)
const MARKER_SCALE_FACTOR = 0.5; // How much markers should scale with distance

/**
 * ARView component that displays nearby points of interest in augmented reality
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onMarkerPress - Callback when a marker is pressed
 * @param {Array<string>} props.categories - Categories of POIs to display
 * @param {number} props.maxDistance - Maximum distance to show POIs (in meters)
 * @param {Function} props.onClose - Callback when the AR view is closed
 * @returns {JSX.Element} The AR view component
 */
const ARView = ({ 
  onMarkerPress, 
  categories = [], 
  maxDistance = MAX_DISTANCE,
  onClose
}) => {
  // State variables
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pointsOfInterest, setPointsOfInterest] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [selectedMarker, setSelectedMarker] = useState(null);
  
  // Refs
  const cameraRef = useRef(null);
  const glViewRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraThreeRef = useRef(null);
  const rendererRef = useRef(null);
  const markersRef = useRef({});
  const animationFrameRef = useRef(null);
  
  // Check if screen is focused (for camera and sensors)
  const isFocused = useIsFocused();

  /**
   * Request camera and location permissions
   */
  const requestPermissions = async () => {
    try {
      // Request camera permission
      const { status: cameraStatus } = await Camera.requestPermissionsAsync();
      
      // Request location permission using our utility
      const locationPermissionGranted = await locationTracker.requestLocationPermissions();
      
      // Set permission state based on both permissions
      setHasPermission(cameraStatus === 'granted' && locationPermissionGranted);
      
      if (cameraStatus !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to use the AR view.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
      
      if (!locationPermissionGranted) {
        Alert.alert(
          'Location Permission Required',
          'Please grant location permission to see nearby points of interest.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request necessary permissions.');
      onClose && onClose();
    }
  };

  /**
   * Initialize the AR scene
   * @param {ExpoWebGLRenderingContext} gl - The GL context
   */
  const onContextCreate = async (gl) => {
    try {
      // Create a THREE.js scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      
      // Create a camera for the THREE.js scene
      const camera = new THREE.PerspectiveCamera(
        75, // Field of view
        gl.drawingBufferWidth / gl.drawingBufferHeight, // Aspect ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
      );
      cameraThreeRef.current = camera;
      
      // Set initial camera position
      camera.position.set(0, 0, 0);
      
      // Create a renderer
      const renderer = new THREE.Renderer({ gl, antialias: true });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x000000, 0); // Transparent background
      rendererRef.current = renderer;
      
      // Add ambient light to the scene
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);
      
      // Start the render loop
      startRenderLoop(renderer, scene, camera);
      
      // Load marker assets
      await loadMarkerAssets();
      
      setLoading(false);
    } catch (error) {
      console.error('Error creating AR context:', error);
      Alert.alert('Error', 'Failed to initialize AR view.');
      onClose && onClose();
    }
  };

  /**
   * Start the render loop for the THREE.js scene
   * @param {THREE.Renderer} renderer - The THREE.js renderer
   * @param {THREE.Scene} scene - The THREE.js scene
   * @param {THREE.Camera} camera - The THREE.js camera
   */
  const startRenderLoop = (renderer, scene, camera) => {
    const renderLoop = () => {
      if (!isFocused) return;
      
      // Update marker positions based on device orientation
      updateMarkerPositions();
      
      // Render the scene
      renderer.render(scene, camera);
      
      // Request next frame
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };
    
    // Start the render loop
    animationFrameRef.current = requestAnimationFrame(renderLoop);
  };

  /**
   * Load marker assets (textures, models, etc.)
   */
  const loadMarkerAssets = async () => {
    try {
      // In a real implementation, you would load textures or 3D models here
      // For this example, we'll use simple THREE.js objects
      
      // Preload any required assets
      // await Asset.loadAsync([require('../../assets/marker-icon.png')]);
      
      console.log('Marker assets loaded successfully');
    } catch (error) {
      console.error('Error loading marker assets:', error);
    }
  };

  /**
   * Create a 3D marker for a point of interest
   * @param {Object} poi - Point of interest data
   * @returns {THREE.Object3D} The marker object
   */
  const createMarker = (poi) => {
    try {
      // Create a simple colored sphere as a marker
      const geometry = new THREE.SphereGeometry(0.5, 32, 32);
      
      // Use different colors for different categories
      let markerColor;
      switch (poi.category) {
        case 'food':
          markerColor = 0xFF5252; // Red
          break;
        case 'culture':
          markerColor = 0x448AFF; // Blue
          break;
        case 'outdoors':
          markerColor = 0x4CAF50; // Green
          break;
        case 'shopping':
          markerColor = 0xFFC107; // Amber
          break;
        default:
          markerColor = 0xE040FB; // Purple
      }
      
      const material = new THREE.MeshBasicMaterial({ color: markerColor });
      const marker = new THREE.Mesh(geometry, material);
      
      // Add the POI data to the marker for reference
      marker.userData = { poi };
      
      // Add the marker to the scene
      sceneRef.current.add(marker);
      
      // Store the marker in our ref for later updates
      markersRef.current[poi.id] = marker;
      
      return marker;
    } catch (error) {
      console.error('Error creating marker:', error);
      return null;
    }
  };

  /**
   * Update the positions of all markers based on device orientation and POI locations
   */
  const updateMarkerPositions = () => {
    if (!currentLocation || !sceneRef.current || !deviceOrientation) return;
    
    try {
      // Get the device orientation in radians
      const heading = (deviceOrientation.alpha * Math.PI) / 180;
      const pitch = (deviceOrientation.beta * Math.PI) / 180;
      const roll = (deviceOrientation.gamma * Math.PI) / 180;
      
      // Update each marker's position
      pointsOfInterest.forEach(poi => {
        const marker = markersRef.current[poi.id];
        if (!marker) return;
        
        // Calculate the bearing between current location and POI
        const bearing = calculateBearing(
          currentLocation.latitude,
          currentLocation.longitude,
          poi.location.latitude,
          poi.location.longitude
        );
        
        // Calculate the relative angle between device heading and POI bearing
        const relativeAngle = bearing - heading;
        
        // Calculate the distance to the POI
        const distance = locationTracker.calculateDistance(
          currentLocation,
          poi.location
        );
        
        // Scale the marker based on distance (closer = larger)
        const scale = Math.max(0.2, 1 - (distance / maxDistance) * MARKER_SCALE_FACTOR);
        marker.scale.set(scale, scale, scale);
        
        // Position the marker in 3D space based on bearing and distance
        // This is a simplified positioning that places markers in a circle around the user
        const x = Math.sin(relativeAngle) * 10;
        const z = -Math.cos(relativeAngle) * 10;
        const y = pitch * 5; // Adjust height based on device pitch
        
        marker.position.set(x, y, z);
      });
    } catch (error) {
      console.error('Error updating marker positions:', error);
    }
  };

  /**
   * Calculate the bearing between two coordinates
   * @param {number} lat1 - Starting latitude
   * @param {number} lon1 - Starting longitude
   * @param {number} lat2 - Ending latitude
   * @param {number} lon2 - Ending longitude
   * @returns {number} Bearing in radians
   */
  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    // Convert to radians
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const λ1 = (lon1 * Math.PI) / 180;
    const λ2 = (lon2 * Math.PI) / 180;
    
    // Calculate bearing
    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    const θ = Math.atan2(y, x);
    
    // Return bearing in radians
    return θ;
  };

  /**
   * Handle marker selection when a user taps on the screen
   * @param {Object} event - Touch event
   */
  const handleMarkerSelection = (event) => {
    if (!sceneRef.current || !cameraThreeRef.current || !rendererRef.current) return;
    
    try {
      // Get touch coordinates
      const touch = event.nativeEvent;
      const touchX = (touch.locationX / width) * 2 - 1;
      const touchY = -(touch.locationY / height) * 2 + 1;
      
      // Create a raycaster to detect intersections
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera({ x: touchX, y: touchY }, cameraThreeRef.current);
      
      // Get all objects that intersect with the ray
      const intersects = raycaster.intersectObjects(sceneRef.current.children);
      
      if (intersects.length > 0) {
        // Get the first intersected object
        const intersectedObject = intersects[0].object;
        
        // Check if it has POI data
        if (intersectedObject.userData && intersectedObject.userData.poi) {
          const poi = intersectedObject.userData.poi;
          setSelectedMarker(poi);
          
          // Call the onMarkerPress callback if provided
          onMarkerPress && onMarkerPress(poi);
        }
      } else {
        // Clear selection if tapping empty space
        setSelectedMarker(null);
      }
    } catch (error) {
      console.error('Error handling marker selection:', error);
    }
  };

  /**
   * Fetch nearby points of interest using the enhanced data integration
   */
  const fetchPointsOfInterest = async () => {
    try {
      setLoading(true);
      
      // Get current location
      const location = await locationTracker.getCurrentLocation();
      setCurrentLocation(location);
      
      if (!location) {
        throw new Error('Could not get current location');
      }
      
      // Fetch nearby activities using our enhanced data integration
      const nearbyActivities = await fetchNearbyActivities({
        latitude: location.latitude,
        longitude: location.longitude,
        radius: maxDistance,
        categories: categories.length > 0 ? categories : undefined,
        limit: 20
      });
      
      // Format the data for our AR view
      const formattedPOIs = nearbyActivities.map(activity => ({
        id: activity.id,
        name: activity.name,
        category: activity.category,
        location: {
          latitude: activity.coordinates.latitude,
          longitude: activity.coordinates.longitude,
        },
        distance: activity.distance,
        rating: activity.rating,
        description: activity.description,
        price: activity.price,
        imageUrl: activity.imageUrl,
        openingHours: activity.openingHours,
      }));
      
      setPointsOfInterest(formattedPOIs);
      
      // Create markers for each POI
      formattedPOIs.forEach(createMarker);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching points of interest:', error);
      Alert.alert('Error', 'Failed to fetch nearby points of interest.');
      setLoading(false);
    }
  };

  /**
   * Start device motion tracking
   */
  const startDeviceMotionTracking = async () => {
    try {
      // Check if DeviceMotion is available
      const isAvailable = await DeviceMotion.isAvailableAsync();
      
      if (!isAvailable) {
        console.warn('Device motion is not available on this device');
        return;
      }
      
      // Configure the update interval
      DeviceMotion.setUpdateInterval(100); // 10 updates per second
      
      // Subscribe to device motion updates
      DeviceMotion.addListener(data => {
        // Extract orientation data
        const { rotation } = data;
        
        if (rotation) {
          setDeviceOrientation({
            alpha: rotation.alpha || 0, // Heading (yaw)
            beta: rotation.beta || 0,   // Pitch
            gamma: rotation.gamma || 0  // Roll
          });
        }
      });
    } catch (error) {
      console.error('Error starting device motion tracking:', error);
    }
  };

  /**
   * Stop device motion tracking
   */
  const stopDeviceMotionTracking = () => {
    DeviceMotion.removeAllListeners();
  };

  /**
   * Start location tracking
   */
  const startTracking = async () => {
    try {
      // Start location tracking with a callback
      await locationTracker.startLocationTracking(newLocation => {
        setCurrentLocation(newLocation);
      });
      
      // Start device motion tracking
      await startDeviceMotionTracking();
      
      // Fetch initial points of interest
      await fetchPointsOfInterest();
    } catch (error) {
      console.error('Error starting tracking:', error);
    }
  };

  /**
   * Clean up resources when component unmounts
   */
  const cleanup = () => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Stop device motion tracking
    stopDeviceMotionTracking();
    
    // Stop location tracking
    locationTracker.stopLocationTracking();
    
    // Clear THREE.js resources
    if (sceneRef.current) {
      // Remove all markers from the scene
      Object.values(markersRef.current).forEach(marker => {
        sceneRef.current.remove(marker);
        marker.geometry.dispose();
        marker.material.dispose();
      });
      
      markersRef.current = {};
    }
    
    // Dispose of renderer
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  };

  // Request permissions when component mounts
  useEffect(() => {
    requestPermissions();
    
    // Clean up when component unmounts
    return cleanup;
  }, []);

  // Start tracking when permissions are granted
  useEffect(() => {
    if (hasPermission === true) {
      startTracking();
    }
  }, [hasPermission]);

  // Handle screen focus changes
  useEffect(() => {
    if (isFocused && hasPermission === true) {
      startTracking();
    } else {
      cleanup();
    }
  }, [isFocused]);

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading AR View...</Text>
      </View>
    );
  }

  // Render permission denied state
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera and location permissions are required to use the AR view.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onClose}>
          <Text style={styles.secondaryButtonText}>Close AR View</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render AR view
  return (
    <View style={styles.container}>
      {/* Camera background */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants.Type.BACK}
      />
      
      {/* GL View for THREE.js scene */}
      <GLView
        ref={glViewRef}
        style={styles.glView}
        onContextCreate={onContextCreate}
      />
      
      {/* Touch handler overlay */}
      <TouchableOpacity
        style={styles.touchOverlay}
        activeOpacity={1}
        onPress={handleMarkerSelection}
      />
      
      {/* Selected marker info */}
      {selectedMarker && (
        <View style={styles.markerInfoContainer}>
          <Text style={styles.markerTitle}>{selectedMarker.name}</Text>
          <Text style={styles.markerCategory}>{selectedMarker.category}</Text>
          <Text style={styles.markerDistance}>
            {selectedMarker.distance.toFixed(0)}m away
          </Text>
          {selectedMarker.rating && (
            <Text style={styles.markerRating}>
              Rating: {selectedMarker.rating.toFixed(1)}★
            </Text>
          )}
          {selectedMarker.description && (
            <Text style={styles.markerDescription} numberOfLines={2}>
              {selectedMarker.description}
            </Text>
          )}
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => onMarkerPress && onMarkerPress(selectedMarker)}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      
      {/* POI count indicator */}
      <View style={styles.poiCountContainer}>
        <Text style={styles.poiCountText}>
          {pointsOfInterest.length} points of interest nearby
        </Text>
      </View>
      
      {/* Accessibility features */}
      <View
        style={styles.accessibilityContainer}
        accessible={true}
        accessibilityLabel={`AR View showing ${pointsOfInterest.length} nearby points of interest. Double tap to explore.`}
        accessibilityHint="Shows nearby attractions in augmented reality"
        accessibilityRole="image"
      />
    </View>
  );
};

// Component styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  glView: {
    ...StyleSheet.absoluteFillObject,
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.medium,
    ...typography.body,
    color: colors.text,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.large,
  },
  permissionText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.large,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: 8,
    marginVertical: spacing.small,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  markerInfoContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: spacing.medium,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  markerTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: spacing.xsmall,
  },
  markerCategory: {
    ...typography.caption,
    color: colors.accent,
    textTransform: 'uppercase',
    marginBottom: spacing.xsmall,
  },
  markerDistance: {
    ...typography.body,
    color: colors.white,
    marginBottom: spacing.xsmall,
  },
  markerRating: {
    ...typography.body,
    color: colors.white,
    marginBottom: spacing.xsmall,
  },
  markerDescription: {
    ...typography.body,
    color: colors.white,
    marginBottom: spacing.medium,
  },
  detailsButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  detailsButtonText: {
    ...typography.button,
    color: colors.white,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    ...typography.h3,
    color: colors.white,
  },
  poiCountContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingVertical: spacing.xsmall,
    paddingHorizontal: spacing.medium,
  },
  poiCountText: {
    ...typography.caption,
    color: colors.white,
  },
  accessibilityContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export default ARView;