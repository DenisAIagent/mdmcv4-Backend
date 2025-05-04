// src/app.js (Corrected and Refactored - Fixed require paths)

require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path"); // Import path module for potential future use (e.g., serving static files)

// === Import Routes ===
// Corrected paths assuming routes directory is sibling to src directory
const authRoutes = require("../routes/auth.routes");
const userRoutes = require("../routes/user.routes"); // Assuming this file exists
const marketingRoutes = require("../routes/marketing.routes"); // Assuming this file exists
const wordpressRoutes = require("../routes/wordpress.routes"); // Assuming this file exists
const landingPageRoutes = require("../routes/landingPage.routes");
const reviewRoutes = require("../routes/reviews.routes");
const chatbotRoutes = require("../routes/chatbot.routes");
const artistRoutes = require("../routes/artists.js"); // Corrected filename if needed
const smartLinkRoutes = require("../routes/smartLinkRoutes"); // Assuming this file exists

// Import custom error handler and async handler (if they exist in utils/middleware)
// const errorHandler = require("./middleware/errorHandler"); // Example path
// const ErrorResponse = require("./utils/errorResponse"); // Example path

// Initialize express app
const app = express();

// === Security Middleware ===
app.use(helmet()); // Set various HTTP headers for security

// === CORS Configuration ===
const allowedOrigins = [
  "https://www.mdmcmusicads.com", // Production frontend URL
  // Add other allowed origins if needed (e.g., localhost for development)
  "http://localhost:3000", // Example for local React dev server
  "http://localhost:5173"  // Example for local Vite dev server
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) or from allowed origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true // Allow cookies to be sent (important for auth tokens in cookies)
};

app.use(cors(corsOptions)); // Use configured CORS

// === Logging Middleware ===
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // Use morgan for logging in development
}

// === Body Parsing Middleware ===
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// === API Routes Mounting ===
// Use consistent base path (e.g., /api/v1)
const apiBasePath = "/api/v1";

app.use(`${apiBasePath}/auth`, authRoutes);
app.use(`${apiBasePath}/users`, userRoutes); // Assuming endpoint
app.use(`${apiBasePath}/marketing`, marketingRoutes); // Assuming endpoint
app.use(`${apiBasePath}/wordpress`, wordpressRoutes); // Assuming endpoint
app.use(`${apiBasePath}/landing-pages`, landingPageRoutes);
app.use(`${apiBasePath}/reviews`, reviewRoutes);
app.use(`${apiBasePath}/chatbot`, chatbotRoutes);
app.use(`${apiBasePath}/artists`, artistRoutes);
app.use(`${apiBasePath}/smartlinks`, smartLinkRoutes);

// === Health Check Endpoint ===
app.get("/health", (req, res) => {
  // Basic health check, can be expanded (e.g., check DB connection status)
  res.status(200).json({ status: "ok", message: "MDMC Backend API is running" });
});

// === Error Handling Middleware ===
// Custom error handler (should be defined in ./middleware/errorHandler.js ideally)
// Using the provided inline handler for now, but recommend externalizing
app.use((err, req, res, next) => {
  console.error("Error Middleware Catch:", err.name, err.message);
  // Log stack trace only in development for cleaner production logs
  if (process.env.NODE_ENV === "development") {
      console.error(err.stack);
  }

  // Use ErrorResponse structure if available, otherwise default
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle specific Mongoose errors for better client feedback
  if (err.name === "CastError") {
      message = `Resource not found with id of ${err.value}`; // More specific message
      statusCode = 404;
  }
  if (err.code === 11000) { // Mongoose duplicate key error
      message = "Duplicate field value entered";
      statusCode = 400;
  }
  if (err.name === "ValidationError") { // Mongoose validation error
      message = Object.values(err.errors).map(val => val.message).join(", ");
      statusCode = 400;
  }

  res.status(statusCode).json({
      success: false,
      error: message
      // Optionally include stack in development:
      // stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

// === 404 Not Found Handler ===
// Must be placed last, after all other routes and middleware
app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      error: `Not Found - ${req.originalUrl}`
    });
});

// === Database Connection & Server Start ===
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("FATAL ERROR: MONGODB_URI environment variable is not defined.");
    process.exit(1); // Exit if DB connection string is missing
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(`Successfully connected to MongoDB.`);
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if DB connection fails on startup
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process (optional, but recommended for clean shutdown)
  // server.close(() => process.exit(1));
});

module.exports = app; // Export app for potential testing

