import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity,
  Animated
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme/theme';

/**
 * Card Component
 * 
 * A customizable card component that follows the app's design system.
 * Can be interactive (touchable) or static, with various elevation levels.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render inside the card
 * @param {string} props.elevation - 'none', 'low', 'medium', 'high'
 * @param {boolean} props.interactive - Whether the card is touchable
 * @param {Function} props.onPress - Function to call when card is pressed (if interactive)
 * @param {Object} props.style - Additional styles to apply
 * @param {string} props.accessibilityLabel - Accessibility label for screen readers
 * @param {string} props.testID - Test ID for testing
 */
const Card = ({
  children,
  elevation = 'medium',
  interactive = false,
  onPress,
  style,
  accessibilityLabel,
  testID,
  ...props
}) => {
  // Animation value for press effect
  const [scaleAnim] = React.useState(new Animated.Value(1));
  
  // Handle press animation for interactive cards
  const handlePressIn = () => {
    if (!interactive) return;
    
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start();
  };
  
  const handlePressOut = () => {
    if (!interactive) return;
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start();
  };

  // Get shadow style based on elevation
  const getShadowStyle = () => {
    switch (elevation) {
      case 'none':
        return {};
      case 'low':
        return shadows.sm;
      case 'high':
        return shadows.lg;
      case 'medium':
      default:
        return shadows.md;
    }
  };

  // Render either a touchable or static card
  const cardContent = (
    <View 
      style={[
        styles.card,
        getShadowStyle(),
        style
      ]}
      testID={testID}
      {...props}
    >
      {children}
    </View>
  );

  // If interactive, wrap in TouchableOpacity with animation
  if (interactive) {
    return (
      <Animated.View
        style={[
          styles.animatedContainer,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint="Activates card action"
        >
          {cardContent}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Otherwise return static card
  return cardContent;
};

const styles = StyleSheet.create({
  animatedContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    overflow: 'hidden',
  },
});

export default Card;