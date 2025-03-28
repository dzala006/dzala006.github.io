# PersonalizedAdventureApp

A mobile application for personalized adventure planning and itinerary management.

## Setup Instructions

### 1. Create a new Expo project

```bash
# Install Expo CLI globally if you haven't already
npm install -g expo-cli

# Create a new Expo project with the blank template
npx create-expo-app PersonalizedAdventureApp --template blank

# Navigate to the project directory
cd PersonalizedAdventureApp
```

### 2. Install required dependencies

```bash
# Install React Navigation and required dependencies
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler @react-native-masked-view/masked-view

# Install additional dependencies
npm install axios @react-native-async-storage/async-storage @react-native-community/datetimepicker
```

### 3. Create the project structure

Create the following folders and files:
```
/src
  /screens
    HomeScreen.js
    ItineraryScreen.js
    ProfileScreen.js
    LoginScreen.js
    RegisterScreen.js
    FutureItineraryScreen.js
    CollaborativeItineraryScreen.js
  /components
    FeedbackPopup.js
  /context
    AuthContext.js
  /services
    api.js
  /utils
    constants.js
```

### 4. Copy the files from this repository

Replace the default files with the ones provided in this repository.

### 5. Start the development server

```bash
npm start
# or
expo start
```

## Features

- User authentication (login/register)
- Personalized itinerary creation
- User profile management
- Adventure preferences and survey data
- Itinerary viewing and management
- Continuous feedback collection for better personalization
- Future itinerary planning with date selection
- Collaborative itinerary planning with friends/family

## Screens

### HomeScreen
The main dashboard showing upcoming adventures, recommendations, and navigation to other features.

### ItineraryScreen
View and manage your personalized itineraries.

### ProfileScreen
Update your user profile and adventure preferences.

### FutureItineraryScreen
Plan adventures for future dates with real-time updates as the date approaches.

### CollaborativeItineraryScreen
Create joint itineraries with friends or family by merging preferences.

## Collaborative Itinerary Feature

The CollaborativeItineraryScreen allows users to:

1. Invite another user by email or select from contacts
2. Merge preferences from both users to create a balanced experience
3. Generate a collaborative itinerary that considers both users' preferences
4. View activities that are suitable for both users or tailored to individual preferences
5. Confirm and save the itinerary to both user profiles

### Preference Merging Algorithm

The preference merging algorithm:
- Finds common activity types between users
- Balances budget ranges to find a mutually acceptable range
- Respects accessibility needs of either user
- Combines dietary restrictions to ensure all needs are met
- Balances travel styles (adventurous vs. relaxed)

### Implementation Details

- Uses React Context for global state management
- Simulates API calls for user search and itinerary generation
- Provides clear UI for viewing merged preferences
- Shows which activities are suitable for which user
- Includes reservation status indicators