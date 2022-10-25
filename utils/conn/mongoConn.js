const { MongoClient, ObjectID, ObjectId } = require("mongodb");

// Connection URI
const uri =
"mongodb://localhost:27017";
  //"mongodb://localhost:27017/?poolSize=20&writeConcern=majority&replicaSet=rs";
 // "mongodb+srv://datrine:TeMi4ToPe@cluster0.qnpau.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"

// Create a new MongoClient
const mongoClient = new MongoClient(uri, /*{
  useNewUrlParser: true,
  useUnifiedTopology: true,
}*/);

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

module.exports = { mongoClient, ObjectID, startConn }
