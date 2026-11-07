const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({

    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    type: {
        type: String,
        enum: [
            "connection_request",
            "connection_accepted",
            "connection_rejected",
            "session_request",
            "session_accepted",
            "session_rejected",
            "feedback_received"
        ],
        required: true
    },

    message: {
        type: String,
        required: true,
        trim: true
    },

    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },

    isRead: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

module.exports = Notification;
