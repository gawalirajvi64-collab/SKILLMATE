
const mongoose = require("mongoose");

const Message = require("../models/Message");
const Conversation = require("../models/Conversation");


// Send a message
const sendMessage = async (req, res) => {

    try {

        const { content } = req.body;
        const { conversationId } = req.params;

        // Validate conversation ID
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID"
            });
        }

        // Validate message content
        if (!content || typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message content is required"
            });
        }

        if (content.trim().length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Message cannot exceed 2000 characters"
            });
        }

        // Find conversation and verify participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user._id
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        // Create message
        const message = await Message.create({
            conversation: conversation._id,
            sender: req.user._id,
            content: content.trim()
        });

        // Update latest message in conversation
        conversation.lastMessage = message._id;

        await conversation.save();

        return res.status(201).json({
            success: true,
            message: "Message sent successfully!",
            newMessage: message
        });

    } catch (error) {

        console.error("Send Message Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to send message"
        });

    }

};


// Get messages of a conversation
const getMessages = async (req, res) => {

    try {

        const { conversationId } = req.params;

        // Validate conversation ID
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID"
            });
        }

        // Verify conversation access
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user._id
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        // Fetch conversation messages
        const messages = await Message.find({
            conversation: conversationId
        })
        .populate("sender", "fullName")
        .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            count: messages.length,
            messages
        });

    } catch (error) {

        console.error("Get Messages Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch messages"
        });

    }

};


// Export controller functions
module.exports = {
    sendMessage,
    getMessages
};
