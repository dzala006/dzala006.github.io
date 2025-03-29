import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../../theme/theme';

/**
 * Card Component
 * 
 * A customizable card component with different elevation levels and styles.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render inside the card
 * @param {string} [props.elevation='medium'] - Card elevation level (none, low, medium, high)
 * @param {boolean} [props.outlined=false] - Whether to show an outline instead of shadow
 * @param {Function} [props.onPress] - Function to call when card is pressed (makes card pressable)
 * @param {Object} [props.style] - Additional styles to apply to the card
 * @param {string} [props.accessibilityLabel] - Accessibility label for screen readers
 * @param {string} [props.accessibilityHint] - Accessibility hint for screen readers
 */
const Card = ({
  children,
  elevation = 'medium',
  outlined = false,
  onPress,
  style,
  accessibilityLabel,
  accessibilityHint,
  ...props
}) => {
  // Get shadow style based on elevation
  const getShadowStyle = () => {
    if (outlined) return styles.outlined;
    
    switch (elevation) {
      case 'none':
        return shadows.none;
      case 'low':
        return shadows.xs;
      case 'medium':
        return shadows.sm;
      case 'high':
        return shadows.md;
      default:
        return shadows.sm;
    }
  };
  
  // Base card component
  const cardContent = (
    <View 
      style={[
        styles.card,
        getShadowStyle(),
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
  
  // If onPress is provided, wrap in a Pressable
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        android_ripple={{ color: colors.neutral.light, borderless: false }}
      >
        {({ pressed }) => (
          <View style={[pressed && styles.pressed]}>
            {cardContent}
          </View>
        )}
      </Pressable>
    );
  }
  
  // Otherwise, just return the card
  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    overflow: 'hidden',
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.none,
  },
  pressed: {
    opacity: 0.9,
  },
});

export default Card;