const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const leaveRoutes = require("./routes/leaveRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Leave Management API is running!" });
});

app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);

module.exports = app;
