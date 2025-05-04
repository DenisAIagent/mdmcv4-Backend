// src/app.js (Updated with CORS fix and /api/v1/ base path)

require("dotenv").config(); // Load environment variables from .env file FIRST
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// === Import Routes ===
// Assuming 'routes' directory is a sibling of 'src' directory (../)
// If 'routes' is INSIDE 'src', change paths to './routes/...'
const authRoutes = require("../routes/auth.routes");
const userRoutes = require("../routes/user.routes");
const marketingRoutes = require("../routes/marketing.routes");
const wordpressRoutes = require("../routes/wordpress.routes");
const landingPageRoutes = require("../routes/landingPage.routes");
const reviewRoutes = require("../routes/reviews.routes");
const chatbotRoutes = require("../routes/chatbot.routes");
const artistRoutes = require("../routes/artists.js");
const smartLinkRoutes = require("../routes/smartLinkRoutes");

// === Initialize express app ===
const app = express();

// === Security Middleware ===
app.use(helmet()); // Set various HTTP headers for security

// === CORS Configuration (UPDATED) ===
const allowedOrigins = [
  'https://www.mdmcmusicads.com',           // Production frontend URL (Added!)
  'https://mdmcv4-frontend-production.up.railway.app', // Railway frontend URL (Kept for now)
  // Add localhost URLs for local development testing if needed:
  'http://localhost:5173',                // Example for Vite local dev server
  'http://localhost:3000'                 // Example for Create React App local dev server
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl) or from allowed list
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS Error: Origin ${origin} not allowed.`); // Log denied origins
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies, authorization headers etc.
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 204 // For legacy browser compatibility
};

app.use(cors(corsOptions)); // Use configured CORS - Placed early

// === Logging Middleware ===
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // Use morgan for logging in development
}

// === Body Parsing Middleware ===
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// === API Routes Mounting (UPDATED with /api/v1/ base path) ===
// Using /api/v1/ as the standard base path for all API routes
const apiBasePath = "/api/v1"; // Changed from "/api/"

app.use(`${apiBasePath}/auth`, authRoutes);
app.use(`${apiBasePath}/users`, userRoutes);
app.use(`${apiBasePath}/marketing`, marketingRoutes);
app.use(`${apiBasePath}/wordpress`, wordpressRoutes); // Assuming this route exists and is needed
app.use(`${apiBasePath}/landing-pages`, landingPageRoutes);
app.use(`${apiBasePath}/reviews`, reviewRoutes);
app.use(`${apiBasePath}/chatbot`, chatbotRoutes);
app.use(`${apiBasePath}/artists`, artistRoutes);
app.use(`${apiBasePath}/smartlinks`, smartLinkRoutes);

// === Health Check Endpoint ===
// Keep it simple, outside the /api/v1 prefix if desired, or move it inside
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "MDMC Backend API is running" });
});

// === 404 Not Found Handler ===
// This should come AFTER all other valid routes
// It catches any request that didn't match a route above it
app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      error: `Not Found - ${req.originalUrl}`
    });
});


// === Global Error Handling Middleware ===
// This should come last, after the 404 handler
app.use((err, req, res, next) => {
  console.error("Error Middleware Catch:", err.name, err.message);
  // Log stack trace only in development for cleaner production logs
  if (process.env.NODE_ENV === "development") {
      console.error(err.stack);
  }

  // Default error details
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle specific Mongoose errors for better client feedback
  if (err.name === "CastError") {
      message = `Resource not found with id of ${err.value}`;
      statusCode = 404;
  }
  if (err.code === 11000) { // Mongoose duplicate key error
      // Attempt to extract the duplicate field name for a more helpful message
      const field = Object.keys(err.keyValue)[0];
      message = `Duplicate field value entered for: ${field}`;
      statusCode = 400;
  }
  if (err.name === "ValidationError") { // Mongoose validation error
      message = Object.values(err.errors).map(val => val.message).join(', ');
      statusCode = 400;
  }
  // Handle CORS errors specifically if needed (from the corsOptions callback)
  if (message === 'Not allowed by CORS') {
    statusCode = 403; // Forbidden
  }

  res.status(statusCode).json({
      success: false,
      error: message
      // Optionally include stack in development:
      // stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});


// === Database Connection & Server Start ===
const PORT = process.env.PORT || 5000; // Railway injects its own PORT env var
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("FATAL ERROR: MONGODB_URI environment variable is not defined.");
    process.exit(1); // Exit if DB connection string is missing
}

let server; // Define server variable to potentially close it on errors

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(`Successfully connected to MongoDB.`);
    server = app.listen(PORT, () => { // Assign the server instance
      console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if DB connection fails on startup
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Unhandled Rejection: ${err.name} - ${err.message}`);
  // Close server & exit process for clean shutdown
  if (server) {
    server.close(() => {
        console.log("Server closed due to unhandled rejection.");
        process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions (less common for typical web apps, but good practice)
process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.name} - ${err.message}`);
  console.error(err.stack);
  // Close server & exit process
  if (server) {
    server.close(() => {
      console.log('Server closed due to uncaught exception.');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});


module.exports = app; // Export app for potential testing
