import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

/**
 * ChatRoom component for real-time communication during collaborative itinerary planning
 * 
 * @param {Object} props - Component props
 * @param {string} props.roomId - Unique identifier for the chat room (typically the itinerary ID)
 * @param {string} props.collaboratorId - ID of the user being collaborated with
 * @param {Function} props.onClose - Function to call when closing the chat
 */
const ChatRoom = ({ roomId, collaboratorId, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingStatus, setTypingStatus] = useState('');
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  // Socket.IO server URL - replace with your actual server URL in production
  const SOCKET_SERVER_URL = 'https://api.personalizedadventure.com';

  useEffect(() => {
    // Initialize Socket.IO connection
    connectToSocket();

    // Cleanup function to disconnect socket when component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  /**
   * Establishes connection to the Socket.IO server
   */
  const connectToSocket = () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create Socket.IO connection with authentication and room information
      socketRef.current = io(SOCKET_SERVER_URL, {
        query: {
          roomId,
          userId: user.id,
          username: user.name
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      // Connection established successfully
      socketRef.current.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
        setIsLoading(false);
        
        // Join the specific room for this itinerary collaboration
        socketRef.current.emit('joinRoom', { roomId, userId: user.id, username: user.name });
      });

      // Handle connection errors
      socketRef.current.on('connect_error', (err) => {
        console.error('Connection error:', err);
        setError(t('chat.errors.connectionFailed'));
        setIsLoading(false);
        setIsConnected(false);
      });

      // Handle disconnection
      socketRef.current.on('disconnect', (reason) => {
        console.log('Disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          socketRef.current.connect();
        }
      });

      // Listen for incoming messages
      socketRef.current.on('message', (message) => {
        setMessages(prevMessages => [...prevMessages, message]);
        // Scroll to bottom when new message arrives
        if (flatListRef.current) {
          setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 100);
        }
      });

      // Listen for typing status updates
      socketRef.current.on('typingStatus', ({ username, isTyping }) => {
        if (isTyping && username !== user.name) {
          setTypingStatus(`${username} ${t('chat.isTyping')}`);
        } else {
          setTypingStatus('');
        }
      });

      // Listen for chat history when joining a room
      socketRef.current.on('chatHistory', (history) => {
        setMessages(history);
        // Scroll to bottom when history is loaded
        if (flatListRef.current) {
          setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 100);
        }
      });

    } catch (err) {
      console.error('Socket initialization error:', err);
      setError(t('chat.errors.initializationFailed'));
      setIsLoading(false);
    }
  };

  /**
   * Sends a message to the chat room
   */
  const sendMessage = () => {
    if (!inputMessage.trim() || !isConnected) return;

    const messageData = {
      text: inputMessage.trim(),
      senderId: user.id,
      senderName: user.name,
      timestamp: new Date().toISOString(),
      roomId
    };

    // Emit message to server
    socketRef.current.emit('sendMessage', messageData);
    
    // Clear input field
    setInputMessage('');
    
    // Stop typing indicator
    socketRef.current.emit('typing', { roomId, username: user.name, isTyping: false });
  };

  /**
   * Handles typing indicator
   */
  const handleTyping = (text) => {
    setInputMessage(text);
    
    if (isConnected) {
      socketRef.current.emit('typing', { 
        roomId, 
        username: user.name, 
        isTyping: text.length > 0 
      });
    }
  };

  /**
   * Attempts to reconnect to the Socket.IO server
   */
  const handleReconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    connectToSocket();
  };

  /**
   * Renders a chat message item
   */
  const renderMessageItem = ({ item }) => {
    const isOwnMessage = item.senderId === user.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  // Show loading indicator while connecting
  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('chat.connecting')}</Text>
      </View>
    );
  }

  // Show error message with retry button if connection failed
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={handleReconnect}
          accessibilityLabel={t('chat.retry')}
          accessibilityHint={t('chat.retryHint')}
        >
          <Text style={styles.retryButtonText}>{t('chat.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('chat.roomTitle', { collaborator: collaboratorId })}
        </Text>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
          accessibilityLabel={t('chat.close')}
          accessibilityHint={t('chat.closeHint')}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.connectionStatus}>
        <View style={[
          styles.statusIndicator, 
          isConnected ? styles.connectedIndicator : styles.disconnectedIndicator
        ]} />
        <Text style={styles.statusText}>
          {isConnected ? t('chat.connected') : t('chat.disconnected')}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item, index) => `${item.timestamp}-${index}`}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
      />

      {typingStatus ? (
        <Text style={styles.typingStatus}>{typingStatus}</Text>
      ) : null}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={handleTyping}
          placeholder={t('chat.inputPlaceholder')}
          placeholderTextColor={colors.textLight}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
          editable={isConnected}
          accessibilityLabel={t('chat.inputAccessibilityLabel')}
          accessibilityHint={t('chat.inputAccessibilityHint')}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!inputMessage.trim() || !isConnected) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!inputMessage.trim() || !isConnected}
          accessibilityLabel={t('chat.send')}
          accessibilityHint={t('chat.sendHint')}
        >
          <Text style={styles.sendButtonText}>{t('chat.send')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.medium,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: spacing.small,
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.white,
    fontWeight: 'bold',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.small,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.small,
  },
  connectedIndicator: {
    backgroundColor: colors.success,
  },
  disconnectedIndicator: {
    backgroundColor: colors.error,
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.medium,
  },
  messageContainer: {
    marginBottom: spacing.medium,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  senderName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  messageBubble: {
    padding: spacing.medium,
    borderRadius: 16,
    marginBottom: 4,
  },
  ownMessageBubble: {
    backgroundColor: colors.primary,
  },
  otherMessageBubble: {
    backgroundColor: colors.backgroundLight,
  },
  messageText: {
    ...typography.body,
    color: colors.text,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textSecondary,
    alignSelf: 'flex-end',
  },
  typingStatus: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    padding: spacing.small,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  input: {
    flex: 1,
    ...typography.body,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    marginRight: spacing.small,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: spacing.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  sendButtonText: {
    ...typography.button,
    color: colors.white,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.medium,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.medium,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.small,
    borderRadius: 20,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.white,
  },
});

export default ChatRoom;