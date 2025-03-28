import React, { useState, useEffect, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

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

  // Predefined array of feedback questions
  const feedbackQuestions = [
    {
      id: 1,
      question: "How adventurous do you feel right now?",
      type: "scale", // Could be used for different input types
      context: "mood"
    },
    {
      id: 2,
      question: "Do you prefer exploring new places or revisiting favorites?",
      type: "preference",
      context: "exploration"
    },
    {
      id: 3,
      question: "What type of activity would you enjoy most today?",
      type: "preference",
      context: "activity"
    },
    {
      id: 4,
      question: "How important is budget in your current travel decisions?",
      type: "scale",
      context: "budget"
    },
    {
      id: 5,
      question: "Are you looking for relaxation or excitement in your next adventure?",
      type: "preference",
      context: "experience"
    },
    {
      id: 6,
      question: "What's your current energy level for activities?",
      type: "scale",
      context: "energy"
    },
    {
      id: 7,
      question: "Do you prefer indoor or outdoor activities right now?",
      type: "preference",
      context: "environment"
    },
    {
      id: 8,
      question: "How social do you feel? Solo adventures or group experiences?",
      type: "preference",
      context: "social"
    },
    {
      id: 9,
      question: "What's your current food preference for this trip?",
      type: "preference",
      context: "food"
    },
    {
      id: 10,
      question: "How far are you willing to travel for your next adventure?",
      type: "scale",
      context: "distance"
    }
  ];

  // Select a random question when the component mounts or when the modal becomes visible
  useEffect(() => {
    if (visible) {
      const randomIndex = Math.floor(Math.random() * feedbackQuestions.length);
      setCurrentQuestion(feedbackQuestions[randomIndex]);
      setResponse('');
      setError('');
    }
  }, [visible]);

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

    // Reset and close the modal
    setResponse('');
    onClose();

    // Show a thank you message
    Alert.alert(
      "Thank You!",
      "Your feedback helps us personalize your adventure experience.",
      [{ text: "OK" }]
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Quick Feedback</Text>
          
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Type your response here..."
            value={response}
            onChangeText={setResponse}
            multiline={true}
            numberOfLines={3}
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={onClose}
            >
              <Text style={styles.buttonCancelText}>Skip</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.buttonSubmit]}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonSubmitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#4a90e2'
  },
  questionText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    textAlignVertical: 'top',
    fontSize: 16
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  button: {
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    flex: 1,
    alignItems: 'center'
  },
  buttonSubmit: {
    backgroundColor: '#4a90e2',
    marginLeft: 10
  },
  buttonCancel: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10
  },
  buttonSubmitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  buttonCancelText: {
    color: '#666',
    fontSize: 16
  }
});

export default FeedbackPopup;