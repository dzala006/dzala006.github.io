import React, { useState, useEffect, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Pressable
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import styles from './FeedbackPopup.styled';
import { Typography, Button } from './common';
import { colors } from '../theme/theme';

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
  const [selectedOption, setSelectedOption] = useState(null);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  // Predefined array of feedback questions
  const feedbackQuestions = [
    {
      id: 1,
      question: "How adventurous do you feel right now?",
      type: "options",
      options: ["Very adventurous", "Somewhat adventurous", "Not very adventurous", "Just want to relax"],
      context: "mood"
    },
    {
      id: 2,
      question: "Do you prefer exploring new places or revisiting favorites?",
      type: "options",
      options: ["Always new places", "Mostly new places", "Mostly favorites", "Always favorites"],
      context: "exploration"
    },
    {
      id: 3,
      question: "What type of activity would you enjoy most today?",
      type: "options",
      options: ["Outdoor adventure", "Cultural experience", "Food & dining", "Relaxation"],
      context: "activity"
    },
    {
      id: 4,
      question: "How important is budget in your current plans?",
      type: "options",
      options: ["Very important", "Somewhat important", "Not very important", "Not a concern"],
      context: "budget"
    },
    {
      id: 5,
      question: "Are you in the mood for social activities or solitude?",
      type: "options",
      options: ["Very social", "Somewhat social", "Mostly solitary", "Complete solitude"],
      context: "social"
    },
    {
      id: 6,
      question: "How much time do you have available today?",
      type: "options",
      options: ["Just an hour or two", "Half day", "Full day", "Multiple days"],
      context: "time"
    },
    {
      id: 7,
      question: "What's your energy level right now?",
      type: "options",
      options: ["Very energetic", "Moderately energetic", "Somewhat tired", "Very tired"],
      context: "energy"
    },
    {
      id: 8,
      question: "Any specific dietary preferences for today?",
      type: "text",
      context: "dietary"
    },
    {
      id: 9,
      question: "What's your current transportation preference?",
      type: "options",
      options: ["Walking", "Public transit", "Driving", "Biking"],
      context: "transportation"
    },
    {
      id: 10,
      question: "Any specific interests you'd like to explore today?",
      type: "text",
      context: "interests"
    }
  ];

  // Select a random question when the modal becomes visible
  useEffect(() => {
    if (visible) {
      const randomIndex = Math.floor(Math.random() * feedbackQuestions.length);
      setCurrentQuestion(feedbackQuestions[randomIndex]);
      setResponse('');
      setSelectedOption(null);
      setError('');
      
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Reset animations when modal closes
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  // Handle form submission
  const handleSubmit = () => {
    // Validate response
    if (currentQuestion.type === 'text' && !response.trim()) {
      setError('Please provide a response');
      return;
    }
    
    if (currentQuestion.type === 'options' && selectedOption === null) {
      setError('Please select an option');
      return;
    }
    
    // Clear error if validation passes
    setError('');
    
    // Prepare feedback data
    const feedbackData = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      response: currentQuestion.type === 'options' ? currentQuestion.options[selectedOption] : response,
      context: currentQuestion.context,
      timestamp: new Date().toISOString()
    };
    
    // Update survey data in context
    updateSurveyData({
      responses: {
        [currentQuestion.id]: feedbackData
      }
    });
    
    // Call onSubmit callback if provided
    if (onSubmit) {
      onSubmit(feedbackData);
    }
    
    // Close the modal
    onClose();
  };

  // Render options for multiple choice questions
  const renderOptions = () => {
    if (currentQuestion.type !== 'options' || !currentQuestion.options) {
      return null;
    }
    
    return (
      <View style={styles.optionContainer}>
        {currentQuestion.options.map((option, index) => (
          <Pressable
            key={index}
            style={[
              styles.optionButton,
              selectedOption === index && styles.optionButtonSelected
            ]}
            onPress={() => setSelectedOption(index)}
            accessibilityLabel={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedOption === index }}
          >
            <Text 
              style={[
                styles.optionText,
                selectedOption === index && styles.optionTextSelected
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.header}>
            <Typography variant="h3" center color={colors.primary.main}>
              Quick Feedback
            </Typography>
          </View>
          
          <Typography variant="body1" center style={styles.question}>
            {currentQuestion.question}
          </Typography>
          
          {currentQuestion.type === 'text' ? (
            <TextInput
              style={styles.input}
              value={response}
              onChangeText={setResponse}
              placeholder="Type your response here..."
              multiline
              accessibilityLabel="Feedback response input"
              accessibilityHint="Enter your response to the feedback question"
            />
          ) : (
            renderOptions()
          )}
          
          {error ? (
            <Typography variant="caption" color={colors.error} center>
              {error}
            </Typography>
          ) : null}
          
          <View style={styles.buttonContainer}>
            <Button
              title="Skip"
              variant="outline"
              onPress={onClose}
              style={{ marginRight: 8 }}
              accessibilityLabel="Skip feedback"
              accessibilityHint="Skip providing feedback for now"
            />
            <Button
              title="Submit"
              onPress={handleSubmit}
              style={{ marginLeft: 8 }}
              accessibilityLabel="Submit feedback"
              accessibilityHint="Submit your feedback response"
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default FeedbackPopup;