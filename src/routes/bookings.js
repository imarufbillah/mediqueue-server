const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { database } = require("../config/db");
const { validateToken } = require("../middlewares/auth");

const tutorsCollection = database.collection("tutors");
const bookingsCollection = database.collection("bookings");

// API endpoint to add a new booking
router.post("/", validateToken, async (req, res) => {
  const body = req.body;
  const booking = {
    ...body,
    bookedOn: new Date(body.bookedOn),
  };
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

module.exports = router;
