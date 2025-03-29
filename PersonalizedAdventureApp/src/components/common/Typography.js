import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme/theme';

/**
 * Typography Component
 * 
 * A set of text components with consistent styling based on the design system.
 * Includes different variants for headings, body text, and other text styles.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Text content
 * @param {string} [props.variant='body1'] - Text style variant
 * @param {string} [props.color] - Text color (overrides default color for variant)
 * @param {boolean} [props.bold=false] - Whether to make the text bold
 * @param {boolean} [props.italic=false] - Whether to make the text italic
 * @param {boolean} [props.center=false] - Whether to center-align the text
 * @param {Object} [props.style] - Additional styles to apply to the text
 * @param {number} [props.numberOfLines] - Maximum number of lines to display
 * @param {boolean} [props.adjustsFontSizeToFit] - Whether to adjust font size to fit container
 * @param {string} [props.accessibilityLabel] - Accessibility label for screen readers
 */
const Typography = ({
  children,
  variant = 'body1',
  color,
  bold = false,
  italic = false,
  center = false,
  style,
  numberOfLines,
  adjustsFontSizeToFit,
  accessibilityLabel,
  ...props
}) => {
  // Get base style for variant
  const getVariantStyle = () => {
    switch (variant) {
      case 'h1':
        return styles.h1;
      case 'h2':
        return styles.h2;
      case 'h3':
        return styles.h3;
      case 'h4':
        return styles.h4;
      case 'h5':
        return styles.h5;
      case 'h6':
        return styles.h6;
      case 'subtitle1':
        return styles.subtitle1;
      case 'subtitle2':
        return styles.subtitle2;
      case 'body1':
        return styles.body1;
      case 'body2':
        return styles.body2;
      case 'button':
        return styles.button;
      case 'caption':
        return styles.caption;
      case 'overline':
        return styles.overline;
      default:
        return styles.body1;
    }
  };

  // Combine all styles
  const textStyles = [
    styles.base,
    getVariantStyle(),
    bold && styles.bold,
    italic && styles.italic,
    center && styles.center,
    color && { color },
    style,
  ];

  return (
    <Text
      style={textStyles}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      {...props}
    >
      {children}
    </Text>
  );
};

// Create convenience components for common variants
Typography.H1 = (props) => <Typography variant="h1" {...props} />;
Typography.H2 = (props) => <Typography variant="h2" {...props} />;
Typography.H3 = (props) => <Typography variant="h3" {...props} />;
Typography.H4 = (props) => <Typography variant="h4" {...props} />;
Typography.H5 = (props) => <Typography variant="h5" {...props} />;
Typography.H6 = (props) => <Typography variant="h6" {...props} />;
Typography.Subtitle1 = (props) => <Typography variant="subtitle1" {...props} />;
Typography.Subtitle2 = (props) => <Typography variant="subtitle2" {...props} />;
Typography.Body1 = (props) => <Typography variant="body1" {...props} />;
Typography.Body2 = (props) => <Typography variant="body2" {...props} />;
Typography.Button = (props) => <Typography variant="button" {...props} />;
Typography.Caption = (props) => <Typography variant="caption" {...props} />;
Typography.Overline = (props) => <Typography variant="overline" {...props} />;

const styles = StyleSheet.create({
  base: {
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },
  
  // Heading styles
  h1: {
    fontSize: typography.fontSize.xxxl,
    lineHeight: typography.lineHeight.xxxl,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: typography.fontSize.xxl,
    lineHeight: typography.lineHeight.xxl,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: typography.fontSize.xl,
    lineHeight: typography.lineHeight.xl,
    fontWeight: typography.fontWeight.semibold,
  },
  h4: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  h5: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.fontWeight.semibold,
  },
  h6: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.5,
  },
  
  // Other text styles
  subtitle1: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.fontWeight.medium,
  },
  subtitle2: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.fontWeight.medium,
  },
  body1: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.md,
  },
  body2: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  button: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
  },
  overline: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  // Modifiers
  bold: {
    fontWeight: typography.fontWeight.bold,
  },
  italic: {
    fontStyle: 'italic',
  },
  center: {
    textAlign: 'center',
  },
});

export default Typography;