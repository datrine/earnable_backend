const { MongoClient, ObjectID, ObjectId } = require("mongodb");

// Connection URI
const uri = process.env.MONGODB_URL; //|| "mongodb://localhost:27017";

// Create a new MongoClient
const mongoClient = new MongoClient(
  uri,
  /**/ {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

async function startConn() {
  try {
    // Connect the client to the server
    await mongoClient.connect();
    console.log("Connected successfully to server");
    return mongoClient;
  } catch (err) {
    console.log(err);
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
//startConn();

module.exports = { mongoClient, ObjectID, startConn, };
