import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Modal,
  View,
  TextInput,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Button, Typography } from './common';
import { colors, spacing, borderRadius, shadows, animation } from '../theme/theme';

/**
 * FeedbackPopup Component
 * 
 * A modal popup that randomly selects a feedback question and collects user responses.
 * The responses are used to continuously update user preferences for better personalization.
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Controls the visibility of the modal
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {Function} props.onSubmit - Optional callback function when feedback is submitted
 */
const FeedbackPopup = ({ visible, onClose, onSubmit }) => {
  const { updateSurveyData } = useContext(AuthContext);
  const [response, setResponse] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState({});
  const [error, setError] = useState('');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const inputRef = useRef(null);

  // Predefined array of feedback questions
  const feedbackQuestions = [
    {
      id: 1,
      question: "How adventurous do you feel right now?",
      type: "scale", // Could be used for different input types
      context: "mood",
      placeholder: "Rate from 1-10 or describe your mood"
    },
    {
      id: 2,
      question: "Do you prefer exploring new places or revisiting favorites?",
      type: "preference",
      context: "exploration",
      placeholder: "New places, favorites, or a mix of both?"
    },
    {
      id: 3,
      question: "What type of activity would you enjoy most today?",
      type: "preference",
      context: "activity",
      placeholder: "Outdoor adventure, cultural experience, relaxation..."
    },
    {
      id: 4,
      question: "How important is budget in your current travel decisions?",
      type: "scale",
      context: "budget",
      placeholder: "Very important, somewhat important, not a concern..."
    },
    {
      id: 5,
      question: "Are you looking for relaxation or excitement in your next adventure?",
      type: "preference",
      context: "experience",
      placeholder: "Relaxation, excitement, or a balance of both?"
    },
    {
      id: 6,
      question: "What's your current energy level for activities?",
      type: "scale",
      context: "energy",
      placeholder: "Low energy, moderate, high energy..."
    },
    {
      id: 7,
      question: "Do you prefer indoor or outdoor activities right now?",
      type: "preference",
      context: "environment",
      placeholder: "Indoor, outdoor, or depends on the activity?"
    },
    {
      id: 8,
      question: "How social do you feel? Solo adventures or group experiences?",
      type: "preference",
      context: "social",
      placeholder: "Solo, small group, large group..."
    },
    {
      id: 9,
      question: "What's your current food preference for this trip?",
      type: "preference",
      context: "food",
      placeholder: "Local cuisine, familiar foods, specific diet..."
    },
    {
      id: 10,
      question: "How far are you willing to travel for your next adventure?",
      type: "scale",
      context: "distance",
      placeholder: "Nearby, within city, day trip, weekend getaway..."
    }
  ];

  // Handle animations when visibility changes
  useEffect(() => {
    if (visible) {
      // Select a random question
      const randomIndex = Math.floor(Math.random() * feedbackQuestions.length);
      setCurrentQuestion(feedbackQuestions[randomIndex]);
      setResponse('');
      setError('');
      
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: animation.normal,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        })
      ]).start(() => {
        // Focus the input after animation completes
        if (inputRef.current) {
          inputRef.current.focus();
        }
      });
    } else {
      // Reset animations when modal closes
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, fadeAnim, scaleAnim]);

  // Handle submission of feedback
  const handleSubmit = () => {
    // Validate that a response was provided
    if (!response.trim()) {
      setError('Please provide a response before submitting');
      return;
    }

    // Update the global state with the new feedback
    updateSurveyData({
      responses: {
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          response: response,
          context: currentQuestion.context,
          timestamp: new Date().toISOString()
        }
      }
    });

    // Call the onSubmit callback if provided
    if (onSubmit) {
      onSubmit({
        questionId: currentQuestion.id,
        response: response,
        context: currentQuestion.context
      });
    }

    // Animate out before closing
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: animation.fast,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: animation.fast,
        useNativeDriver: true
      })
    ]).start(() => {
      // Reset and close the modal
      setResponse('');
      onClose();
      
      // Show a thank you message
      Alert.alert(
        "Thank You!",
        "Your feedback helps us personalize your adventure experience.",
        [{ text: "OK", style: "default" }],
        { cancelable: true }
      );
    });
  };

  // Handle closing the modal
  const handleClose = () => {
    // Animate out before closing
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: animation.fast,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: animation.fast,
        useNativeDriver: true
      })
    ]).start(() => {
      onClose();
    });
  };

  // Close when clicking outside the modal (on the overlay)
  const handleOverlayPress = () => {
    handleClose();
  };

  // Prevent closing when clicking on the modal content
  const handleModalPress = (e) => {
    e.stopPropagation();
  };

  return (
    <Modal
      animationType="none" // We'll handle animations ourselves
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableWithoutFeedback onPress={handleModalPress}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <View style={styles.header}>
                <Typography 
                  variant="h4" 
                  color="primary.main"
                  align="center"
                  accessibilityRole="header"
                >
                  Quick Feedback
                </Typography>
              </View>
              
              <View style={styles.content}>
                <Typography 
                  variant="subtitle1" 
                  align="center"
                  style={styles.question}
                  accessibilityLabel={`Question: ${currentQuestion.question}`}
                >
                  {currentQuestion.question}
                </Typography>
                
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder={currentQuestion.placeholder || "Type your response here..."}
                  placeholderTextColor={colors.neutral.base}
                  value={response}
                  onChangeText={setResponse}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                  accessibilityLabel="Response input field"
                  accessibilityHint="Enter your response to the feedback question"
                />
                
                {error ? (
                  <Typography 
                    variant="caption" 
                    color="feedback.error" 
                    align="center"
                    accessibilityLabel={`Error: ${error}`}
                  >
                    {error}
                  </Typography>
                ) : null}
              </View>
              
              <View style={styles.footer}>
                <Button
                  variant="outline"
                  label="Skip"
                  onPress={handleClose}
                  style={styles.skipButton}
                  accessibilityLabel="Skip this feedback question"
                  accessibilityHint="Closes the feedback popup without submitting a response"
                />
                
                <Button
                  variant="primary"
                  label="Submit"
                  onPress={handleSubmit}
                  style={styles.submitButton}
                  accessibilityLabel="Submit your feedback"
                  accessibilityHint="Submits your response and updates your preferences"
                />
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.transparent.overlay,
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg
  },
  header: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lighter,
  },
  content: {
    padding: spacing.lg,
  },
  question: {
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 100,
    fontSize: 16,
    color: colors.neutral.darkest,
    backgroundColor: colors.neutral.lightest,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lighter,
  },
  skipButton: {
    flex: 1,
    marginRight: spacing.xs,
  },
  submitButton: {
    flex: 1,
    marginLeft: spacing.xs,
  }
});

export default FeedbackPopup;