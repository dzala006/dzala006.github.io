# Personalized Adventure App

A comprehensive travel planning application with personalized itinerary generation, collaborative planning, and AI-based recommendations.

## Project Structure

This repository contains two main components:

1. **Backend API** (`personalized-adventure-backend/`) - A Node.js/Express API with MongoDB
2. **Mobile App** (`PersonalizedAdventureApp/`) - A React Native/Expo mobile application

## Getting Started

### Backend Setup

```bash
# Navigate to the backend directory
cd personalized-adventure-backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Update MongoDB connection string in .env
# MONGO_URI=mongodb://localhost:27017/personalized-adventure

# Start the server
npm start

# For development with auto-restart
npm run dev
```

The backend server will run on http://localhost:3000 by default.

### Frontend Setup

```bash
# Navigate to the frontend directory
cd PersonalizedAdventureApp

# Install dependencies
npm install

# Start the Expo development server
npm start
# or
expo start
```

Use the Expo Go app on your mobile device to scan the QR code, or run in a simulator/emulator.

## Backend API Endpoints

### Base Endpoints
- `GET /` - Welcome message
- `GET /api` - API information

### Itinerary Endpoints
- `GET /api/itineraries` - Retrieve all itineraries
- `POST /api/itineraries` - Create a new itinerary
- `POST /api/itineraries/generate` - Generate a personalized itinerary based on user preferences
- `GET /api/itineraries/:id` - Retrieve a specific itinerary by ID
- `PUT /api/itineraries/:id` - Update an existing itinerary
- `DELETE /api/itineraries/:id` - Delete an itinerary
- `POST /api/itineraries/:id/reserve` - Reserve an activity in an itinerary

### User Endpoints
- `GET /api/users` - Retrieve all users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Retrieve a specific user by ID
- `PUT /api/users/:id` - Update an existing user
- `DELETE /api/users/:id` - Delete a user

## Mobile App Features

- User authentication (login/register)
- Personalized itinerary creation
- User profile management
- Adventure preferences and survey data
- Itinerary viewing and management
- Continuous feedback collection
- Collaborative itinerary planning
- Future date itinerary planning
- Push notifications

## Technologies Used

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- Axios for external API calls
- CORS for cross-origin resource sharing
- dotenv for environment variables

### Frontend
- React Native
- Expo
- React Navigation
- Async Storage
- Expo Notifications

## Documentation

For detailed documentation on the system architecture, integration points, and functionality, see the [PersonalizedAdventureApp-Documentation.md](PersonalizedAdventureApp-Documentation.md) file.