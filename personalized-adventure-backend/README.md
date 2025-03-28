# Personalized Adventure Backend

This is the backend API for the Personalized Adventure application.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the server:
   ```
   npm start
   ```

For development with auto-restart:
```
npm run dev
```

## API Endpoints

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

## Technologies Used

- Node.js
- Express
- MongoDB with Mongoose
- Axios for external API calls
- CORS for cross-origin resource sharing
- dotenv for environment variables