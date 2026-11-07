
const express = require("express");

const router = express.Router();

// Import authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Import match controller
const {
    getStudentMatches
} = require("../controllers/matchController");

// Get matches for logged-in student
router.get("/", protect, getStudentMatches);

module.exports = router;
