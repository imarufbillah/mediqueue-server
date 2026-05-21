const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { database } = require("../config/db");
const { validateToken } = require("../middlewares/auth");

const tutorsCollection = database.collection("tutors");
const bookingsCollection = database.collection("bookings");

// API endpoint to get all bookings booked by authenticated user
router.get("/", validateToken, async (req, res) => {
  const userId = req.user.sub;
  const bookings = await bookingsCollection
    .find({ studentId: userId })
    .toArray();
  res.json(bookings);
});

// API endpoint to cancel a specific booking
router.patch("/:id", validateToken, async (req, res) => {
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

module.exports = router;
