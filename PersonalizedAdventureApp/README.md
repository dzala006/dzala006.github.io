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
npm install axios @react-native-async-storage/async-storage
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
  /components
  /context
    AuthContext.js
  /services
    api.js
  /utils
    constants.js
```

### 4. Copy the App.js file from this repository

Replace the default App.js file with the one provided in this repository.

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