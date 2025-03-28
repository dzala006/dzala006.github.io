const express = require('express');
const router = express.Router();
const itineraryController = require('../controllers/itineraryController');

// Get all itineraries
router.get('/', itineraryController.getAllItineraries);

// Create a new itinerary
router.post('/', itineraryController.createItinerary);

// Generate a personalized itinerary based on user preferences
router.post('/generate', itineraryController.generateItinerary);

// Get a specific itinerary by ID
router.get('/:id', itineraryController.getItineraryById);

// Update an itinerary
router.put('/:id', itineraryController.updateItinerary);

// Delete an itinerary
router.delete('/:id', itineraryController.deleteItinerary);

module.exports = router;