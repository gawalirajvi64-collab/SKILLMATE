
const express = require("express");

const router = express.Router();

// Import authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Import message controller
const {
    sendMessage,
    getMessages
} = require("../controllers/messageController");


// Send a message in a conversation
router.post("/:conversationId", protect, sendMessage);

// Get all messages in a conversation
router.get("/:conversationId", protect, getMessages);


module.exports = router;
