// Load environment variables
require('dotenv').config();

// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');

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

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
  wtimeoutMS: 2500
});

// Connect to MongoDB Atlas and then start the server
async function startServer() {
  try {
    // Connect to MongoDB Atlas
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB Atlas!");
    
    // Connect to MongoDB for Mongoose (using the same URI)
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000
    });
    console.log('Connected to MongoDB with Mongoose');
    
    // Start server after successful database connection
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Please check your MongoDB Atlas credentials and network connection.');
    console.log('See MONGODB_SETUP.md for troubleshooting steps.');
    process.exit(1);
  }
}

// Start the server
startServer();