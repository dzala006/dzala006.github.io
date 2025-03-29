# Personalized Adventure App - Deployment Guide

This guide provides comprehensive instructions for deploying the Personalized Adventure App to production environments. It covers both the backend (Node.js/Express) and frontend (React Native/Expo) components of the application.

## Table of Contents

1. [Backend Deployment](#backend-deployment)
   - [Preparing for Deployment](#preparing-for-deployment)
   - [Deploying to Heroku](#deploying-to-heroku)
   - [Deploying to AWS](#deploying-to-aws)
   - [Deploying to DigitalOcean](#deploying-to-digitalocean)
   - [Environment Variables](#environment-variables)
   - [Security Configuration](#security-configuration)

2. [Frontend Deployment](#frontend-deployment)
   - [Building with Expo](#building-with-expo)
   - [Publishing to App Stores](#publishing-to-app-stores)
   - [Environment Configuration](#environment-configuration)

3. [Database Setup](#database-setup)
   - [MongoDB Atlas Configuration](#mongodb-atlas-configuration)
   - [Database Security](#database-security)
   - [Backup and Recovery](#backup-and-recovery)

4. [Authentication and Security](#authentication-and-security)
   - [JWT Configuration](#jwt-configuration)
   - [OAuth Integration](#oauth-integration)
   - [Security Best Practices](#security-best-practices)

5. [Monitoring and Error Tracking](#monitoring-and-error-tracking)
   - [Sentry Integration](#sentry-integration)
   - [Performance Monitoring](#performance-monitoring)

6. [CI/CD Pipeline](#cicd-pipeline)
   - [GitHub Actions Configuration](#github-actions-configuration)
   - [Automated Deployments](#automated-deployments)

7. [Testing in Production](#testing-in-production)
   - [Smoke Testing](#smoke-testing)
   - [User Acceptance Testing](#user-acceptance-testing)

8. [Troubleshooting](#troubleshooting)
   - [Common Issues](#common-issues)
   - [Logs and Debugging](#logs-and-debugging)

## Backend Deployment

### Preparing for Deployment

Before deploying the backend, ensure you have:

1. A production-ready MongoDB database (preferably MongoDB Atlas)
2. All environment variables configured
3. Updated CORS settings for production
4. Proper error handling and logging
5. Security measures in place

Run the following commands to prepare your backend for deployment:

```bash
# Navigate to the backend directory
cd personalized-adventure-backend

# Install dependencies
npm install

# Run tests to ensure everything is working
npm test
```

### Deploying to Heroku

Heroku is a platform as a service (PaaS) that enables developers to build, run, and operate applications entirely in the cloud.

#### Prerequisites

1. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
2. Heroku account
3. Git repository initialized

#### Deployment Steps

1. **Login to Heroku**

```bash
heroku login
```

2. **Create a new Heroku app**

```bash
heroku create personalized-adventure-backend
```

3. **Add MongoDB add-on or configure environment variables for MongoDB Atlas**

```bash
# If using MongoDB Atlas, set the URI as an environment variable
heroku config:set MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"

# Set JWT secret
heroku config:set JWT_SECRET="your-secure-jwt-secret"

# Set other environment variables
heroku config:set NODE_ENV="production"
heroku config:set ALLOWED_ORIGINS="https://your-frontend-domain.com"
```

4. **Deploy the application**

```bash
# From the root of your repository
git subtree push --prefix personalized-adventure-backend heroku main
```

5. **Verify deployment**

```bash
heroku open
```

Visit `https://personalized-adventure-backend.herokuapp.com/` to confirm the API is running.

### Deploying to AWS

AWS provides multiple services for deploying Node.js applications. We'll focus on AWS Elastic Beanstalk, which is a simple way to deploy and scale web applications.

#### Prerequisites

1. [AWS CLI](https://aws.amazon.com/cli/) installed and configured
2. [EB CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html) installed
3. AWS account

#### Deployment Steps

1. **Initialize Elastic Beanstalk in your project**

```bash
cd personalized-adventure-backend
eb init
```

Follow the prompts to configure your application:
- Select a region
- Create a new application or use an existing one
- Select Node.js as the platform
- Set up SSH for instance access (optional)

2. **Create an environment**

```bash
eb create personalized-adventure-prod
```

3. **Configure environment variables**

```bash
eb setenv MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority" JWT_SECRET="your-secure-jwt-secret" NODE_ENV="production" ALLOWED_ORIGINS="https://your-frontend-domain.com"
```

4. **Deploy the application**

```bash
eb deploy
```

5. **Verify deployment**

```bash
eb open
```

### Deploying to DigitalOcean

DigitalOcean App Platform provides a simple way to deploy Node.js applications.

#### Prerequisites

1. DigitalOcean account
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

#### Deployment Steps

1. **Create a new app on DigitalOcean App Platform**
   - Log in to your DigitalOcean account
   - Navigate to the App Platform section
   - Click "Create App"
   - Select your repository and branch
   - Select the backend directory (`personalized-adventure-backend`)

2. **Configure the app**
   - Select Node.js as the environment
   - Set the run command to `npm start`
   - Configure environment variables (MONGO_URI, JWT_SECRET, NODE_ENV, ALLOWED_ORIGINS)
   - Select your preferred plan

3. **Deploy the app**
   - Click "Deploy to Production"

4. **Verify deployment**
   - Once deployment is complete, click on the app URL to verify it's running

### Environment Variables

The following environment variables should be configured for production:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port on which the server will run | `8080` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for JWT token generation | `your-secure-jwt-secret` |
| `NODE_ENV` | Environment mode | `production` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins for CORS | `https://your-frontend-domain.com,https://www.your-frontend-domain.com` |

### Security Configuration

The backend includes several security features that should be properly configured for production:

1. **CORS Configuration**

The CORS settings in `server.js` are already configured to use the `ALLOWED_ORIGINS` environment variable in production:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || 'https://yourdomain.com' 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
```

2. **Helmet for HTTP Headers**

Helmet is already configured to set secure HTTP headers:

```javascript
app.use(helmet());
```

3. **Rate Limiting**

Rate limiting is configured for authentication routes to prevent brute force attacks:

```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  // other options...
});

// Apply to authentication routes
app.use('/api/users/login', authLimiter);
```

4. **XSS Protection**

XSS protection is enabled using xss-clean:

```javascript
app.use(xssClean());
```

5. **Parameter Pollution Prevention**

HPP is used to prevent parameter pollution:

```javascript
app.use(hpp());
```

## Frontend Deployment

### Building with Expo

Expo provides several ways to build and deploy your React Native application. The Personalized Adventure App uses Expo for its frontend, which simplifies the build and deployment process.

#### Prerequisites

1. [Expo CLI](https://docs.expo.dev/get-started/installation/) installed
2. Expo account
3. [eas-cli](https://docs.expo.dev/build/setup/) installed

#### Setting Up EAS Build

Expo Application Services (EAS) is the recommended way to build and deploy Expo applications. To set up EAS:

1. **Install EAS CLI**

```bash
npm install -g eas-cli
```

2. **Login to your Expo account**

```bash
eas login
```

3. **Configure EAS in your project**

Navigate to the frontend directory and initialize EAS:

```bash
cd PersonalizedAdventureApp
eas build:configure
```

This will create an `eas.json` file in your project with default build profiles.

4. **Update eas.json for production builds**

Edit the `eas.json` file to include production build configurations:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  }
}
```

#### Building for iOS

To build your app for iOS:

1. **Configure app.json**

Ensure your `app.json` file has the necessary iOS configuration:

```json
{
  "expo": {
    "name": "Personalized Adventure App",
    "slug": "personalized-adventure-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.personalizedadventure",
      "buildNumber": "1"
    }
  }
}
```

2. **Start the build process**

```bash
eas build --platform ios --profile production
```

3. **Follow the prompts**

EAS will guide you through the process, including:
- Generating or uploading certificates and provisioning profiles
- Building the app on Expo's servers
- Providing a download link for the IPA file

#### Building for Android

To build your app for Android:

1. **Configure app.json**

Ensure your `app.json` file has the necessary Android configuration:

```json
{
  "expo": {
    "name": "Personalized Adventure App",
    "slug": "personalized-adventure-app",
    "version": "1.0.0",
    "android": {
      "package": "com.yourcompany.personalizedadventure",
      "versionCode": 1
    }
  }
}
```

2. **Start the build process**

```bash
eas build --platform android --profile production
```

3. **Follow the prompts**

EAS will guide you through the process, including:
- Generating or uploading a keystore
- Building the app on Expo's servers
- Providing a download link for the APK/AAB file

### Publishing to App Stores

#### iOS App Store

To publish your app to the iOS App Store:

1. **Create an App Store Connect entry**
   - Log in to [App Store Connect](https://appstoreconnect.apple.com/)
   - Create a new app entry with your bundle identifier
   - Fill in all required metadata, screenshots, and app information

2. **Submit the build**
   - Use EAS Submit to upload your build to App Store Connect:
   ```bash
   eas submit --platform ios
   ```
   - Alternatively, upload the IPA file manually through Transporter

3. **Complete the submission process**
   - In App Store Connect, select your build
   - Complete the submission form
   - Submit for review

#### Google Play Store

To publish your app to the Google Play Store:

1. **Create a Google Play Console entry**
   - Log in to [Google Play Console](https://play.google.com/console/)
   - Create a new app entry
   - Fill in all required metadata, screenshots, and app information

2. **Submit the build**
   - Use EAS Submit to upload your build to Google Play:
   ```bash
   eas submit --platform android
   ```
   - Alternatively, upload the AAB file manually through the Google Play Console

3. **Complete the submission process**
   - In Google Play Console, navigate to your app
   - Set up pricing and distribution
   - Submit for review

### Environment Configuration

For the frontend to communicate with your production backend, you need to configure the API endpoint and other environment variables.

#### Using app.config.js

Instead of hardcoding environment variables, use `app.config.js` to manage different environments:

1. **Create app.config.js**

```javascript
// app.config.js
const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

export default {
  name: IS_DEV ? 'PA App (Dev)' : IS_PREVIEW ? 'PA App (Preview)' : 'Personalized Adventure',
  slug: 'personalized-adventure-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_DEV 
      ? 'com.yourcompany.personalizedadventure.dev' 
      : 'com.yourcompany.personalizedadventure'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    package: IS_DEV 
      ? 'com.yourcompany.personalizedadventure.dev' 
      : 'com.yourcompany.personalizedadventure'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  extra: {
    apiUrl: IS_DEV 
      ? 'http://localhost:3000/api' 
      : IS_PREVIEW 
        ? 'https://staging-api.personalizedadventure.com/api' 
        : 'https://api.personalizedadventure.com/api',
    eas: {
      projectId: 'your-project-id'
    }
  },
  plugins: [
    'sentry-expo'
  ]
};
```

2. **Access environment variables in your app**

```javascript
import Constants from 'expo-constants';

const API_URL = Constants.manifest.extra.apiUrl;

// Use API_URL for your API requests
const fetchData = async () => {
  const response = await fetch(`${API_URL}/itineraries`);
  // ...
};
```

#### Building for Different Environments

With the configuration above, you can build for different environments:

```bash
# Development build
eas build --profile development --platform ios

# Preview/Staging build
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform ios
```

## Database Setup

### MongoDB Atlas Configuration

MongoDB Atlas is a fully-managed cloud database service that is recommended for production deployments of the Personalized Adventure App.

#### Creating a MongoDB Atlas Cluster

1. **Sign up for MongoDB Atlas**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create an account or sign in

2. **Create a new project**
   - Click "New Project"
   - Name your project (e.g., "Personalized Adventure")
   - Click "Create Project"

3. **Create a new cluster**
   - Click "Build a Cluster"
   - Choose your preferred cloud provider (AWS, Google Cloud, or Azure)
   - Select a region close to your backend deployment
   - Choose a cluster tier (M0 is free and suitable for small projects)
   - Name your cluster (e.g., "personalized-adventure-cluster")
   - Click "Create Cluster"

4. **Configure database access**
   - In the left sidebar, click "Database Access"
   - Click "Add New Database User"
   - Create a username and a secure password
   - Set appropriate privileges (readWrite to the database)
   - Click "Add User"

5. **Configure network access**
   - In the left sidebar, click "Network Access"
   - Click "Add IP Address"
   - For development, you can add your current IP
   - For production, add the IP addresses of your backend servers
   - Alternatively, you can allow access from anywhere (0.0.0.0/0) but this is less secure
   - Click "Confirm"

6. **Get your connection string**
   - Click "Connect" on your cluster
   - Select "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user's password
   - Replace `<dbname>` with your database name (e.g., "personalized-adventure")

7. **Use the connection string in your backend**
   - Set the `MONGO_URI` environment variable to your connection string

### Database Security

To ensure your MongoDB Atlas database is secure:

1. **Use strong, unique passwords** for database users
2. **Restrict network access** to only the necessary IP addresses
3. **Enable IP access list** to control which IP addresses can connect
4. **Use TLS/SSL** for all connections (enabled by default in MongoDB Atlas)
5. **Regularly audit database users** and their permissions
6. **Enable MongoDB Atlas advanced security features** if available in your plan:
   - Database auditing
   - Encryption at rest
   - LDAP authentication
   - VPC peering

### Backup and Recovery

MongoDB Atlas provides automated backups, but you should configure them properly:

1. **Configure backup schedule**
   - In your cluster, go to "Backup"
   - Set up a backup policy that meets your needs
   - For critical applications, consider continuous backups

2. **Test restoration process**
   - Periodically test restoring from backups to ensure they work
   - Document the restoration process for emergencies

3. **Export data periodically**
   - In addition to Atlas backups, periodically export your data
   - Store exports in a secure location separate from Atlas

4. **Set up point-in-time recovery**
   - Available in paid Atlas clusters
   - Allows recovery to any point in time within the retention window

## Authentication and Security

### JWT Configuration

The Personalized Adventure App uses JSON Web Tokens (JWT) for authentication. Here's how to configure JWT for production:

1. **Generate a Strong Secret Key**

Never use the default JWT secret in production. Generate a strong, random secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. **Set the JWT Secret as an Environment Variable**

```bash
# For Heroku
heroku config:set JWT_SECRET="your-generated-secret"

# For AWS Elastic Beanstalk
eb setenv JWT_SECRET="your-generated-secret"

# For DigitalOcean
# Set through the App Platform UI
```

3. **Configure Token Expiration**

In `middleware/auth.js`, the token expiration is set to 1 day:

```javascript
// Sign the token with a 1 day expiration
return jwt.sign(payload, jwtSecret, { expiresIn: '1d' });
```

For production, consider adjusting this based on your security requirements. Shorter expiration times are more secure but require more frequent logins.

4. **Implement Token Refresh**

For better user experience with short-lived tokens, implement a token refresh mechanism:

```javascript
// Example refresh token function
const refreshToken = (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // Verify the refresh token
    // Generate a new access token
    // Return the new access token
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};
```

### OAuth Integration

For enhanced security and user convenience, you can integrate OAuth providers:

1. **Choose OAuth Providers**
   - Google, Facebook, Apple, etc.
   - Register your app with each provider to get client IDs and secrets

2. **Install Required Packages**

```bash
npm install passport passport-google-oauth20 passport-facebook
```

3. **Configure Passport.js**

Create a file `middleware/passport.js`:

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Update user's Google ID if not set
      if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        email: profile.emails[0].value,
        name: profile.displayName,
        googleId: profile.id,
        // Set default preferences
        preferences: {
          // Default preferences
        }
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Facebook Strategy
// Similar implementation

module.exports = passport;
```

4. **Add OAuth Routes**

In `routes/auth.js`:

```javascript
const express = require('express');
const passport = require('passport');
const { generateToken } = require('../middleware/auth');
const router = express.Router();

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  // Generate JWT token
  const token = generateToken(req.user);
  
  // Redirect to frontend with token
  res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
});

// Facebook OAuth routes
// Similar implementation

module.exports = router;
```

5. **Update Server.js**

```javascript
const passport = require('./middleware/passport');

// Initialize Passport
app.use(passport.initialize());

// Use auth routes
app.use('/api/auth', require('./routes/auth'));
```

### Security Best Practices

In addition to the security measures already implemented, consider these best practices for production:

1. **Enable HTTPS**
   - Use SSL/TLS certificates for all production environments
   - Redirect HTTP to HTTPS
   - Consider using Let's Encrypt for free certificates

2. **Implement Content Security Policy (CSP)**
   - Add CSP headers to prevent XSS attacks
   - Use Helmet's CSP middleware:
   ```javascript
   app.use(helmet.contentSecurityPolicy({
     directives: {
       defaultSrc: ["'self'"],
       scriptSrc: ["'self'", "'unsafe-inline'"],
       styleSrc: ["'self'", "'unsafe-inline'"],
       imgSrc: ["'self'", "data:"],
       connectSrc: ["'self'", "https://api.personalizedadventure.com"]
     }
   }));
   ```

3. **Set Secure Cookies**
   - Ensure all cookies have the Secure and HttpOnly flags
   - Use SameSite=Strict for cookies
   ```javascript
   app.use(session({
     cookie: {
       secure: process.env.NODE_ENV === 'production',
       httpOnly: true,
       sameSite: 'strict'
     }
   }));
   ```

4. **Implement Two-Factor Authentication (2FA)**
   - Add 2FA for sensitive operations
   - Use libraries like `speakeasy` for TOTP-based 2FA

5. **Regular Security Audits**
   - Use tools like `npm audit` to check for vulnerabilities
   - Keep all dependencies updated
   - Perform regular code reviews with security focus

6. **Implement API Rate Limiting**
   - Extend rate limiting to all API endpoints, not just authentication
   ```javascript
   const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // 100 requests per window
   });
   
   app.use('/api/', apiLimiter);
   ```

7. **Log Security Events**
   - Log all authentication attempts (successful and failed)
   - Log all sensitive operations
   - Use a secure logging service for production

## Monitoring and Error Tracking

### Sentry Integration

The Personalized Adventure App uses Sentry for error tracking and monitoring. Here's how to configure Sentry for production:

1. **Create a Sentry Account and Project**
   - Sign up at [Sentry.io](https://sentry.io/)
   - Create a new project for React Native

2. **Get Your DSN**
   - In your Sentry project settings, find your DSN
   - It looks like `https://examplePublicKey@o0.ingest.sentry.io/0`

3. **Update the DSN in Your Frontend**

In `PersonalizedAdventureApp/src/utils/analytics.js`, replace the placeholder DSN:

```javascript
// Replace this
const SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';

// With your actual DSN
const SENTRY_DSN = 'https://your-actual-public-key@your-org.ingest.sentry.io/your-project';
```

4. **Configure Sentry for the Backend**

Install Sentry in your backend:

```bash
cd personalized-adventure-backend
npm install @sentry/node @sentry/tracing
```

Create a file `utils/sentry.js`:

```javascript
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const express = require('express');

const initializeSentry = (app) => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
  });

  // RequestHandler creates a separate execution context
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
};

const setupSentryErrorHandler = (app) => {
  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  // Optional fallthrough error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  });
};

module.exports = {
  initializeSentry,
  setupSentryErrorHandler,
  Sentry
};
```

5. **Update server.js**

```javascript
const { initializeSentry, setupSentryErrorHandler } = require('./utils/sentry');

// Initialize Sentry at the beginning
initializeSentry(app);

// ... your routes and middleware ...

// Set up Sentry error handler at the end
setupSentryErrorHandler(app);
```

6. **Set the Sentry DSN as an Environment Variable**

```bash
# For Heroku
heroku config:set SENTRY_DSN="https://your-actual-public-key@your-org.ingest.sentry.io/your-project"

# For AWS Elastic Beanstalk
eb setenv SENTRY_DSN="https://your-actual-public-key@your-org.ingest.sentry.io/your-project"

# For DigitalOcean
# Set through the App Platform UI
```

### Performance Monitoring

In addition to error tracking, you should set up performance monitoring for your production environment:

1. **Backend Performance Monitoring**

The Personalized Adventure App already includes performance monitoring utilities. Make sure they're properly configured:

```javascript
// In utils/performanceMonitor.js
const trackApiPerformance = (req, res, next) => {
  const start = Date.now();
  
  // Once the response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log or send to monitoring service
    console.log(`${req.method} ${req.originalUrl} - ${duration}ms`);
    
    // Send to Sentry as a performance metric
    const transaction = Sentry.startTransaction({
      op: "http.server",
      name: `${req.method} ${req.originalUrl}`,
    });
    
    transaction.setData("duration", duration);
    transaction.finish();
  });
  
  next();
};

// Apply to all routes
app.use(trackApiPerformance);
```

2. **Frontend Performance Monitoring**

For the React Native app, use the performance monitoring features of Sentry:

```javascript
// In utils/analytics.js
export const trackScreenPerformance = (screenName) => {
  const transaction = Sentry.startTransaction({
    name: `Screen: ${screenName}`,
    op: "navigation"
  });
  
  return {
    transaction,
    finish: () => {
      transaction.finish();
    }
  };
};

// Usage in a screen component
const HomeScreen = () => {
  useEffect(() => {
    const performance = trackScreenPerformance('Home');
    
    return () => {
      performance.finish();
    };
  }, []);
  
  // Component code...
};
```

3. **Set Up Custom Metrics**

Track important business metrics:

```javascript
// In controllers/itineraryController.js
const { Sentry } = require('../utils/sentry');

const generateItinerary = async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Generate itinerary logic...
    
    // Track generation time
    const generationTime = Date.now() - startTime;
    Sentry.captureMessage('Itinerary Generated', {
      level: 'info',
      tags: { type: 'performance' },
      extra: {
        generationTime,
        userId: req.user.id,
        preferences: req.body.preferences
      }
    });
    
    // Return response...
  } catch (error) {
    // Error handling...
  }
};
```

4. **Set Up Alerts**

Configure alerts in Sentry for:
- Error rate spikes
- Performance degradation
- API endpoint failures
- Authentication failures

## CI/CD Pipeline

### GitHub Actions Configuration

The Personalized Adventure App includes a GitHub Actions workflow for CI/CD. Here's how to configure it for production:

1. **Set Up GitHub Secrets**

In your GitHub repository, go to Settings > Secrets and add the following secrets:

- `MONGO_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Your JWT secret key
- `HEROKU_API_KEY`: Your Heroku API key
- `EXPO_TOKEN`: Your Expo access token
- `SENTRY_AUTH_TOKEN`: Your Sentry auth token

2. **Update the CI/CD Workflow**

The existing workflow in `.github/workflows/ci-cd-new.yml` is set up for testing. Update it for production:

```yaml
name: CI/CD Pipeline

# Trigger the workflow on push or pull request events to the main branch
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  # Backend tests and build
  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install backend dependencies
        run: |
          cd personalized-adventure-backend
          npm install
      
      - name: Run backend tests
        run: |
          cd personalized-adventure-backend
          npm test
        env:
          MONGO_URI: ${{ secrets.MONGO_URI }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
  
  # Frontend build
  frontend-build:
    name: Frontend Build
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install Expo CLI
        run: npm install -g expo-cli eas-cli
      
      - name: Install frontend dependencies
        run: |
          cd PersonalizedAdventureApp
          npm install --legacy-peer-deps
      
      - name: Build Expo app
        run: |
          cd PersonalizedAdventureApp
          npx eas-cli build --platform all --non-interactive --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
  
  # Deploy backend (if tests and builds pass)
  deploy-backend:
    name: Deploy Backend
    needs: [backend-test, frontend-build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install Heroku CLI
        run: npm install -g heroku
      
      - name: Login to Heroku
        run: |
          cat > ~/.netrc << EOF
          machine api.heroku.com
            login ${{ secrets.HEROKU_EMAIL }}
            password ${{ secrets.HEROKU_API_KEY }}
          machine git.heroku.com
            login ${{ secrets.HEROKU_EMAIL }}
            password ${{ secrets.HEROKU_API_KEY }}
          EOF
      
      - name: Deploy to Heroku
        run: |
          cd personalized-adventure-backend
          heroku git:remote -a personalized-adventure-backend
          git push heroku main
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
      
      - name: Verify deployment
        run: |
          curl https://personalized-adventure-backend.herokuapp.com/
  
  # Deploy frontend (if tests and builds pass)
  deploy-frontend:
    name: Deploy Frontend
    needs: [backend-test, frontend-build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install Expo CLI
        run: npm install -g expo-cli eas-cli
      
      - name: Install frontend dependencies
        run: |
          cd PersonalizedAdventureApp
          npm install --legacy-peer-deps
      
      - name: Publish to Expo
        run: |
          cd PersonalizedAdventureApp
          npx eas-cli update --auto
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      
      - name: Submit to App Stores
        run: |
          cd PersonalizedAdventureApp
          npx eas-cli submit --platform all --non-interactive --latest
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
      
      - name: Notify deployment success
        if: success()
        run: |
          curl -X POST -H "Content-Type: application/json" -d '{"text":"App deployed successfully!"}' ${{ secrets.SLACK_WEBHOOK_URL }}
      
      - name: Notify deployment failure
        if: failure()
        run: |
          curl -X POST -H "Content-Type: application/json" -d '{"text":"App deployment failed!"}' ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Automated Deployments

For fully automated deployments, consider these additional configurations:

1. **Continuous Deployment vs. Continuous Delivery**
   - Continuous Deployment: Every change that passes tests is automatically deployed to production
   - Continuous Delivery: Changes are automatically deployed to staging, but require manual approval for production

2. **Environment-Specific Workflows**

Create separate workflows for different environments:

```yaml
# .github/workflows/staging.yml
name: Staging Deployment

on:
  push:
    branches: [ develop ]

jobs:
  # Similar to main workflow but deploys to staging environments
```

3. **Deployment Approval Process**

For production deployments, add a manual approval step:

```yaml
# In your main workflow
jobs:
  # Other jobs...
  
  approve-production-deploy:
    name: Approve Production Deployment
    needs: [backend-test, frontend-build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - name: Wait for approval
        uses: trstringer/manual-approval@v1
        with:
          secret: ${{ secrets.GITHUB_TOKEN }}
          approvers: username1,username2
          minimum-approvals: 1
          issue-title: "Deploy to Production"
          issue-body: "Please approve or deny the deployment to production"
          exclude-workflow-initiator-as-approver: false
  
  deploy-backend:
    needs: [approve-production-deploy]
    # Rest of the job...
```

4. **Rollback Strategy**

Implement a rollback strategy for failed deployments:

```yaml
# In your deploy-backend job
steps:
  # Other steps...
  
  - name: Deploy to Heroku
    id: deploy
    run: |
      cd personalized-adventure-backend
      heroku git:remote -a personalized-adventure-backend
      git push heroku main
    env:
      HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
  
  - name: Verify deployment
    id: verify
    run: |
      response=$(curl -s https://personalized-adventure-backend.herokuapp.com/)
      if [[ $response == *"error"* ]]; then
        echo "Deployment verification failed"
        exit 1
      fi
  
  - name: Rollback on failure
    if: failure() && (steps.deploy.outcome == 'success' && steps.verify.outcome == 'failure')
    run: |
      cd personalized-adventure-backend
      heroku rollback
    env:
      HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
```

## Testing in Production

### Smoke Testing

After deploying to production, perform smoke tests to ensure basic functionality:

1. **Automated Smoke Tests**

Create a file `tests/smoke.test.js`:

```javascript
const axios = require('axios');

const API_URL = process.env.API_URL || 'https://personalized-adventure-backend.herokuapp.com';

describe('Smoke Tests', () => {
  test('API is running', async () => {
    const response = await axios.get(API_URL);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message');
  });
  
  test('User registration endpoint is available', async () => {
    try {
      await axios.post(`${API_URL}/api/users`, {
        email: 'test@example.com',
        password: 'password123'
      });
    } catch (error) {
      // We expect an error due to validation, but the endpoint should be available
      expect(error.response.status).not.toBe(404);
      expect(error.response.status).not.toBe(500);
    }
  });
  
  test('Login endpoint is available', async () => {
    try {
      await axios.post(`${API_URL}/api/users/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
    } catch (error) {
      // We expect an error due to invalid credentials, but the endpoint should be available
      expect(error.response.status).not.toBe(404);
      expect(error.response.status).not.toBe(500);
    }
  });
  
  // Add more smoke tests for critical endpoints
});
```

2. **Run Smoke Tests After Deployment**

Add a step to your CI/CD workflow:

```yaml
- name: Run smoke tests
  run: |
    cd personalized-adventure-backend
    npm run smoke-test
  env:
    API_URL: https://personalized-adventure-backend.herokuapp.com
```

### User Acceptance Testing

Before releasing to all users, perform User Acceptance Testing (UAT):

1. **Create a UAT Checklist**

```markdown
# User Acceptance Testing Checklist

## Authentication
- [ ] User can register with email and password
- [ ] User can log in with email and password
- [ ] User can log in with Google OAuth
- [ ] User can log out
- [ ] User can reset password

## Itinerary Management
- [ ] User can view all itineraries
- [ ] User can view a specific itinerary
- [ ] User can create a new itinerary
- [ ] User can update an existing itinerary
- [ ] User can delete an itinerary
- [ ] User can generate a personalized itinerary

## Reservation System
- [ ] User can make a reservation
- [ ] Reservation fallback works when external APIs fail
- [ ] User can view reservation status

## Collaborative Planning
- [ ] User can invite another user
- [ ] User can view and accept invitations
- [ ] Users can create a joint itinerary
- [ ] Preference merging works correctly

## Real-time Updates
- [ ] Itinerary updates in real time
- [ ] User receives notifications for updates
- [ ] Deep linking works from notifications

## Performance
- [ ] App loads within acceptable time
- [ ] Itinerary generation completes within acceptable time
- [ ] App remains responsive during network operations
```

2. **Set Up a UAT Environment**

Create a separate environment for UAT:

```bash
# For Heroku
heroku create personalized-adventure-uat

# For AWS Elastic Beanstalk
eb create personalized-adventure-uat

# For DigitalOcean
# Create a new app through the App Platform UI
```

3. **Invite Test Users**

Send invitations to a small group of test users with clear instructions on what to test and how to report issues.

## Troubleshooting

### Common Issues

Here are solutions to common issues you might encounter:

1. **MongoDB Connection Issues**

```
MongoDB connection error: MongoServerError: bad auth : authentication failed
```

**Solution:**
- Verify your MongoDB Atlas username and password
- Check if your IP is whitelisted in MongoDB Atlas Network Access
- Ensure your connection string is correctly formatted
- Check if your MongoDB Atlas cluster is running

2. **JWT Authentication Issues**

```
Invalid authentication token
```

**Solution:**
- Verify the JWT_SECRET environment variable is set correctly
- Check if the token is expired
- Ensure the token is being sent in the x-auth-token header
- Verify the token payload structure

3. **Expo Build Issues**

```
Error: Unable to resolve module...
```

**Solution:**
- Run `npm install` to ensure all dependencies are installed
- Clear the Expo cache: `expo r -c`
- Check for circular dependencies in your imports
- Verify the module exists in your package.json

4. **Heroku Deployment Issues**

```
Error: ENOENT: no such file or directory, open 'package.json'
```

**Solution:**
- Ensure you're deploying from the correct directory
- Use `git subtree push --prefix personalized-adventure-backend heroku main`
- Check if your Procfile is correctly configured
- Verify your package.json is valid

### Logs and Debugging

To effectively troubleshoot issues in production:

1. **Backend Logs**

```bash
# For Heroku
heroku logs --tail -a personalized-adventure-backend

# For AWS Elastic Beanstalk
eb logs

# For DigitalOcean
# View logs through the App Platform UI
```

2. **Frontend Logs**

Use Sentry to capture and view frontend logs:

```javascript
// In your React Native components
try {
  // Code that might fail
} catch (error) {
  // Log to Sentry
  Sentry.captureException(error);
  
  // Show user-friendly error
  Alert.alert('Error', 'Something went wrong. Our team has been notified.');
}
```

3. **Database Logs**

MongoDB Atlas provides logs for database operations:
- Go to your cluster in MongoDB Atlas
- Click on "Monitoring"
- View "Profiler" for slow queries
- Check "Logs" for database errors

4. **Performance Monitoring**

Use the built-in performance monitoring tools:
- Check Sentry Performance for frontend and backend performance metrics
- Monitor API response times
- Track memory usage and CPU utilization

5. **Custom Logging**

Implement custom logging for critical operations:

```javascript
// In controllers/itineraryController.js
const generateItinerary = async (req, res) => {
  console.log(`Generating itinerary for user ${req.user.id} with preferences:`, req.body.preferences);
  
  try {
    // Generate itinerary logic...
    console.log(`Itinerary generated successfully for user ${req.user.id}`);
    
    // Return response...
  } catch (error) {
    console.error(`Error generating itinerary for user ${req.user.id}:`, error);
    
    // Error handling...
  }
};
```

By following this deployment guide, you'll be able to deploy the Personalized Adventure App to production with confidence, ensuring it's secure, performant, and reliable for your users.