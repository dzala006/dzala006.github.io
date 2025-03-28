// Simple script to test MongoDB connection
const { MongoClient, ServerApiVersion } = require('mongodb');

// MongoDB Atlas Connection URI
const uri = "mongodb+srv://dzala006:DZ091206@cluster0.jtpgaha.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Add these options to help with connection issues
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000
});

async function testConnection() {
  try {
    // Connect to the MongoDB cluster
    await client.connect();
    console.log("Connected successfully to MongoDB Atlas");
    
    // Perform a ping to confirm connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. Connection confirmed!");

    // List all databases
    const databasesList = await client.db().admin().listDatabases();
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));

  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.log("Please check your MongoDB Atlas credentials and network connection.");
    console.log("Make sure your IP address is whitelisted in MongoDB Atlas.");
  } finally {
    // Close the connection
    await client.close();
    console.log("Connection closed");
  }
}

// Run the test
console.log("Testing MongoDB connection...");
testConnection().catch(console.dir);