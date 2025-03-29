import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  Animated,
  View
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme/theme';

/**
 * Button Component
 * 
 * A customizable button component that follows the app's design system.
 * Supports different variants, sizes, and states including loading and disabled.
 * 
 * @param {Object} props
 * @param {string} props.variant - 'primary', 'secondary', 'outline', 'text'
 * @param {string} props.size - 'small', 'medium', 'large'
 * @param {string} props.label - Button text
 * @param {Function} props.onPress - Function to call when button is pressed
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {boolean} props.loading - Whether to show a loading indicator
 * @param {Object} props.style - Additional styles to apply
 * @param {Object} props.labelStyle - Additional styles for the label
 * @param {React.ReactNode} props.leftIcon - Icon to display before the label
 * @param {React.ReactNode} props.rightIcon - Icon to display after the label
 * @param {string} props.accessibilityLabel - Accessibility label for screen readers
 */
const Button = ({
  variant = 'primary',
  size = 'medium',
  label,
  onPress,
  disabled = false,
  loading = false,
  style,
  labelStyle,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  ...props
}) => {
  // Animation value for press effect
  const [scaleAnim] = React.useState(new Animated.Value(1));
  
  // Handle press animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start();
  };

  // Determine button styles based on variant and size
  const getButtonStyles = () => {
    // Base styles
    const baseStyles = [styles.button, styles[`${size}Button`]];
    
    // Variant styles
    if (variant === 'primary') {
      baseStyles.push(styles.primaryButton);
    } else if (variant === 'secondary') {
      baseStyles.push(styles.secondaryButton);
    } else if (variant === 'outline') {
      baseStyles.push(styles.outlineButton);
    } else if (variant === 'text') {
      baseStyles.push(styles.textButton);
    }
    
    // Disabled state
    if (disabled) {
      baseStyles.push(styles.disabledButton);
    }
    
    return baseStyles;
  };
  
  // Determine label styles based on variant and size
  const getLabelStyles = () => {
    // Base styles
    const baseStyles = [styles.label, styles[`${size}Label`]];
    
    // Variant styles
    if (variant === 'primary') {
      baseStyles.push(styles.primaryLabel);
    } else if (variant === 'secondary') {
      baseStyles.push(styles.secondaryLabel);
    } else if (variant === 'outline') {
      baseStyles.push(styles.outlineLabel);
    } else if (variant === 'text') {
      baseStyles.push(styles.textLabel);
    }
    
    // Disabled state
    if (disabled) {
      baseStyles.push(styles.disabledLabel);
    }
    
    return baseStyles;
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        variant !== 'text' && styles.buttonContainer
      ]}
    >
      <TouchableOpacity
        style={[...getButtonStyles(), style]}
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={`Activates ${label} action`}
        {...props}
      >
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' || variant === 'text' 
              ? colors.primary.main 
              : colors.primary.contrast} 
          />
        ) : (
          <View style={styles.contentContainer}>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            <Text style={[...getLabelStyles(), labelStyle]}>{label}</Text>
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    ...shadows.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden'
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Size variations
  smallButton: {
    paddingVertical: spacing.xs,
    minHeight: 32,
  },
  mediumButton: {
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  largeButton: {
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  // Variant styles
  primaryButton: {
    backgroundColor: colors.primary.main,
  },
  secondaryButton: {
    backgroundColor: colors.secondary.main,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.xs,
  },
  // State styles
  disabledButton: {
    backgroundColor: colors.neutral.lighter,
    borderColor: colors.neutral.light,
    ...shadows.sm,
  },
  // Label styles
  label: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  // Label size variations
  smallLabel: {
    fontSize: typography.fontSize.sm,
  },
  mediumLabel: {
    fontSize: typography.fontSize.md,
  },
  largeLabel: {
    fontSize: typography.fontSize.lg,
  },
  // Label variant styles
  primaryLabel: {
    color: colors.primary.contrast,
  },
  secondaryLabel: {
    color: colors.secondary.contrast,
  },
  outlineLabel: {
    color: colors.primary.main,
  },
  textLabel: {
    color: colors.primary.main,
  },
  // Label state styles
  disabledLabel: {
    color: colors.neutral.base,
  },
  // Icon styles
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});

export default Button;