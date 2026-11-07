
const Conversation = require("../models/Conversation");
const Connection = require("../models/Connection");


// Get all conversations of logged-in student
const getConversations = async (req, res) => {

    try {

        const conversations = await Conversation.find({
            participants: req.user._id
        })
        .populate("participants", "fullName college")
        .populate("lastMessage")
        .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            count: conversations.length,
            conversations
        });

    } catch (error) {

        console.error("Get Conversations Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch conversations"
        });

    }

};


// Create or get a conversation with an accepted connection
const createConversation = async (req, res) => {

    try {

        const { connectionId } = req.params;

        // Find an accepted connection involving the logged-in student
        const connection = await Connection.findOne({
            _id: connectionId,
            status: "accepted",
            $or: [
                { requester: req.user._id },
                { receiver: req.user._id }
            ]
        });

        if (!connection) {
            return res.status(403).json({
                success: false,
                message: "You can only chat with accepted connections"
            });
        }

        // Check whether a conversation already exists
        let conversation = await Conversation.findOne({
            connection: connection._id
        })
        .populate("participants", "fullName college");

        // Create a new conversation if none exists
        if (!conversation) {

            conversation = await Conversation.create({
                participants: [
                    connection.requester,
                    connection.receiver
                ],
                connection: connection._id
            });

            conversation = await Conversation.findById(conversation._id)
                .populate("participants", "fullName college");

        }

        return res.status(200).json({
            success: true,
            message: "Conversation opened successfully!",
            conversation
        });

    } catch (error) {

        console.error("Create Conversation Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to open conversation"
        });

    }

};


// Export controller functions
module.exports = {
    getConversations,
    createConversation
};
