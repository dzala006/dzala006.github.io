const axios = require('axios');
require('dotenv').config();

/**
 * Get weather forecast for a specific location and date range
 * @param {string} location - City name or coordinates
 * @param {string} startDate - Start date in ISO format (YYYY-MM-DD)
 * @param {string} endDate - End date in ISO format (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of daily weather forecasts
 */
exports.getWeatherForecast = async (location, startDate, endDate) => {
  try {
    // This would typically call a real weather API
    // For demonstration purposes, we'll return mock data
    
    // Calculate number of days between start and end dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Generate mock weather data for each day
    const weatherTypes = ['sunny', 'partly cloudy', 'cloudy', 'rainy', 'stormy'];
    const forecast = [];
    
    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      
      forecast.push({
        date: currentDate.toISOString().split('T')[0],
        weatherType: weatherTypes[Math.floor(Math.random() * weatherTypes.length)],
        temperature: {
          min: Math.floor(Math.random() * 10) + 15, // Random temp between 15-25°C
          max: Math.floor(Math.random() * 10) + 25  // Random temp between 25-35°C
        },
        precipitation: Math.random() * 100,
        humidity: Math.floor(Math.random() * 50) + 30, // Random humidity between 30-80%
        windSpeed: Math.floor(Math.random() * 30)      // Random wind speed between 0-30 km/h
      });
    }
    
    return forecast;
    
    // In a real implementation, you would call an actual weather API:
    /*
    const API_KEY = process.env.WEATHER_API_KEY;
    const response = await axios.get(`https://api.weatherapi.com/v1/forecast.json`, {
      params: {
        key: API_KEY,
        q: location,
        days: daysDiff,
        aqi: 'no',
        alerts: 'no'
      }
    });
    
    return response.data.forecast.forecastday.map(day => ({
      date: day.date,
      weatherType: day.day.condition.text,
      temperature: {
        min: day.day.mintemp_c,
        max: day.day.maxtemp_c
      },
      precipitation: day.day.totalprecip_mm,
      humidity: day.day.avghumidity,
      windSpeed: day.day.maxwind_kph
    }));
    */
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error('Failed to fetch weather forecast');
  }
};