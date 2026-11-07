
const express = require("express");

const router = express.Router();

// Import authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Import user controller
const { updateProfile } = require("../controllers/userController");

// Update logged-in student's profile
router.put("/profile", protect, updateProfile);

module.exports = router;
