/**
 * Global theme configuration for the Personalized Adventure App
 * This file defines the app's design system including colors, typography, spacing, etc.
 */

// Color palette
export const colors = {
  // Primary colors
  primary: {
    main: '#4361EE',
    light: '#738AFF',
    dark: '#2F3FBF',
    contrast: '#FFFFFF',
  },
  
  // Secondary colors
  secondary: {
    main: '#FF6B6B',
    light: '#FF9E9E',
    dark: '#D14545',
    contrast: '#FFFFFF',
  },
  
  // Accent colors
  accent: {
    main: '#4CC9F0',
    light: '#7FDBF5',
    dark: '#2A9BC0',
    contrast: '#000000',
  },
  
  // Neutral colors
  neutral: {
    white: '#FFFFFF',
    lightest: '#F8F9FA',
    lighter: '#E9ECEF',
    light: '#DEE2E6',
    medium: '#CED4DA',
    dark: '#6C757D',
    darker: '#495057',
    darkest: '#343A40',
    black: '#212529',
  },
  
  // Semantic colors
  success: '#4CAF50',
  warning: '#FFAB00',
  error: '#F44336',
  info: '#2196F3',
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    card: '#FFFFFF',
    modal: '#FFFFFF',
  },
  
  // Text colors
  text: {
    primary: '#212529',
    secondary: '#6C757D',
    disabled: '#ADB5BD',
    inverse: '#FFFFFF',
    link: '#4361EE',
  },
  
  // Border colors
  border: {
    light: '#E9ECEF',
    medium: '#DEE2E6',
    dark: '#CED4DA',
  },
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 36,
  },
  
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 42,
    display: 48,
  },
  
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Spacing system (in pixels)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

// Shadows
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
};

// Animation timing
export const animation = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Z-index values
export const zIndex = {
  base: 0,
  elevated: 1,
  navigation: 10,
  modal: 100,
  toast: 1000,
};

// Screen sizes for responsive design
export const breakpoints = {
  xs: 0,
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// Export the complete theme
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  zIndex,
  breakpoints,
};