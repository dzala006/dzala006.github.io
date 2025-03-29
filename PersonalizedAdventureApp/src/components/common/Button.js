import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  View,
  Animated,
  Pressable
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme/theme';

/**
 * Button Component
 * 
 * A customizable button component with different variants, sizes, and states.
 * 
 * @param {Object} props
 * @param {string} [props.variant='primary'] - Button style variant (primary, secondary, outline, text)
 * @param {string} [props.size='medium'] - Button size (small, medium, large)
 * @param {string} props.title - Button text
 * @param {Function} props.onPress - Function to call when button is pressed
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {boolean} [props.loading=false] - Whether to show a loading indicator
 * @param {Object} [props.style] - Additional styles to apply to the button
 * @param {Object} [props.textStyle] - Additional styles to apply to the button text
 * @param {string} [props.accessibilityLabel] - Accessibility label for screen readers
 * @param {string} [props.accessibilityHint] - Accessibility hint for screen readers
 */
const Button = ({
  variant = 'primary',
  size = 'medium',
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  ...props
}) => {
  // Animation value for press effect
  const [pressAnim] = React.useState(new Animated.Value(1));
  
  // Handle press in animation
  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };
  
  // Handle press out animation
  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Determine button styles based on variant and size
  const getButtonStyles = () => {
    // Base styles
    const baseStyles = [styles.button, styles[`${size}Button`]];
    
    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyles.push(styles.primaryButton);
        break;
      case 'secondary':
        baseStyles.push(styles.secondaryButton);
        break;
      case 'outline':
        baseStyles.push(styles.outlineButton);
        break;
      case 'text':
        baseStyles.push(styles.textButton);
        break;
      default:
        baseStyles.push(styles.primaryButton);
    }
    
    // Disabled state
    if (disabled) {
      baseStyles.push(styles.disabledButton);
    }
    
    return baseStyles;
  };
  
  // Determine text styles based on variant and size
  const getTextStyles = () => {
    // Base styles
    const baseStyles = [styles.text, styles[`${size}Text`]];
    
    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyles.push(styles.primaryText);
        break;
      case 'secondary':
        baseStyles.push(styles.secondaryText);
        break;
      case 'outline':
        baseStyles.push(styles.outlineText);
        break;
      case 'text':
        baseStyles.push(styles.textButtonText);
        break;
      default:
        baseStyles.push(styles.primaryText);
    }
    
    // Disabled state
    if (disabled) {
      baseStyles.push(styles.disabledText);
    }
    
    return baseStyles;
  };

  return (
    <Pressable
      onPress={disabled || loading ? null : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      {...props}
    >
      <Animated.View 
        style={[
          ...getButtonStyles(),
          style,
          { transform: [{ scale: pressAnim }] }
        ]}
      >
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' || variant === 'text' ? colors.primary.main : colors.primary.contrast} 
          />
        ) : (
          <Text style={[...getTextStyles(), textStyle]}>
            {title}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
  },
  
  // Size variations
  smallButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 32,
  },
  mediumButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  largeButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
  },
  
  // Variant styles
  primaryButton: {
    backgroundColor: colors.primary.main,
    ...shadows.sm,
  },
  secondaryButton: {
    backgroundColor: colors.secondary.main,
    ...shadows.sm,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.xs,
    minHeight: 'auto',
  },
  
  // Disabled state
  disabledButton: {
    backgroundColor: colors.neutral.light,
    borderColor: colors.neutral.light,
    ...shadows.none,
  },
  
  // Text styles
  text: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  
  // Text size variations
  smallText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  mediumText: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.md,
  },
  largeText: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
  },
  
  // Text variant styles
  primaryText: {
    color: colors.primary.contrast,
  },
  secondaryText: {
    color: colors.secondary.contrast,
  },
  outlineText: {
    color: colors.primary.main,
  },
  textButtonText: {
    color: colors.primary.main,
  },
  
  // Disabled text
  disabledText: {
    color: colors.text.disabled,
  },
});

export default Button;