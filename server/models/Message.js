
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({

    // Conversation to which this message belongs
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },

    // Student who sent the message
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Message content
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },

    // Whether the message has been read
    isRead: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});


// Create Message model
const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
