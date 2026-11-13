
const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    submitLearningRecord,
    reviewLearningRecord,
    getLearningRecords
} = require("../controllers/sessionLearningRecordController");

// Get learning records for the logged-in student
router.get("/", protect, getLearningRecords);

// Teacher submits topics covered in a completed session
router.post("/", protect, submitLearningRecord);

// Learner confirms or corrects submitted topics
router.put("/:id/review", protect, reviewLearningRecord);

module.exports = router;
