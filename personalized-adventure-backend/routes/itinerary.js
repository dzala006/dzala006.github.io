const express = require('express');
const router = express.Router();
const itineraryController = require('../controllers/itineraryController');

// Get all itineraries
router.get('/', itineraryController.getAllItineraries);

// Get a specific itinerary by ID
router.get('/:id', itineraryController.getItineraryById);

// Create a new itinerary
router.post('/', itineraryController.createItinerary);

// Update an itinerary
router.put('/:id', itineraryController.updateItinerary);

// Delete an itinerary
router.delete('/:id', itineraryController.deleteItinerary);

// Generate a personalized itinerary based on user preferences
router.post('/generate', itineraryController.generateItinerary);

module.exports = router;