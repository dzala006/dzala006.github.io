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
  try {
    // For iOS, we need to request permissions
    if (Platform.OS === 'ios') {
      const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
      let finalStatus = existingStatus;
      
      // Only ask if permissions have not already been determined
      if (existingStatus !== 'granted') {
        const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
        finalStatus = status;
      }
      
      // Return false if permission was not granted
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Schedule a push notification
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {Object} options.data - Additional data to include with the notification
 * @param {Date|number|null} options.triggerTime - When to trigger the notification:
 *   - Date object: Schedule for a specific date/time
 *   - Number: Schedule after this many seconds
 *   - null: Send immediately
 * @returns {Promise<string|null>} Notification identifier or null if failed
 */
export const scheduleNotification = async ({ title, message, data = {}, triggerTime = null }) => {
  try {
    // Ensure we have permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Cannot schedule notification: permissions not granted');
      return null;
    }

    // Configure the notification content
    const notificationContent = {
      title,
      body: message,
      data,
      sound: true,
    };

    // Configure the trigger based on triggerTime
    let trigger;
    if (triggerTime === null) {
      // No trigger means send immediately
      trigger = null;
    } else if (triggerTime instanceof Date) {
      // Date object means schedule for that specific time
      trigger = {
        channelId: 'default',
        date: triggerTime,
      };
    } else if (typeof triggerTime === 'number') {
      // Number means schedule after this many seconds
      trigger = {
        channelId: 'default',
        seconds: triggerTime,
      };
    } else {
      console.error('Invalid triggerTime format');
      return null;
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
    });

    console.log(`Notification scheduled with ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Cancel a specific notification
 * @param {string} notificationId - ID of the notification to cancel
 * @returns {Promise<void>}
 */
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Notification ${notificationId} cancelled`);
  } catch (error) {
    console.error(`Error cancelling notification ${notificationId}:`, error);
  }
};

/**
 * Cancel all scheduled notifications
 * @returns {Promise<void>}
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
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
 * Set up a notification listener
 * @param {Function} handler - Function to call when a notification is received
 * @returns {Object} Subscription object that should be removed when no longer needed
 */
export const addNotificationListener = (handler) => {
  return Notifications.addNotificationReceivedListener(handler);
};

/**
 * Set up a notification response listener (when user taps on notification)
 * @param {Function} handler - Function to call when a notification is tapped
 * @returns {Object} Subscription object that should be removed when no longer needed
 */
export const addNotificationResponseListener = (handler) => {
  return Notifications.addNotificationResponseReceivedListener(handler);
};

/**
 * Remove a notification listener
 * @param {Object} subscription - Subscription returned by addNotificationListener
 */
export const removeNotificationListener = (subscription) => {
  Notifications.removeNotificationSubscription(subscription);
};