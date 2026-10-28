require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Guardian backend is running"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    project: "Guardian"
  });
});

app.get("/api/health/db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS connected");

    res.json({
      status: "OK",
      database: "connected",
      result: rows[0].connected
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);

    res.status(500).json({
      status: "ERROR",
      database: "disconnected"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Guardian backend running on port ${PORT}`);
});