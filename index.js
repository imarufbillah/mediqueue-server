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
    const bookingsCollection = database.collection("bookings");

    // API endpoint to add a new tutor
    app.post("/tutors", validateToken, async (req, res) => {
      const tutor = req.body;
      // Convert availableDays, totalSlots, experience, and hourlyFee to numbers
      const newTutor = {
        ...tutor,
        availableDays: Number(tutor.availableDays),
        totalSlots: Number(tutor.totalSlots),
        experience: Number(tutor.experience),
        hourlyFee: Number(tutor.hourlyFee),
        slotsRemaining: Number(tutor.totalSlots),
      };
      const result = await tutorsCollection.insertOne(newTutor);
      res.json({
        success: true,
        message: "Tutor added successfully",
        tutorId: result.insertedId,
      });
    });

    // API endpoint to get all tutors based on search, date range, and limit parameters
    app.get("/tutors", async (req, res) => {
      try {
        const { search, startDate, endDate, limit } = req.query;

        const query = {};

        // Search by tutor name
        if (search) {
          query.name = {
            $regex: search,
            $options: "i",
          };
        }

        // Filter by date range
        if (startDate || endDate) {
          query.startDate = {};

          if (startDate) {
            query.startDate.$gte = new Date(startDate);
          }

          if (endDate) {
            query.startDate.$lte = new Date(endDate);
          }
        }

        // MongoDB query
        let cursor = tutorsCollection.find(query);

        // Limit results
        if (limit) {
          cursor = cursor.limit(parseInt(limit));
        }

        const tutors = await cursor.toArray();

        res.json(tutors);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    });

    // API endpoint to get a specific tutor
    app.get("/tutors/:id", validateToken, async (req, res) => {
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

    // API endpoint to update a specific tutor which is added by authenticated user
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

    // API endpoint to delete a specific tutor which is added by authenticated user
    app.delete("/my-tutors/:id", validateToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const userId = req.user.sub;
      const tutor = await tutorsCollection.findOne(query);

      if (userId !== tutor.userId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this tutor",
        });
      }

      const result = await tutorsCollection.deleteOne(query);
      res.json({
        success: true,
        message: "Tutor deleted successfully",
      });
    });

    // API endpoint to add a new booking
    app.post("/bookings", validateToken, async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);

      // Decrement the slotsRemaining field of the tutor
      if (result.acknowledged) {
        await tutorsCollection.updateOne(
          { _id: new ObjectId(booking.tutor.tutorId) },
          { $inc: { slotsRemaining: -1 } },
        );
      }

      res.json({
        success: true,
        message: "Booking added successfully",
        bookingId: result.insertedId,
      });
    });

    // API endpoint to get all bookings booked by authenticated user
    app.get("/my-bookings", validateToken, async (req, res) => {
      const userId = req.user.sub;
      const bookings = await bookingsCollection
        .find({ studentId: userId })
        .toArray();
      res.json(bookings);
    });

    // API endpoint to cancel a specific booking
    app.patch("/my-bookings/:id", validateToken, async (req, res) => {
      const { tutorId } = req.body;

      try {
        const id = req.params.id;

        const query = {
          _id: new ObjectId(id),
        };

        const updatedDoc = {
          $set: {
            status: "cancelled",
            cancelledAt: new Date(),
          },
        };

        const result = await bookingsCollection.updateOne(query, updatedDoc);

        // Increment the slotsRemaining field of the tutor
        if (result.modifiedCount > 0) {
          await tutorsCollection.updateOne(
            { _id: new ObjectId(tutorId) },
            { $inc: { slotsRemaining: 1 } },
          );
        }

        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Booking not found",
          });
        }

        res.status(200).json({
          success: true,
          message: "Booking cancelled successfully!",
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
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
