/**
 * Global Theme Configuration
 * 
 * This file defines the design system for the Personalized Adventure App,
 * including colors, typography, spacing, and other design constants.
 */

// Color Palette
export const colors = {
  // Primary colors
  primary: {
    main: '#3E7BFA',     // Vibrant blue - main brand color
    light: '#6D9CFF',    // Lighter shade for backgrounds, highlights
    dark: '#0D47A1',     // Darker shade for text, buttons
    contrast: '#FFFFFF'  // Text color on primary backgrounds
  },
  
  // Secondary colors
  secondary: {
    main: '#FF8A65',     // Coral orange - secondary brand color
    light: '#FFAB91',    // Lighter shade for accents
    dark: '#C75B39',     // Darker shade for emphasis
    contrast: '#FFFFFF'  // Text color on secondary backgrounds
  },
  
  // Accent colors for variety
  accent: {
    green: '#4CAF50',    // Success, confirmation, nature activities
    purple: '#9C27B0',   // Premium features, cultural activities
    teal: '#009688',     // Water activities, relaxation
    amber: '#FFC107'     // Warnings, outdoor activities
  },
  
  // Neutral colors for text, backgrounds, etc.
  neutral: {
    white: '#FFFFFF',
    lightest: '#F5F7FA',
    lighter: '#E4E7EB',
    light: '#CBD2D9',
    base: '#9AA5B1',
    dark: '#616E7C',
    darker: '#3E4C59',
    darkest: '#1F2933',
    black: '#102A43'
  },
  
  // Semantic colors for feedback
  feedback: {
    success: '#4CAF50',
    info: '#2196F3',
    warning: '#FF9800',
    error: '#F44336'
  },
  
  // Transparent colors (with alpha)
  transparent: {
    light: 'rgba(255, 255, 255, 0.9)',
    dark: 'rgba(0, 0, 0, 0.7)',
    overlay: 'rgba(0, 0, 0, 0.5)'
  }
};

// Typography
export const typography = {
  // Font families
  fontFamily: {
    primary: 'System',  // Default system font
    secondary: 'System', // Can be replaced with custom fonts
    accent: 'System'    // For special text elements
  },
  
  // Font sizes (in pixels)
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40
  },
  
  // Font weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900'
  },
  
  // Line heights (multiplier of font size)
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8
  }
};

// Spacing system (in pixels)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64
};

// Border radius
export const borderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: '50%'
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1
  },
  md: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.0,
    elevation: 3
  },
  lg: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 5.0,
    elevation: 6
  },
  xl: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 8.0,
    elevation: 10
  }
};

// Animation timing
export const animation = {
  fast: 200,
  normal: 300,
  slow: 500
};

// Z-index values
export const zIndex = {
  base: 1,
  elevated: 10,
  dropdown: 100,
  modal: 1000
};

// Screen breakpoints (for responsive design)
export const breakpoints = {
  xs: 0,
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280
};

// Accessibility
export const accessibility = {
  // Minimum touch target size (44x44 pixels per WCAG)
  minTouchTarget: 44,
  
  // Focus outline styles
  focusOutline: {
    borderColor: colors.primary.main,
    borderWidth: 2
  },
  
  // High contrast mode colors
  highContrast: {
    background: colors.neutral.black,
    text: colors.neutral.white,
    border: colors.neutral.white
  }
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
  accessibility
};