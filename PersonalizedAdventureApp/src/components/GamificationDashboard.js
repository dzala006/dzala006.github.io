import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  Image,
  Dimensions,
  AccessibilityInfo
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { SocialShareButton } from './ui-package';
import { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  shadows,
  animation 
} from '../theme/theme';

/**
 * GamificationDashboard Component
 * 
 * Displays user achievements, badges, and progress based on their activity
 * within the Personalized Adventure App.
 * 
 * @param {Object} props
 * @param {Function} [props.onClose] - Function to call when the dashboard is closed
 * @param {Object} [props.style] - Additional styles to apply to the component
 */
const GamificationDashboard = ({ onClose, style }) => {
  const { user, preferences } = useContext(AuthContext);
  const [achievements, setAchievements] = useState([]);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const badgeAnimations = useRef({}).current;
  
  // Check if screen reader is enabled
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(
      screenReaderEnabled => {
        setScreenReaderEnabled(screenReaderEnabled);
      }
    );
    
    // Listen for screen reader changes
    const listener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      screenReaderEnabled => {
        setScreenReaderEnabled(screenReaderEnabled);
      }
    );
    
    return () => {
      listener.remove();
    };
  }, []);
  
  // Fetch achievements data
  useEffect(() => {
    // In a real app, this would be an API call to fetch achievements
    // For this example, we'll use mock data
    const mockAchievements = [
      {
        id: 'itinerary-creator',
        title: 'Itinerary Creator',
        description: 'Create your first personalized itinerary',
        icon: '🗺️',
        progress: 100,
        completed: true,
        dateCompleted: '2025-03-15',
        criteria: 'Generate at least one itinerary',
        reward: 'Unlock custom themes',
        category: 'planning'
      },
      {
        id: 'feedback-enthusiast',
        title: 'Feedback Enthusiast',
        description: 'Provide feedback to improve your recommendations',
        icon: '📝',
        progress: 80,
        completed: false,
        criteria: 'Submit 10 feedback responses',
        currentValue: 8,
        targetValue: 10,
        reward: 'Increased personalization accuracy',
        category: 'engagement'
      },
      {
        id: 'reservation-master',
        title: 'Reservation Master',
        description: 'Successfully book activities through the app',
        icon: '📅',
        progress: 60,
        completed: false,
        criteria: 'Make 5 successful reservations',
        currentValue: 3,
        targetValue: 5,
        reward: 'Priority booking for popular activities',
        category: 'booking'
      },
      {
        id: 'explorer',
        title: 'Explorer',
        description: 'Visit diverse types of attractions',
        icon: '🧭',
        progress: 40,
        completed: false,
        criteria: 'Visit 5 different types of attractions',
        currentValue: 2,
        targetValue: 5,
        reward: 'Exclusive access to hidden gems',
        category: 'exploration'
      },
      {
        id: 'social-butterfly',
        title: 'Social Butterfly',
        description: 'Share your adventures with friends',
        icon: '🦋',
        progress: 20,
        completed: false,
        criteria: 'Share 3 itineraries on social media',
        currentValue: 1,
        targetValue: 5,
        reward: 'Unlock collaborative planning features',
        category: 'social'
      },
      {
        id: 'weather-adapter',
        title: 'Weather Adapter',
        description: 'Successfully adapt to changing weather conditions',
        icon: '🌦️',
        progress: 50,
        completed: false,
        criteria: 'Complete 3 itineraries despite weather changes',
        currentValue: 1,
        targetValue: 3,
        reward: 'Enhanced weather prediction features',
        category: 'adaptability'
      }
    ];
    
    // Initialize animations for each achievement
    mockAchievements.forEach(achievement => {
      badgeAnimations[achievement.id] = {
        scale: new Animated.Value(1),
        rotate: new Animated.Value(0)
      };
    });
    
    setAchievements(mockAchievements);
    
    // Animate the dashboard entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animation.normal,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: animation.normal,
        useNativeDriver: true
      })
    ]).start();
  }, [fadeAnim, scaleAnim]);
  
  /**
   * Animates a badge when it's selected or when progress is made
   * @param {string} id - The achievement ID
   */
  const animateBadge = (id) => {
    // Don't animate if screen reader is enabled (can be disorienting)
    if (screenReaderEnabled) return;
    
    const { scale, rotate } = badgeAnimations[id];
    
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: animation.fast,
          useNativeDriver: true
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: animation.fast,
          useNativeDriver: true
        })
      ]),
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: animation.fast,
          useNativeDriver: true
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: animation.fast,
          useNativeDriver: true
        })
      ])
    ]).start();
  };
  
  /**
   * Handles selection of an achievement to view details
   * @param {Object} achievement - The selected achievement
   */
  const handleSelectAchievement = (achievement) => {
    setSelectedAchievement(achievement);
    animateBadge(achievement.id);
  };
  
  /**
   * Closes the achievement detail view
   */
  const handleCloseDetail = () => {
    setSelectedAchievement(null);
  };
  
  /**
   * Shares an achievement on social media
   * @param {Object} achievement - The achievement to share
   */
  const handleShareAchievement = (achievement) => {
    // The actual sharing is handled by the SocialShareButton component
    console.log(`Sharing achievement: ${achievement.title}`);
  };
  
  /**
   * Renders the progress bar for an achievement
   * @param {number} progress - The progress percentage (0-100)
   * @param {boolean} completed - Whether the achievement is completed
   */
  const renderProgressBar = (progress, completed) => {
    const progressColor = completed ? colors.success : colors.primary.main;
    
    return (
      <View 
        style={styles.progressBarContainer}
        accessibilityLabel={`${progress}% complete${completed ? ', achievement completed' : ''}`}
      >
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progress}%`, backgroundColor: progressColor }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
    );
  };
  
  /**
   * Renders a badge for an achievement
   * @param {Object} achievement - The achievement to render
   */
  const renderBadge = (achievement) => {
    const { id, icon, title, progress, completed } = achievement;
    const { scale, rotate } = badgeAnimations[id];
    
    // Calculate rotation for animation
    const rotation = rotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '20deg']
    });
    
    return (
      <TouchableOpacity
        key={id}
        style={styles.badgeContainer}
        onPress={() => handleSelectAchievement(achievement)}
        accessibilityLabel={`${title} achievement, ${progress}% complete${completed ? ', completed' : ', in progress'}`}
        accessibilityRole="button"
        accessibilityHint="Double tap to view achievement details"
      >
        <Animated.View 
          style={[
            styles.badge,
            completed ? styles.badgeCompleted : styles.badgeIncomplete,
            {
              transform: [
                { scale },
                { rotate: rotation }
              ]
            }
          ]}
        >
          <Text style={styles.badgeIcon}>{icon}</Text>
        </Animated.View>
        <Text 
          style={styles.badgeTitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {renderProgressBar(progress, completed)}
      </TouchableOpacity>
    );
  };
  
  /**
   * Renders the achievement detail view
   */
  const renderAchievementDetail = () => {
    if (!selectedAchievement) return null;
    
    const { 
      title, 
      description, 
      icon, 
      progress, 
      completed, 
      criteria, 
      currentValue, 
      targetValue, 
      reward, 
      dateCompleted 
    } = selectedAchievement;
    
    return (
      <View 
        style={styles.detailContainer}
        accessibilityViewIsModal={true}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{title}</Text>
          <TouchableOpacity 
            onPress={handleCloseDetail}
            style={styles.closeButton}
            accessibilityLabel="Close achievement details"
            accessibilityRole="button"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.detailContent}>
          <View style={styles.detailIconContainer}>
            <Text style={styles.detailIcon}>{icon}</Text>
          </View>
          
          <Text style={styles.detailDescription}>{description}</Text>
          
          {renderProgressBar(progress, completed)}
          
          <View style={styles.detailInfoContainer}>
            <Text style={styles.detailInfoLabel}>Criteria:</Text>
            <Text style={styles.detailInfoText}>{criteria}</Text>
            
            {currentValue !== undefined && targetValue !== undefined && (
              <Text style={styles.detailProgress}>
                Progress: {currentValue} of {targetValue}
              </Text>
            )}
            
            {completed && dateCompleted && (
              <Text style={styles.detailCompleted}>
                Completed on: {new Date(dateCompleted).toLocaleDateString()}
              </Text>
            )}
            
            <Text style={styles.detailInfoLabel}>Reward:</Text>
            <Text style={styles.detailInfoText}>{reward}</Text>
          </View>
          
          <SocialShareButton
            title={`I earned the "${title}" achievement in Personalized Adventure!`}
            message={`I'm ${progress}% of the way to earning the "${title}" achievement in the Personalized Adventure app. ${description}`}
            buttonText="Share Achievement"
            variant="primary"
            size="medium"
            style={styles.shareButton}
            onShareComplete={() => console.log('Achievement shared')}
            accessibilityLabel={`Share ${title} achievement`}
            accessibilityHint="Opens sharing options to share this achievement on social media"
          />
        </View>
      </View>
    );
  };
  
  /**
   * Renders the achievement statistics
   */
  const renderStats = () => {
    const totalAchievements = achievements.length;
    const completedAchievements = achievements.filter(a => a.completed).length;
    const completionPercentage = Math.round((completedAchievements / totalAchievements) * 100);
    
    return (
      <View 
        style={styles.statsContainer}
        accessibilityLabel={`Achievement statistics: ${completedAchievements} of ${totalAchievements} achievements completed, ${completionPercentage}% overall completion`}
      >
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalAchievements}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completedAchievements}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completionPercentage}%</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
      </View>
    );
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
      accessibilityLabel="Achievements Dashboard"
      accessibilityRole="summary"
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Achievements</Text>
        {onClose && (
          <TouchableOpacity 
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close achievements dashboard"
            accessibilityRole="button"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {renderStats()}
      
      {selectedAchievement ? (
        renderAchievementDetail()
      ) : (
        <ScrollView 
          style={styles.badgesScrollView}
          contentContainerStyle={styles.badgesContainer}
          showsVerticalScrollIndicator={false}
        >
          {achievements.map(achievement => renderBadge(achievement))}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');
const badgeSize = (width - (spacing.md * 2) - (spacing.sm * 2)) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.neutral.lighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.bold,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  badgesScrollView: {
    flex: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    paddingBottom: spacing.xl,
  },
  badgeContainer: {
    width: badgeSize,
    padding: spacing.xs,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  badge: {
    width: badgeSize * 0.7,
    height: badgeSize * 0.7,
    borderRadius: (badgeSize * 0.7) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  badgeCompleted: {
    backgroundColor: colors.success,
  },
  badgeIncomplete: {
    backgroundColor: colors.neutral.light,
  },
  badgeIcon: {
    fontSize: typography.fontSize.xxl,
  },
  badgeTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
    marginBottom: spacing.xs,
    height: 36,
  },
  progressBarContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: colors.neutral.lighter,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.fontSize.xs,
    marginLeft: spacing.xs,
    color: colors.text.secondary,
    width: 30,
    textAlign: 'right',
  },
  detailContainer: {
    flex: 1,
    padding: spacing.md,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  detailContent: {
    flex: 1,
  },
  detailIconContainer: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  detailIcon: {
    fontSize: 40,
  },
  detailDescription: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  detailInfoContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    ...shadows.xs,
  },
  detailInfoLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  detailInfoText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  detailProgress: {
    fontSize: typography.fontSize.md,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.md,
  },
  detailCompleted: {
    fontSize: typography.fontSize.md,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.md,
  },
  shareButton: {
    marginTop: spacing.lg,
  },
});

export default GamificationDashboard;