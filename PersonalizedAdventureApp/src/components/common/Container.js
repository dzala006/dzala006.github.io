import React from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { colors, spacing } from '../../theme/theme';

/**
 * Container Component
 * 
 * A layout component that provides consistent padding, safe area handling,
 * and optional scrolling for screen content.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render inside the container
 * @param {boolean} props.scrollable - Whether content should be scrollable
 * @param {boolean} props.safeArea - Whether to use SafeAreaView
 * @param {string} props.backgroundColor - Background color of the container
 * @param {boolean} props.keyboardAvoiding - Whether to avoid keyboard
 * @param {Object} props.style - Additional styles to apply
 * @param {Object} props.contentContainerStyle - Styles for the scroll view content container
 * @param {string} props.testID - Test ID for testing
 */
const Container = ({
  children,
  scrollable = false,
  safeArea = true,
  backgroundColor = colors.neutral.lightest,
  keyboardAvoiding = false,
  style,
  contentContainerStyle,
  testID,
  ...props
}) => {
  // Base container styles
  const containerStyles = [
    styles.container,
    { backgroundColor },
    style
  ];

  // Content to render
  const content = (
    <View style={[styles.content, !scrollable && styles.flex, contentContainerStyle]}>
      {children}
    </View>
  );

  // Wrap content in ScrollView if scrollable
  const scrollableContent = scrollable ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      testID={`${testID}-scroll`}
      {...props}
    >
      {content}
    </ScrollView>
  ) : content;

  // Wrap in KeyboardAvoidingView if needed
  const keyboardAvoidingContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {scrollableContent}
    </KeyboardAvoidingView>
  ) : scrollableContent;

  // Use SafeAreaView if requested
  if (safeArea) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={backgroundColor}
          translucent={false}
        />
        <SafeAreaView style={containerStyles} testID={testID}>
          {keyboardAvoidingContent}
        </SafeAreaView>
      </>
    );
  }

  // Otherwise use a regular View
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={backgroundColor}
        translucent={false}
      />
      <View style={containerStyles} testID={testID}>
        {keyboardAvoidingContent}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.lightest,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default Container;