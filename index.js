const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT;
const cors = require("cors");

// Route imports
const tutorsRoutes = require("./src/routes/tutors");
const myTutorsRoutes = require("./src/routes/myTutors");
const bookingsRoutes = require("./src/routes/bookings");
const myBookingsRoutes = require("./src/routes/myBookings");

app.use(cors());
app.use(express.json());

// Routes
app.use("/tutors", tutorsRoutes);
app.use("/my-tutors", myTutorsRoutes);
app.use("/bookings", bookingsRoutes);
app.use("/my-bookings", myBookingsRoutes);

app.get("/", (req, res) => {
  res.send("Server is cooking!");
});

app.listen(port, () => {
  console.log(`Server is cooking on  http://localhost:${port}`);
});
