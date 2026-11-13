
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    startAssessment,
    getAssessment,
    submitAssessment,
    checkReassessmentEligibility,
    getAssessmentHistory
} = require("../controllers/assessmentController");

// Start a new assessment
router.post("/start", protect, startAssessment);

// Check reassessment eligibility
router.get("/eligibility/:skillId", protect, checkReassessmentEligibility);

// Retrieve student's assessment history
router.get("/history", protect, getAssessmentHistory);

// Submit assessment answers
router.post("/:id/submit", protect, submitAssessment);

// Retrieve an existing assessment
router.get("/:id", protect, getAssessment);

module.exports = router;
