const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { database } = require("../config/db");
const { validateToken } = require("../middlewares/auth");

const tutorsCollection = database.collection("tutors");

// API endpoint to get those tutors added by authenticated user
router.get("/", validateToken, async (req, res) => {
  const userId = req.user.sub;
  const myTutors = await tutorsCollection.find({ userId: userId }).toArray();
  res.json(myTutors);
});

// API endpoint to update a specific tutor which is added by authenticated user
router.patch("/:id", validateToken, async (req, res) => {
  const id = req.params.id;
  const body = req.body;
  const updatedTutor = {
    ...body,
    startDate: new Date(body.startDate),
  };
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
router.delete("/:id", validateToken, async (req, res) => {
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

module.exports = router;
