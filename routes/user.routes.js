// routes/user.routes.js (Corrected & Middleware commented out)

const express = require("express");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require("../controllers/users");

const router = express.Router();

// Middleware import commented out as user stated no dedicated middleware file exists
// const { protect, authorize } = require("../middleware/auth");

// --- SECURITY WARNING ---
// The following routes were originally protected by authentication and authorization middleware (protect, authorize("admin")).
// These middlewares are now commented out because the required file ('../middleware/auth') was not found.
// Access control should be re-implemented either here (if middleware becomes available)
// or within the controller functions themselves.
// Currently, ALL user management operations (GET, POST, PUT, DELETE) are potentially open to anyone,
// which is a MAJOR security risk.
// --- END SECURITY WARNING ---

// Apply protection and authorization to all routes (Middleware commented out)
// router.use(protect);
// router.use(authorize("admin"));

// User routes (WARNING: Unprotected)
router.route("/")
  .get(getUsers)
  .post(createUser);

router.route("/:id")
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;

