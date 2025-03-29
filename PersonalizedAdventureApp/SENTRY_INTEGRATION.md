# Sentry Integration for Personalized Adventure App

This guide explains how to integrate Sentry into the Personalized Adventure App for error tracking, performance monitoring, and user event tracking.

## Step 1: Run the Sentry Wizard

The Sentry wizard will automatically configure your project with the necessary settings. Run the following command in your project root:

```bash
npx @sentry/wizard@latest -i reactNative --saas --org uc-riverside --project react-native
```

This command will:
- Add the necessary Sentry dependencies to your project
- Configure your app.json with Sentry plugins
- Set up source maps upload for better error reporting
- Add initialization code to your App.js

## Step 2: Verify the Installation

After running the wizard, check that the following files have been modified:

1. **app.json** - Should include Sentry plugin configuration:
```json
"plugins": [
  [
    "sentry-expo",
    {
      "organization": "uc-riverside",
      "project": "react-native"
    }
  ]
]
```

2. **App.js** - Should include Sentry initialization:
```javascript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'YOUR_DSN_HERE',
  enableInExpoDevelopment: true,
  debug: true,
});
```

## Step 3: Use the Analytics Utility

Our app already has a comprehensive analytics utility that wraps Sentry functionality. You can use it to track errors, performance, and user events:

```javascript
import * as Analytics from '../utils/analytics';

// Initialize analytics (typically done in App.js)
Analytics.initialize();

// Track errors
try {
  // Some code that might throw an error
} catch (error) {
  Analytics.captureError(error, { 
    context: 'HomeScreen',
    action: 'fetchData' 
  });
}

// Track user events
Analytics.trackEvent('button_clicked', { 
  buttonName: 'Generate Itinerary',
  screenName: 'HomeScreen' 
});

// Track performance
const transaction = Analytics.startPerformanceTracking('generateItinerary', 'computation');
// ... perform the operation
transaction.finish();

// Identify users after login
Analytics.identifyUser(userId, {
  email: userEmail,
  username: userName,
  preferences: userPreferences
});

// Track screen views
Analytics.trackScreenView('ItineraryScreen', { 
  itineraryId: '12345',
  source: 'HomeScreen' 
});
```

## Step 4: Testing the Integration

To verify that Sentry is working correctly:

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

## Step 5: Additional Configuration

### Environment Variables

For production builds, you should set up environment variables for Sentry:

```
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ORG=uc-riverside
SENTRY_PROJECT=react-native
```

### Release Tracking

To track releases in Sentry, make sure your app.json has the correct version:

```json
{
  "expo": {
    "version": "1.0.0",
    // ...
  }
}
```

## Troubleshooting

If you encounter issues with Sentry integration:

1. **Missing DSN**: Ensure the DSN is correctly set in the Sentry.init call
2. **Source Maps Not Working**: Verify that the postPublish hook is correctly configured in app.json
3. **No Events Showing Up**: Check that the organization and project names match your Sentry account

## Resources

- [Sentry React Native Documentation](https://docs.sentry.io/platforms/react-native/)
- [Sentry-Expo Documentation](https://docs.expo.dev/guides/using-sentry/)
- [Sentry Dashboard](https://sentry.io/organizations/uc-riverside/issues/)