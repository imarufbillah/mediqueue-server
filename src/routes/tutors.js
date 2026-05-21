const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { database } = require("../config/db");
const { validateToken } = require("../middlewares/auth");

const tutorsCollection = database.collection("tutors");

// API endpoint to add a new tutor
router.post("/", validateToken, async (req, res) => {
  const tutor = req.body;
  // Convert availableDays, totalSlots, experience, and hourlyFee to numbers
  const newTutor = {
    ...tutor,
    startDate: new Date(tutor.startDate),
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
router.get("/", async (req, res) => {
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
router.get("/:id", validateToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const tutor = await tutorsCollection.findOne(query);
  res.json(tutor);
});

module.exports = router;
