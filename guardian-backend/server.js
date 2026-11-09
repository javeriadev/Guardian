require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./db");
const signupRoutes = require("./routes/signupRoutes");
const loginRoutes = require("./routes/loginRoutes");

const app = express();


// Middleware
app.use(cors());
app.use(express.json());


// Main route
app.get("/", (req, res) => {
    res.json({
        message: "Guardian backend is running."
    });
});


// Server health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        project: "Guardian"
    });
});


// Database health check
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


// Signup and login routes
app.use("/api/auth", signupRoutes);
app.use("/api/auth", loginRoutes);


// Unknown route handler
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found."
    });
});


// Global error handler
app.use((error, req, res, next) => {
    console.error("Server error:", error.message);

    res.status(500).json({
        message: "Internal server error."
    });
});


// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Guardian backend running on port ${PORT}`);
});