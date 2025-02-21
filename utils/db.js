const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://hngbao1:khongcho1@cluster0.o7xax.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;
let isConnected = false;

async function connectToMongoDB() {
  try {
    await client.connect();
    db = client.db("Main");
    isConnected = true;
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

function getDB() {
  if (!isConnected)
    throw new Error("Database not initialized. Call connectToMongoDB first.");
  return db;
}

module.exports = { connectToMongoDB, getDB };
