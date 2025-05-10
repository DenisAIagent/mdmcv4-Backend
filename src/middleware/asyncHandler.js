// middleware/asyncHandler.js (Minimalist version)

// This is a basic asyncHandler utility. It wraps asynchronous route handlers
// and ensures that any errors thrown (including rejected Promises) are passed
// to the Express error handling middleware (via next()).

const asyncHandler = fn => (req, res, next) =>
  Promise
    .resolve(fn(req, res, next)) // Execute the async function
    .catch(next); // Catch any errors and pass them to the next middleware (error handler)

module.exports = asyncHandler;

