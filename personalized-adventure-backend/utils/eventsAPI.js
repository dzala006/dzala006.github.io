const axios = require('axios');
require('dotenv').config();

/**
 * Get events for a specific location and date range
 * @param {string} location - City name or coordinates
 * @param {string} startDate - Start date in ISO format (YYYY-MM-DD)
 * @param {string} endDate - End date in ISO format (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of events
 */
exports.getEvents = async (location, startDate, endDate) => {
  try {
    // This would typically call a real events API like Ticketmaster, Eventbrite, etc.
    // For demonstration purposes, we'll return mock data
    
    // Calculate number of days between start and end dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Generate mock event data
    const eventTypes = [
      'Concert', 'Festival', 'Exhibition', 'Sports', 
      'Theater', 'Workshop', 'Conference', 'Food & Drink'
    ];
    
    const events = [];
    const numEvents = Math.floor(Math.random() * 10) + 5; // 5-15 events
    
    for (let i = 0; i < numEvents; i++) {
      // Random date within the range
      const eventDate = new Date(start);
      eventDate.setDate(start.getDate() + Math.floor(Math.random() * daysDiff));
      
      // Random time
      const hours = Math.floor(Math.random() * 12) + 9; // 9 AM to 9 PM
      const minutes = [0, 30][Math.floor(Math.random() * 2)]; // Either on the hour or half hour
      
      events.push({
        id: `event-${i + 1}`,
        name: `${location} ${eventTypes[Math.floor(Math.random() * eventTypes.length)]} Event`,
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        date: eventDate.toISOString().split('T')[0],
        time: `${hours}:${minutes === 0 ? '00' : minutes}`,
        location: {
          name: `${location} Venue ${i + 1}`,
          address: `${Math.floor(Math.random() * 1000) + 1} Main St, ${location}`,
          coordinates: {
            lat: (Math.random() * 180 - 90).toFixed(6),
            lng: (Math.random() * 360 - 180).toFixed(6)
          }
        },
        description: `This is a sample event in ${location}. It would have a detailed description in a real application.`,
        price: Math.floor(Math.random() * 100) + 10, // $10-$110
        url: `https://example.com/events/${i + 1}`
      });
    }
    
    return events;
    
    // In a real implementation, you would call an actual events API:
    /*
    const API_KEY = process.env.EVENTS_API_KEY;
    const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
      params: {
        apikey: API_KEY,
        city: location,
        startDateTime: `${startDate}T00:00:00Z`,
        endDateTime: `${endDate}T23:59:59Z`,
        size: 20
      }
    });
    
    return response.data._embedded.events.map(event => ({
      id: event.id,
      name: event.name,
      type: event.classifications[0].segment.name,
      date: event.dates.start.localDate,
      time: event.dates.start.localTime,
      location: {
        name: event._embedded.venues[0].name,
        address: `${event._embedded.venues[0].address.line1}, ${event._embedded.venues[0].city.name}`,
        coordinates: {
          lat: event._embedded.venues[0].location.latitude,
          lng: event._embedded.venues[0].location.longitude
        }
      },
      description: event.info || event.pleaseNote || '',
      price: event.priceRanges ? event.priceRanges[0].min : 'N/A',
      url: event.url
    }));
    */
  } catch (error) {
    console.error('Error fetching events data:', error);
    throw new Error('Failed to fetch events');
  }
};