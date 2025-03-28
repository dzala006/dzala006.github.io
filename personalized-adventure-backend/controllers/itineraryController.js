const mongoose = require('mongoose');
const Itinerary = require('../models/Itinerary');
const User = require('../models/User');
const weatherAPI = require('../utils/weatherAPI');
const eventsAPI = require('../utils/eventsAPI');

// Get all itineraries
exports.getAllItineraries = async (req, res) => {
  try {
    // Query the database for all itineraries
    const itineraries = await Itinerary.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: itineraries.length,
      data: itineraries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving itineraries',
      error: error.message
    });
  }
};

// Get a specific itinerary by ID
exports.getItineraryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid itinerary ID format'
      });
    }
    
    // Find the itinerary by ID
    const itinerary = await Itinerary.findById(id);
    
    // Check if itinerary exists
    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving itinerary',
      error: error.message
    });
  }
};

// Create a new itinerary
exports.createItinerary = async (req, res) => {
  try {
    const { title, location, startDate, endDate, userId, preferences, days } = req.body;
    
    // Validate required fields
    if (!title || !location || !startDate || !endDate || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, location, startDate, endDate, userId'
      });
    }
    
    // Check if userId is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Check if user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create new itinerary
    const newItinerary = new Itinerary({
      title,
      location,
      startDate,
      endDate,
      userId,
      preferences: preferences || {},
      days: days || []
    });
    
    // Save to database
    const savedItinerary = await newItinerary.save();
    
    res.status(201).json({
      success: true,
      message: 'Itinerary created successfully',
      data: savedItinerary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating itinerary',
      error: error.message
    });
  }
};

// Update an itinerary
exports.updateItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid itinerary ID format'
      });
    }
    
    // Find and update the itinerary
    const updatedItinerary = await Itinerary.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    // Check if itinerary exists
    if (!updatedItinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Itinerary updated successfully`,
      data: updatedItinerary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating itinerary',
      error: error.message
    });
  }
};

// Delete an itinerary
exports.deleteItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid itinerary ID format'
      });
    }
    
    // Find and delete the itinerary
    const deletedItinerary = await Itinerary.findByIdAndDelete(id);
    
    // Check if itinerary exists
    if (!deletedItinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Itinerary deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting itinerary',
      error: error.message
    });
  }
};

// Generate a personalized itinerary
exports.generateItinerary = async (req, res) => {
  try {
    const { location, startDate, endDate, preferences, userId, title } = req.body;
    
    // Validate required fields
    if (!location || !startDate || !endDate || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: location, startDate, endDate, userId'
      });
    }
    
    // Check if userId is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get weather forecast for the location and dates
    const weatherForecast = await weatherAPI.getWeatherForecast(location, startDate, endDate);
    
    // Get events happening in the location during the specified dates
    const events = await eventsAPI.getEvents(location, startDate, endDate);
    
    // Calculate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Generate days array with activities based on preferences, weather, and events
    const days = [];
    let totalCost = 0;
    
    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const formattedDate = currentDate.toISOString().split('T')[0];
      
      // Get weather for this day
      const dayWeather = weatherForecast.find(w => w.date === formattedDate);
      
      // Get events for this day
      const dayEvents = events.filter(e => e.date === formattedDate);
      
      // Generate activities based on weather, events, and preferences
      const activities = [];
      
      // Morning activity (usually breakfast)
      activities.push({
        name: 'Breakfast',
        description: 'Start your day with a delicious breakfast',
        startTime: '08:00',
        endTime: '09:30',
        location: {
          name: `${location} Cafe`,
          address: `123 Main St, ${location}`,
          coordinates: {
            lat: 0,
            lng: 0
          }
        },
        category: 'food',
        cost: 15,
        weatherDependent: false
      });
      
      // Add a weather-dependent activity if the weather is good
      if (dayWeather && !['rainy', 'stormy'].includes(dayWeather.weatherType)) {
        activities.push({
          name: 'Outdoor Exploration',
          description: `Explore the beautiful outdoors in ${location}`,
          startTime: '10:00',
          endTime: '12:30',
          location: {
            name: `${location} Park`,
            address: `456 Park Ave, ${location}`,
            coordinates: {
              lat: 0,
              lng: 0
            }
          },
          category: 'attraction',
          cost: 0,
          weatherDependent: true
        });
      } else {
        // Indoor activity for bad weather
        activities.push({
          name: 'Museum Visit',
          description: `Visit the famous museum in ${location}`,
          startTime: '10:00',
          endTime: '12:30',
          location: {
            name: `${location} Museum`,
            address: `789 Museum Rd, ${location}`,
            coordinates: {
              lat: 0,
              lng: 0
            }
          },
          category: 'attraction',
          cost: 20,
          weatherDependent: false
        });
      }
      
      // Lunch
      activities.push({
        name: 'Lunch',
        description: 'Enjoy a local cuisine for lunch',
        startTime: '13:00',
        endTime: '14:30',
        location: {
          name: `${location} Restaurant`,
          address: `101 Food St, ${location}`,
          coordinates: {
            lat: 0,
            lng: 0
          }
        },
        category: 'food',
        cost: 25,
        weatherDependent: false
      });
      
      // Afternoon activity
      activities.push({
        name: 'Shopping',
        description: `Shop at the local markets in ${location}`,
        startTime: '15:00',
        endTime: '17:00',
        location: {
          name: `${location} Market`,
          address: `202 Market St, ${location}`,
          coordinates: {
            lat: 0,
            lng: 0
          }
        },
        category: 'attraction',
        cost: 50,
        weatherDependent: false
      });
      
      // Add an event if available
      if (dayEvents.length > 0) {
        const event = dayEvents[0]; // Take the first event
        activities.push({
          name: event.name,
          description: event.description,
          startTime: event.time,
          endTime: '', // End time not provided by the event
          location: {
            name: event.location.name,
            address: event.location.address,
            coordinates: event.location.coordinates
          },
          category: 'event',
          cost: event.price,
          weatherDependent: false
        });
      }
      
      // Dinner
      activities.push({
        name: 'Dinner',
        description: 'Enjoy a fine dining experience',
        startTime: '19:00',
        endTime: '21:00',
        location: {
          name: `${location} Fine Dining`,
          address: `303 Gourmet Ave, ${location}`,
          coordinates: {
            lat: 0,
            lng: 0
          }
        },
        category: 'food',
        cost: 40,
        weatherDependent: false
      });
      
      // Calculate day cost
      const dayCost = activities.reduce((sum, activity) => sum + activity.cost, 0);
      totalCost += dayCost;
      
      days.push({
        date: currentDate,
        activities
      });
    }
    
    // Create the itinerary object
    const itineraryData = {
      title: title || `${location} Adventure (${startDate} to ${endDate})`,
      location,
      startDate,
      endDate,
      userId,
      preferences: preferences || user.preferences || {},
      days,
      totalCost
    };
    
    // Save the generated itinerary to the database
    const newItinerary = new Itinerary(itineraryData);
    const savedItinerary = await newItinerary.save();
    
    res.status(201).json({
      success: true,
      message: 'Personalized itinerary generated successfully',
      data: savedItinerary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating itinerary',
      error: error.message
    });
  }
};