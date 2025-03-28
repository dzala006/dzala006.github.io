import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import { Platform } from 'react-native';

/**
 * Configure notification behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'android') {
    // Android doesn't require permission for local notifications
    return true;
  }

  const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
  let finalStatus = existingStatus;

  // Only ask if permissions have not already been determined
  if (existingStatus !== 'granted') {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

/**
 * Schedule a notification to be delivered
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification body text
 * @param {Object} [options.data={}] - Additional data to include with the notification
 * @param {Date|number|null} [options.triggerTime=null] - When to trigger the notification:
 *   - If null: notification is sent immediately
 *   - If number: seconds from now to trigger
 *   - If Date: specific date/time to trigger
 * @returns {Promise<string>} Notification identifier
 */
export const scheduleNotification = async ({
  title,
  message,
  data = {},
  triggerTime = null
}) => {
  try {
    // Ensure we have permission
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return null;
    }

    // Configure notification content
    const notificationContent = {
      title,
      body: message,
      data: { ...data, timestamp: new Date().getTime() },
      sound: true,
    };

    // Configure notification trigger
    let trigger;
    if (triggerTime === null) {
      // Send immediately (no trigger needed)
      trigger = null;
    } else if (typeof triggerTime === 'number') {
      // Send after specified number of seconds
      trigger = { seconds: triggerTime };
    } else if (triggerTime instanceof Date) {
      // Send at specific date/time
      trigger = { date: triggerTime };
    } else {
      console.error('Invalid triggerTime format');
      return null;
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
    });

    console.log(`Notification scheduled: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Cancel all scheduled notifications
 * @returns {Promise<void>}
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications canceled');
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

/**
 * Cancel a specific notification by ID
 * @param {string} notificationId - ID of the notification to cancel
 * @returns {Promise<void>}
 */
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Notification ${notificationId} canceled`);
  } catch (error) {
    console.error(`Error canceling notification ${notificationId}:`, error);
  }
};

/**
 * Set up a notification listener
 * @param {Function} handler - Function to call when a notification is received
 * @returns {Function} Function to remove the listener
 */
export const addNotificationListener = (handler) => {
  const subscription = Notifications.addNotificationReceivedListener(handler);
  return () => subscription.remove();
};

/**
 * Set up a notification response listener (when user taps notification)
 * @param {Function} handler - Function to call when a notification is tapped
 * @returns {Function} Function to remove the listener
 */
export const addNotificationResponseListener = (handler) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(handler);
  return () => subscription.remove();
};

/**
 * Get all pending notification requests
 * @returns {Promise<Array>} Array of pending notification requests
 */
export const getPendingNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
  }
};

/**
 * Send a welcome notification when the app starts
 */
export const sendWelcomeNotification = async () => {
  await scheduleNotification({
    title: 'Welcome to Personalized Adventure!',
    message: 'We\'re excited to help you plan your next adventure.',
    data: { screen: 'Home' },
    triggerTime: 5 // Send after 5 seconds
  });
};