# MongoDB Setup Guide for Personalized Adventure App

This guide will help you set up MongoDB for the Personalized Adventure App.

## Installation

1. Make sure you have MongoDB driver installed:

```bash
npm install mongodb
```

2. Verify the installation by checking your package.json file. It should include:

```json
"dependencies": {
  "mongodb": "^5.7.0"
}
```

## Connection Issues

If you encounter authentication errors like:

```
MongoDB connection error: MongoServerError: bad auth : authentication failed
```

Try these solutions:

1. **Verify credentials**: Make sure your username and password are correct in the connection string.

2. **Whitelist your IP address**:
   - Go to MongoDB Atlas dashboard
   - Navigate to Network Access
   - Add your current IP address

3. **Check MongoDB Atlas version compatibility**:
   - Make sure your MongoDB driver version is compatible with your Atlas cluster

4. **Simplify connection string**:
   - Remove any special characters from your password
   - Try using the connection string format without URL encoding

## Testing Connection

You can test your MongoDB connection with this simple script:

```javascript
const { MongoClient } = require('mongodb');

// Connection URI
const uri = "mongodb+srv://username:password@cluster0.example.mongodb.net/?retryWrites=true&w=majority";

// Create a new MongoClient
const client = new MongoClient(uri);

async function run() {
  try {
    // Connect to the MongoDB cluster
    await client.connect();
    console.log("Connected successfully to MongoDB");
    
    // Perform a ping to confirm connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. Connection confirmed!");

  } finally {
    // Close the connection
    await client.close();
  }
}

run().catch(console.dir);
```

Replace `username` and `password` with your actual MongoDB Atlas credentials.