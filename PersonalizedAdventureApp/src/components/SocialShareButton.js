import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  View,
  Platform
} from 'react-native';
import { Share } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme/theme';

/**
 * SocialShareButton Component
 * 
 * A button component that enables users to share itinerary details on social media.
 * Uses the React Native Share API to format and share content, including text and images.
 * 
 * @param {Object} props
 * @param {string} props.title - Title of the content to share (e.g., itinerary title)
 * @param {string} props.message - Message to include in the share (e.g., itinerary summary)
 * @param {string} [props.url] - Optional URL to include in the share
 * @param {string} [props.imageUrl] - Optional image URL to include in the share (not supported on all platforms)
 * @param {Function} [props.onShareComplete] - Callback function called after successful sharing
 * @param {Function} [props.onShareError] - Callback function called if sharing fails
 * @param {string} [props.buttonText='Share Itinerary'] - Text to display on the button
 * @param {string} [props.variant='primary'] - Button style variant (primary, secondary, outline)
 * @param {string} [props.size='medium'] - Button size (small, medium, large)
 * @param {Object} [props.style] - Additional styles to apply to the button
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {string} [props.accessibilityLabel] - Accessibility label for screen readers
 * @param {string} [props.accessibilityHint] - Accessibility hint for screen readers
 */
const SocialShareButton = ({
  title,
  message,
  url,
  imageUrl,
  onShareComplete,
  onShareError,
  buttonText = 'Share Itinerary',
  variant = 'primary',
  size = 'medium',
  style,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  ...props
}) => {
  const [isSharing, setIsSharing] = useState(false);

  /**
   * Handles the share action using React Native's Share API
   * Formats the content based on the provided props and shows the native share dialog
   */
  const handleShare = async () => {
    if (disabled || isSharing) return;
    
    setIsSharing(true);
    
    try {
      // Prepare share content
      const shareContent = {
        title: title,
        message: message,
      };
      
      // Add URL if provided
      if (url) {
        shareContent.url = url;
      }
      
      // Note: Image sharing is limited on some platforms
      // For advanced image sharing, a third-party library like react-native-share would be needed
      if (imageUrl && Platform.OS === 'ios') {
        // On iOS, we can sometimes include an image URL
        shareContent.url = imageUrl;
      }
      
      // Show the native share dialog
      const result = await Share.share(shareContent, {
        // Additional share options
        dialogTitle: `Share ${title}`,
        subject: title, // For email sharing
      });
      
      // Handle share result
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type
          console.log(`Shared with activity type: ${result.activityType}`);
        } else {
          // Shared
          console.log('Shared successfully');
        }
        
        // Call the onShareComplete callback if provided
        if (onShareComplete) {
          onShareComplete(result);
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log('Share dismissed');
      }
    } catch (error) {
      // Handle errors
      console.error('Error sharing content:', error);
      Alert.alert(
        'Sharing Failed',
        'There was an error sharing this content. Please try again later.',
        [{ text: 'OK' }]
      );
      
      // Call the onShareError callback if provided
      if (onShareError) {
        onShareError(error);
      }
    } finally {
      setIsSharing(false);
    }
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
      default:
        baseStyles.push(styles.primaryButton);
    }
    
    // Disabled state
    if (disabled || isSharing) {
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
      default:
        baseStyles.push(styles.primaryText);
    }
    
    // Disabled state
    if (disabled || isSharing) {
      baseStyles.push(styles.disabledText);
    }
    
    return baseStyles;
  };

  return (
    <TouchableOpacity
      onPress={handleShare}
      disabled={disabled || isSharing}
      style={[...getButtonStyles(), style]}
      accessibilityLabel={accessibilityLabel || buttonText}
      accessibilityHint={accessibilityHint || `Share ${title} on social media`}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isSharing }}
      {...props}
    >
      <View style={styles.buttonContent}>
        {isSharing ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' ? colors.primary.main : colors.primary.contrast} 
          />
        ) : (
          <>
            <Text style={getTextStyles()}>{buttonText}</Text>
            {/* Share icon could be added here with a library like react-native-vector-icons */}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: colors.accent.main,
    ...shadows.sm,
  },
  secondaryButton: {
    backgroundColor: colors.secondary.main,
    ...shadows.sm,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent.main,
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
    color: colors.accent.contrast,
  },
  secondaryText: {
    color: colors.secondary.contrast,
  },
  outlineText: {
    color: colors.accent.main,
  },
  
  // Disabled text
  disabledText: {
    color: colors.text.disabled,
  },
});

export default SocialShareButton;