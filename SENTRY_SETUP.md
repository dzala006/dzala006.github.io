# Setting Up Sentry for Personalized Adventure App

This guide will walk you through setting up Sentry for error tracking, performance monitoring, and user event tracking in your React Native app.

## Step 1: Install Sentry Wizard

Run the following command in your project root:

```bash
npx @sentry/wizard@latest -i reactNative --saas --org uc-riverside --project react-native
```

The Sentry wizard will automatically:
- Configure the SDK with your DSN
- Add source maps upload to your build process
- Add debug symbols upload to your build process

## Step 2: Verify Installation

After running the wizard, check that the following files have been modified:
- `app.json` (or `app.config.js`) - Should include Sentry plugin configuration
- `App.js` - Should include Sentry initialization

## Step 3: Integrate with Analytics Utility

Our app already has an analytics utility (`utils/analytics.js`) that wraps Sentry functionality. Update it with your DSN:

1. Open `PersonalizedAdventureApp/src/utils/analytics.js`
2. Replace the placeholder DSN with your actual DSN from Sentry
3. Ensure all imports are correctly set up

## Step 4: Test the Integration

1. Add a test error in your app:
```javascript
import * as Analytics from '../utils/analytics';

// Somewhere in your component
try {
  throw new Error('Test error for Sentry');
} catch (error) {
  Analytics.captureError(error);
}
```

2. Run your app and trigger the error
3. Check your Sentry dashboard to verify the error was captured

## Step 5: Configure Additional Features

### Performance Monitoring

Performance monitoring is already set up in our analytics utility. Key transactions like itinerary generation and user authentication are automatically tracked.

### User Identification

When a user logs in, we automatically set their identity in Sentry using:

```javascript
Analytics.identifyUser(userId, {
  email: userEmail,
  username: userName
});
```

### Custom Events

Track custom events using:

```javascript
Analytics.trackEvent('event_name', {
  // Additional data
  property1: 'value1',
  property2: 'value2'
});
```

## Troubleshooting

If you encounter issues:

1. Verify your DSN is correct
2. Check that all required dependencies are installed
3. Ensure your Sentry project is configured for React Native
4. Check the Sentry documentation for specific platform issues

## Additional Resources

- [Sentry React Native Documentation](https://docs.sentry.io/platforms/react-native/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry User Feedback](https://docs.sentry.io/product/user-feedback/)