
const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    getProgress,
    getSkillProgress
} = require("../controllers/progressController");

// Get overall learning progress
router.get("/", protect, getProgress);

// Get progress for a particular skill
router.get("/skills/:skillId", protect, getSkillProgress);

module.exports = router;
