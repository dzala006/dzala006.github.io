import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme/theme';

/**
 * Typography Component
 * 
 * A customizable text component that follows the app's design system.
 * Supports different variants, weights, and colors.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Text content
 * @param {string} props.variant - 'h1', 'h2', 'h3', 'h4', 'h5', 'subtitle1', 'subtitle2', 'body1', 'body2', 'caption', 'button', 'overline'
 * @param {string} props.weight - 'light', 'regular', 'medium', 'semibold', 'bold', 'black'
 * @param {string} props.color - Color name from theme or custom color
 * @param {string} props.align - 'left', 'center', 'right'
 * @param {boolean} props.italic - Whether text should be italic
 * @param {boolean} props.uppercase - Whether text should be uppercase
 * @param {Object} props.style - Additional styles to apply
 * @param {number} props.numberOfLines - Maximum number of lines to display
 * @param {string} props.accessibilityLabel - Accessibility label for screen readers
 * @param {string} props.testID - Test ID for testing
 */
const Typography = ({
  children,
  variant = 'body1',
  weight = 'regular',
  color = 'darkest',
  align = 'left',
  italic = false,
  uppercase = false,
  style,
  numberOfLines,
  accessibilityLabel,
  testID,
  ...props
}) => {
  // Get text color from theme or use custom color
  const getColor = () => {
    // Check if color is a path to theme colors (e.g., 'primary.main')
    if (color.includes('.')) {
      const [category, shade] = color.split('.');
      return colors[category]?.[shade] || colors.neutral.darkest;
    }
    
    // Check if color is a neutral color name
    if (colors.neutral[color]) {
      return colors.neutral[color];
    }
    
    // Otherwise, assume it's a custom color string
    return color;
  };

  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        { fontWeight: typography.fontWeight[weight] },
        { color: getColor() },
        { textAlign: align },
        italic && { fontStyle: 'italic' },
        uppercase && { textTransform: 'uppercase' },
        style
      ]}
      numberOfLines={numberOfLines}
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityRole="text"
      testID={testID}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.regular,
    color: colors.neutral.darkest,
  },
  // Heading variants
  h1: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.display * typography.lineHeight.tight,
    marginBottom: 16,
  },
  h2: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.xxxl * typography.lineHeight.tight,
    marginBottom: 14,
  },
  h3: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.xxl * typography.lineHeight.tight,
    marginBottom: 12,
  },
  h4: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.xl * typography.lineHeight.tight,
    marginBottom: 10,
  },
  h5: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.lg * typography.lineHeight.tight,
    marginBottom: 8,
  },
  // Subtitle variants
  subtitle1: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
    marginBottom: 8,
  },
  subtitle2: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
    marginBottom: 6,
  },
  // Body text variants
  body1: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
    marginBottom: 8,
  },
  body2: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    marginBottom: 6,
  },
  // Other variants
  caption: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
    color: colors.neutral.dark,
  },
  button: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 0.5,
  },
  overline: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

export default Typography;