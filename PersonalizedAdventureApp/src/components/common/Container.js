import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing } from '../../theme/theme';

/**
 * Container Component
 * 
 * A layout component that provides consistent padding, safe area handling,
 * and optional scrolling for screen content.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render inside the container
 * @param {boolean} [props.scrollable=false] - Whether content should be scrollable
 * @param {boolean} [props.safeArea=true] - Whether to use SafeAreaView
 * @param {boolean} [props.keyboardAvoiding=false] - Whether to avoid keyboard
 * @param {string} [props.backgroundColor] - Background color (overrides default)
 * @param {Object} [props.style] - Additional styles to apply to the container
 * @param {Object} [props.contentContainerStyle] - Styles for the scroll view content container
 */
const Container = ({
  children,
  scrollable = false,
  safeArea = true,
  keyboardAvoiding = false,
  backgroundColor,
  style,
  contentContainerStyle,
  ...props
}) => {
  // Base container styles
  const containerStyles = [
    styles.container,
    backgroundColor ? { backgroundColor } : null,
    style,
  ];

  // Content to render inside the container
  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentContainerStyle]} {...props}>
      {children}
    </View>
  );

  // Wrap in KeyboardAvoidingView if needed
  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  // Use SafeAreaView if requested
  if (safeArea) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={backgroundColor || colors.background.primary}
        />
        <SafeAreaView style={containerStyles}>
          {wrappedContent}
        </SafeAreaView>
      </>
    );
  }

  // Otherwise, use a regular View
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={backgroundColor || colors.background.primary}
      />
      <View style={containerStyles}>
        {wrappedContent}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  keyboardAvoiding: {
    flex: 1,
  },
});

export default Container;