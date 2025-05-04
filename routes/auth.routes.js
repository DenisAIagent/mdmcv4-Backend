// routes/auth.routes.js (Corrected & Middleware commented out)

const express = require("express");
const {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword
} = require("../controllers/auth"); // Path seems correct assuming standard structure

const router = express.Router();

// Middleware import commented out as user stated no dedicated middleware file exists
// const { protect } = require("../middleware/auth");

// Public routes - These remain unchanged as they were not protected
router.post("/register", register);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);

// --- SECURITY WARNING ---
// The following routes were originally protected but the middleware is now commented out.
// Access control should be implemented either here (if middleware becomes available)
// or within the controller functions themselves.
// Currently, these operations are potentially open to anyone, which is a MAJOR security risk,
// especially for logout, getting user details (getMe), and updating passwords.
// --- END SECURITY WARNING ---

// Protected routes (Middleware commented out)
// router.get("/logout", protect, logout);
router.get("/logout", logout); // WARNING: Unprotected - Allows anyone to trigger logout logic (might be less critical depending on implementation)

// router.get("/me", protect, getMe);
router.get("/me", getMe); // WARNING: MAJOR SECURITY RISK - Potentially allows anyone to get details of the logged-in user if the controller relies solely on req.user set by protect.

// router.put("/updatepassword", protect, updatePassword);
router.put("/updatepassword", updatePassword); // WARNING: MAJOR SECURITY RISK - Potentially allows anyone to attempt password updates if the controller relies solely on req.user set by protect.

module.exports = router;

