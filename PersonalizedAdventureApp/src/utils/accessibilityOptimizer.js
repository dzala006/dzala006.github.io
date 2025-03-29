/**
 * Accessibility Optimizer Utility
 * 
 * This utility provides functions for enhancing accessibility in the app,
 * including screen reader support, focus management, and color contrast.
 */

import { AccessibilityInfo, Platform } from 'react-native';
import { colors } from '../theme/theme';

/**
 * Check if screen reader is enabled
 * 
 * @returns {Promise<boolean>} Promise that resolves to true if screen reader is enabled
 */
export const isScreenReaderEnabled = async () => {
  return await AccessibilityInfo.isScreenReaderEnabled();
};

/**
 * Add an accessibility announcement for screen readers
 * 
 * @param {string} message - Message to announce
 */
export const announceForAccessibility = (message) => {
  if (!message) return;
  
  AccessibilityInfo.announceForAccessibility(message);
};

/**
 * Generate accessibility props for a component
 * 
 * @param {Object} options - Accessibility options
 * @param {string} options.label - Accessibility label
 * @param {string} options.hint - Accessibility hint
 * @param {string} options.role - Accessibility role
 * @param {boolean} options.isDisabled - Whether the component is disabled
 * @param {boolean} options.isSelected - Whether the component is selected
 * @param {boolean} options.isChecked - Whether the component is checked
 * @param {boolean} options.isExpanded - Whether the component is expanded
 * @param {boolean} options.isModal - Whether the component is a modal
 * @param {boolean} options.isHeader - Whether the component is a header
 * @param {boolean} options.isLink - Whether the component is a link
 * @param {boolean} options.isButton - Whether the component is a button
 * @returns {Object} Accessibility props
 */
export const getAccessibilityProps = (options = {}) => {
  const {
    label,
    hint,
    role,
    isDisabled = false,
    isSelected = false,
    isChecked = false,
    isExpanded = false,
    isModal = false,
    isHeader = false,
    isLink = false,
    isButton = false
  } = options;
  
  // Base props
  const props = {
    accessible: true
  };
  
  // Add label if provided
  if (label) {
    props.accessibilityLabel = label;
  }
  
  // Add hint if provided
  if (hint) {
    props.accessibilityHint = hint;
  }
  
  // Add role if provided
  if (role) {
    if (Platform.OS === 'ios') {
      props.accessibilityRole = role;
    } else {
      props.accessibilityRole = role;
    }
  } else {
    // Infer role from options
    if (isButton) {
      props.accessibilityRole = 'button';
    } else if (isLink) {
      props.accessibilityRole = 'link';
    } else if (isHeader) {
      props.accessibilityRole = 'header';
    }
  }
  
  // Add state
  const states = {};
  
  if (isDisabled) {
    states.disabled = true;
  }
  
  if (isSelected) {
    states.selected = true;
  }
  
  if (isChecked) {
    states.checked = true;
  }
  
  if (isExpanded) {
    states.expanded = true;
  }
  
  if (isModal) {
    states.modal = true;
  }
  
  // Add states to props
  if (Object.keys(states).length > 0) {
    props.accessibilityState = states;
  }
  
  return props;
};

/**
 * Check if a color combination has sufficient contrast for accessibility
 * 
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {Object} Contrast information
 */
export const checkColorContrast = (foreground, background) => {
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // Calculate relative luminance
  const calculateLuminance = (rgb) => {
    const { r, g, b } = rgb;
    
    // Convert RGB to sRGB
    const sR = r / 255;
    const sG = g / 255;
    const sB = b / 255;
    
    // Calculate luminance
    const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
    const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
    const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  
  // Parse colors
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  if (!fgRgb || !bgRgb) {
    return {
      contrast: 0,
      isAACompliant: false,
      isAAACompliant: false,
      error: 'Invalid color format'
    };
  }
  
  // Calculate luminance
  const fgLuminance = calculateLuminance(fgRgb);
  const bgLuminance = calculateLuminance(bgRgb);
  
  // Calculate contrast ratio
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  const contrast = (lighter + 0.05) / (darker + 0.05);
  
  // Check compliance
  const isAACompliant = contrast >= 4.5;
  const isAAACompliant = contrast >= 7;
  
  return {
    contrast,
    isAACompliant,
    isAAACompliant,
    foreground,
    background
  };
};

/**
 * Get a color with sufficient contrast against a background color
 * 
 * @param {string} backgroundColor - Background color (hex)
 * @param {Array<string>} colorOptions - Array of color options (hex)
 * @returns {string} Color with best contrast
 */
export const getAccessibleColor = (backgroundColor, colorOptions = [colors.text.primary, colors.text.secondary, colors.text.tertiary]) => {
  let bestColor = colorOptions[0];
  let bestContrast = 0;
  
  for (const color of colorOptions) {
    const { contrast } = checkColorContrast(color, backgroundColor);
    
    if (contrast > bestContrast) {
      bestContrast = contrast;
      bestColor = color;
    }
  }
  
  return bestColor;
};

/**
 * Get font size adjusted for accessibility
 * 
 * @param {number} baseSize - Base font size
 * @param {Object} options - Options
 * @param {number} options.minSize - Minimum font size
 * @param {number} options.maxSize - Maximum font size
 * @param {number} options.scaleFactor - Scale factor for accessibility
 * @returns {number} Adjusted font size
 */
export const getAccessibleFontSize = (baseSize, options = {}) => {
  const {
    minSize = 12,
    maxSize = 32,
    scaleFactor = 1.0
  } = options;
  
  // Apply scale factor
  const scaledSize = baseSize * scaleFactor;
  
  // Clamp to min/max
  return Math.min(Math.max(scaledSize, minSize), maxSize);
};

/**
 * Add focus management to a component
 * 
 * @param {React.Component} Component - Component to enhance
 * @returns {React.Component} Enhanced component
 */
export const withFocusManagement = (Component) => {
  return class FocusManagementWrapper extends React.Component {
    constructor(props) {
      super(props);
      this.ref = React.createRef();
    }
    
    componentDidMount() {
      // Set up focus listeners
      this.focusListener = AccessibilityInfo.addEventListener(
        'change',
        this.handleAccessibilityChange
      );
    }
    
    componentWillUnmount() {
      // Clean up focus listeners
      if (this.focusListener?.remove) {
        this.focusListener.remove();
      }
    }
    
    handleAccessibilityChange = (isEnabled) => {
      // Update component when accessibility settings change
      this.forceUpdate();
    };
    
    focus = () => {
      if (this.ref.current) {
        this.ref.current.focus();
      }
    };
    
    render() {
      return (
        <Component
          {...this.props}
          ref={this.ref}
          focus={this.focus}
        />
      );
    }
  };
};

/**
 * Create a focus trap for modal dialogs
 * 
 * @param {Array<React.RefObject>} refs - Array of refs to focusable elements
 * @param {Object} options - Options
 * @param {boolean} options.autoFocus - Whether to auto-focus the first element
 * @param {boolean} options.restoreFocus - Whether to restore focus when unmounted
 * @returns {Object} Focus trap methods
 */
export const createFocusTrap = (refs, options = {}) => {
  const {
    autoFocus = true,
    restoreFocus = true
  } = options;
  
  let currentFocusIndex = 0;
  let previousFocus = null;
  
  // Save current focus
  if (restoreFocus) {
    previousFocus = document.activeElement;
  }
  
  // Auto-focus first element
  if (autoFocus && refs.length > 0 && refs[0].current) {
    refs[0].current.focus();
  }
  
  // Focus next element
  const focusNext = () => {
    currentFocusIndex = (currentFocusIndex + 1) % refs.length;
    if (refs[currentFocusIndex].current) {
      refs[currentFocusIndex].current.focus();
    }
  };
  
  // Focus previous element
  const focusPrevious = () => {
    currentFocusIndex = (currentFocusIndex - 1 + refs.length) % refs.length;
    if (refs[currentFocusIndex].current) {
      refs[currentFocusIndex].current.focus();
    }
  };
  
  // Handle key down
  const handleKeyDown = (event) => {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift+Tab: focus previous
        event.preventDefault();
        focusPrevious();
      } else {
        // Tab: focus next
        event.preventDefault();
        focusNext();
      }
    }
  };
  
  // Clean up
  const cleanup = () => {
    if (restoreFocus && previousFocus) {
      previousFocus.focus();
    }
  };
  
  return {
    focusNext,
    focusPrevious,
    handleKeyDown,
    cleanup
  };
};

export default {
  isScreenReaderEnabled,
  announceForAccessibility,
  getAccessibilityProps,
  checkColorContrast,
  getAccessibleColor,
  getAccessibleFontSize,
  withFocusManagement,
  createFocusTrap
};