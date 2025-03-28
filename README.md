# Personalized Adventure App

A dynamic, AI-driven platform that transforms the way users experience and plan their daily adventures.

## Project Structure

This project consists of two main components:

1. **Backend (Node.js/Express with MongoDB)**
   - Located in the `personalized-adventure-backend` directory
   - Provides API endpoints for user management and itinerary generation

2. **Frontend (React Native with Expo)**
   - Located in the `PersonalizedAdventureApp` directory
   - Mobile app for iOS and Android

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd personalized-adventure-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

The server will automatically connect to MongoDB Atlas and run on port 3000.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd PersonalizedAdventureApp
   ```

2. Install dependencies (including TensorFlow.js):
   ```
   npm install
   npm install @tensorflow/tfjs @tensorflow/tfjs-react-native expo-gl expo-file-system
   ```

3. Start the Expo development server:
   ```
   npm start
   ```

4. Run the app:
   - Press `i` to open in iOS simulator (requires Xcode)
   - Press `a` to open in Android emulator
   - Scan the QR code with the Expo Go app on your mobile device

## Key Features

- **User Onboarding & Management**
  - Detailed signup survey
  - Continuous feedback collection
  - Profile management

- **Dynamic, Real-Time Itinerary Generation**
  - AI-powered personalization
  - Real-time updates
  - Future itinerary planning

- **Reservation & Booking Integration**
  - External API connections
  - AI-based fallback system
  - Reservation tracking

- **Collaborative Itinerary Planning**
  - Joint adventure creation
  - Preference merging
  - Collaborative features

- **Real-Time Notifications & Updates**
  - Push notifications
  - Deep linking

## Troubleshooting

If you encounter any issues with MongoDB connection, make sure:
1. You have installed all dependencies: `npm install`
2. Your IP address is whitelisted in MongoDB Atlas
3. The connection string in server.js has the correct username and password