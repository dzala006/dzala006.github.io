// Load environment variables
require('dotenv').config();

// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ServerApiVersion } = require('mongodb');

// Import routes
const indexRoutes = require('./routes/index');
const itineraryRoutes = require('./routes/itinerary');
const userRoutes = require('./routes/user');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use routes
app.use('/', indexRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/users', userRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Personalized Adventure API' });
});

// MongoDB Atlas Connection URI
const uri = "mongodb+srv://dzala006:DZ091206@cluster0.jtpgaha.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB with Mongoose and start the server
async function startServer() {
  try {
    // Connect to MongoDB for Mongoose
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    console.log('Connected to MongoDB with Mongoose');
    
    // Start server after successful database connection
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

// Start the server
startServer();