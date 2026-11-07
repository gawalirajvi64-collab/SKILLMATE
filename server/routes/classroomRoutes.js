
const express = require("express");

const router = express.Router();

// Authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Classroom controller
const {
    getClassroom
} = require("../controllers/classroomController");

// Get classroom details for an accepted session
router.get("/:id", protect, getClassroom);

module.exports = router;
