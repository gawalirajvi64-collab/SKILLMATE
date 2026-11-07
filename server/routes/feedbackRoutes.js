const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    submitFeedback,
    getFeedback
} = require("../controllers/feedbackController");

// Submit feedback
router.post("/", protect, submitFeedback);

// Get received feedback
router.get("/", protect, getFeedback);

module.exports = router;