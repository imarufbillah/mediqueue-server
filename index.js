const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT;
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const uri = process.env.MONGO_DB_URI;
app.use(cors());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const validateToken = async (req, res, next) => {
  try {
    // Fetch the JSON Web Key Set (JWKS)
    const JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_BASE_URL}/api/auth/jwks`),
    );

    // Get the authorization header and validate it
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, message: "Authorization header missing" });
    }

    // Extract the token from the authorization header and validate it
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    // Verify the token using the JWKS
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    console.error("Token validation failed:", error);
    throw error;
  }
};

async function run() {
  try {
    await client.connect();

    const database = client.db("mediqueue");
    const tutorsCollection = database.collection("tutors");

    // API endpoint to add a new tutor
    app.post("/tutors", validateToken, async (req, res) => {
      const tutor = req.body;
      const result = await tutorsCollection.insertOne(tutor);
      res.json({
        success: true,
        message: "Tutor added successfully",
        tutorId: result.insertedId,
      });
    });

    // API endpoint to get all and limit tutors
    app.get("/tutors", async (req, res) => {
      const limit = parseInt(req.query.limit) || 6;

      let query = tutorsCollection.find();

      if (limit) {
        query = query.limit(limit);
      }

      const tutors = await query.toArray();
      res.json(tutors);
    });

    // API endpoint to get a specific tutor
    app.get("/tutors/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const tutor = await tutorsCollection.findOne(query);
      res.json(tutor);
    });

    // API endpoint to get those tutors added by authenticated user
    app.get("/my-tutors", validateToken, async (req, res) => {
      const userId = req.user.sub;
      const myTutors = await tutorsCollection
        .find({ userId: userId })
        .toArray();
      res.json(myTutors);
    });

    app.patch("/my-tutors/:id", validateToken, async (req, res) => {
      const id = req.params.id;
      const updatedTutor = req.body;
      const query = { _id: new ObjectId(id) };

      const userId = req.user.sub;
      const tutor = await tutorsCollection.findOne(query);

      if (userId !== tutor.userId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this tutor",
        });
      }

      const result = await tutorsCollection.updateOne(query, {
        $set: updatedTutor,
      });
      res.json({
        success: true,
        message: "Tutor updated successfully",
      });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is cooking!");
});

app.listen(port, () => {
  console.log(`Server is cooking on  http://localhost:${port}`);
});
