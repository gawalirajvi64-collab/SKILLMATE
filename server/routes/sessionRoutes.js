
const express = require("express");

const router = express.Router();

// Import authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Import session controller
const {
    requestSession,
    getSessions,
    respondToSession,
    completeSession
} = require("../controllers/sessionController");


// Send a session request
router.post("/", protect, requestSession);

// Get all session requests
router.get("/", protect, getSessions);

// Accept or reject a session request
router.put("/:id/respond", protect, respondToSession);

// Mark an accepted session as completed
router.put("/:id/complete", protect, completeSession);

module.exports = router;
