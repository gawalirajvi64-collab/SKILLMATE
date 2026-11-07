
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({

    // Students participating in the conversation
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],

    // Connection that allows these students to chat
    connection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Connection",
        required: true,
        unique: true
    },

    // Most recent message
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null
    }

}, {
    timestamps: true
});


// Create Conversation model
const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
