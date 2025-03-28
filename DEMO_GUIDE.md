# Personalized Adventure App - Step-by-Step Demo Guide

This guide provides detailed instructions for setting up and running the Personalized Adventure App on your MacBook. Follow these steps to experience all the features of this AI-driven adventure planning platform.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Xcode (for iOS simulator) or Android Studio (for Android emulator)
- Expo Go app (if testing on a physical device)

## 1. Backend Setup

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/dzala006/dzala006.github.io.git

# Navigate to the project directory
cd dzala006.github.io
```

### Set Up the Backend Server

```bash
# Navigate to the backend directory
cd personalized-adventure-backend

# Install dependencies
npm install

# Create a .env file
cp .env.example .env
```

### Configure MongoDB

Edit the `.env` file to include your MongoDB connection string:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/personalized-adventure
```

If you're using MongoDB Atlas, your connection string will look like:
```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/personalized-adventure
```

### Start the Backend Server

```bash
# Start the server
npm start
```

You should see output indicating the server is running on port 3000 and connected to MongoDB.

## 2. Frontend Setup

### Set Up the React Native App

Open a new terminal window and navigate to the frontend directory:

```bash
# Navigate to the frontend directory
cd dzala006.github.io/PersonalizedAdventureApp

# Install dependencies
npm install

# Install TensorFlow.js and related dependencies
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native expo-gl expo-file-system
```

### Start the Expo Development Server

```bash
# Start the Expo server
npm start
```

This will open the Expo Developer Tools in your browser.

## 3. Running the App

You have several options to run the app:

### Option 1: iOS Simulator (MacBook)

Press `i` in the terminal or click "Run on iOS simulator" in the Expo Developer Tools.

### Option 2: Web Browser (Limited Functionality)

Press `w` in the terminal or click "Run in web browser" in the Expo Developer Tools.

### Option 3: Physical Device

1. Install the Expo Go app on your iOS or Android device
2. Scan the QR code displayed in the terminal or Expo Developer Tools
3. The app will open in Expo Go on your device

## 4. Demo Walkthrough

Follow these steps to experience all the features of the app:

### User Registration & Login

1. When the app loads, you'll see the login screen
2. Tap "Register" to create a new account
3. Complete the registration form and the detailed preference survey
4. After registration, you'll be logged in automatically

### Home Screen & Itinerary Generation

1. The home screen displays your personalized dashboard
2. Tap "Generate Itinerary" to create a new personalized adventure
3. The AI system will analyze your preferences, local weather, and events
4. Review your personalized itinerary with activities for each time slot

### Testing the Feedback System

1. Wait for the feedback popup to appear (every 30 seconds in test mode)
2. Answer the question about your preferences
3. Notice how your itinerary updates based on your feedback

### Reservation System

1. Select an activity from your itinerary
2. Tap "Reserve" to book the activity
3. The system will attempt to book through external APIs
4. If unavailable, watch the AI fallback system secure a reservation
5. Check the reservation status in your itinerary

### Collaborative Planning

1. From the home screen, tap "Plan Together"
2. Enter another user's email or select from contacts
3. Review the merged preferences
4. Generate a collaborative itinerary
5. Confirm the itinerary to save it to both profiles

### Future Itinerary Planning

1. Navigate to the Future Itinerary screen
2. Select a date using the date picker
3. View the generated itinerary for that date
4. Notice how the level of detail varies based on how far in the future the date is

### Push Notifications

1. Enable notifications when prompted
2. Experience welcome notifications
3. Receive updates when your itinerary changes
4. Get notifications about reservation confirmations

## 5. Troubleshooting

### Backend Issues

- **MongoDB Connection Error**: Verify your connection string in the `.env` file
- **Port Already in Use**: Change the PORT value in the `.env` file

### Frontend Issues

- **Dependency Errors**: Try running `npm install` again
- **Expo Connection Issues**: Make sure your device is on the same network as your computer
- **TensorFlow.js Errors**: Check that all TensorFlow dependencies are installed correctly

### Simulator/Emulator Issues

- **iOS Simulator Not Starting**: Make sure Xcode is up to date
- **Android Emulator Not Starting**: Verify Android Studio is properly configured

## 6. Key Features to Explore

- **AI-Powered Personalization**: See how the app learns from your preferences
- **Dynamic Updates**: Watch how the itinerary adapts to changing conditions
- **Reservation System**: Experience the seamless booking process with AI fallback
- **Collaborative Planning**: Try planning an adventure with a friend
- **Continuous Feedback**: See how your feedback shapes future recommendations

## 7. Next Steps

After exploring the demo, you might want to:

1. Review the code structure to understand the implementation
2. Check out the TensorFlow.js integration for AI personalization
3. Explore the backend API endpoints for additional functionality
4. Review the comprehensive documentation in `PersonalizedAdventureApp-Documentation.md`

Enjoy your personalized adventure experience!