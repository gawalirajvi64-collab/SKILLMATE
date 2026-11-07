
const express = require("express");

const router = express.Router();

// Import authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Import connection controller functions
const {
    sendConnectionRequest,
    getConnections,
    respondToConnection
} = require("../controllers/connectionController");


// Send a connection request
router.post("/", protect, sendConnectionRequest);

// Get all connection requests
router.get("/", protect, getConnections);

// Accept or reject a connection request
router.put("/:id/respond", protect, respondToConnection);


module.exports = router;
