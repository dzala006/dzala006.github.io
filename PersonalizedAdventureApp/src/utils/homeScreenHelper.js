/**
 * Helper functions for the HomeScreen component
 */

/**
 * Formats a greeting based on time of day and user name
 * @param {string} userName - The user's name
 * @returns {string} A personalized greeting
 */
export const getTimeBasedGreeting = (userName) => {
  const hour = new Date().getHours();
  let greeting = '';
  
  if (hour < 12) {
    greeting = 'Good morning';
  } else if (hour < 18) {
    greeting = 'Good afternoon';
  } else {
    greeting = 'Good evening';
  }
  
  return `${greeting}, ${userName || 'Guest'}!`;
};

/**
 * Generates recommendation cards based on user preferences
 * @param {Object} preferences - User preferences object
 * @returns {Array} Array of recommendation objects
 */
export const generateRecommendations = (preferences) => {
  // This would normally fetch from an API or use more complex logic
  // For now, we'll return some dummy recommendations
  const recommendations = [
    {
      id: 1,
      title: 'Weekend Getaway',
      description: 'Based on your preferences, we\'ve curated a perfect weekend escape.',
      type: 'itinerary'
    },
    {
      id: 2,
      title: 'Local Food Tour',
      description: 'Discover the best local cuisine that matches your taste preferences.',
      type: 'food'
    },
    {
      id: 3,
      title: 'Adventure Day',
      description: 'Exciting outdoor activities tailored to your adventure level.',
      type: 'adventure'
    }
  ];
  
  // In a real app, we would filter based on preferences
  return recommendations;
};

/**
 * Determines if it's time to show the feedback popup
 * @param {Object} lastFeedback - Object containing timestamp of last feedback
 * @param {number} intervalMinutes - Interval in minutes between feedback prompts
 * @returns {boolean} Whether to show feedback popup
 */
export const shouldShowFeedback = (lastFeedback, intervalMinutes = 30) => {
  if (!lastFeedback || !lastFeedback.timestamp) {
    return true;
  }
  
  const lastFeedbackTime = new Date(lastFeedback.timestamp).getTime();
  const currentTime = new Date().getTime();
  const timeDifference = currentTime - lastFeedbackTime;
  const intervalMs = intervalMinutes * 60 * 1000;
  
  return timeDifference >= intervalMs;
};