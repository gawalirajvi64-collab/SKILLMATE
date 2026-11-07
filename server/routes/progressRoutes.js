
const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    getProgress
} = require("../controllers/progressController");

// Get logged-in student's learning progress
router.get("/", protect, getProgress);

module.exports = router;
