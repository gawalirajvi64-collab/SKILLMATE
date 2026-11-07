
const express = require("express");

const router = express.Router();

// Import authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Import conversation controller
const {
    getConversations,
    createConversation
} = require("../controllers/conversationController");


// Get all conversations of logged-in student
router.get("/", protect, getConversations);

// Open or create a conversation with an accepted connection
router.post("/:connectionId", protect, createConversation);


module.exports = router;
