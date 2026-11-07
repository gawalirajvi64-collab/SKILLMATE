
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({

    // Student who sends the session request
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Student who receives the request
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Accepted connection between students
    connection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Connection",
        required: true
    },

    // Selected availability slot
    availability: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Availability",
        required: true
    },

    // Scheduled session start time
    startAt: {
        type: Date,
        required: true
    },

    // Scheduled session end time
    endAt: {
        type: Date,
        required: true
    },

    // Unique meeting room ID
    meetingRoomId: {
        type: String,
        unique: true,
        sparse: true
    },

    // Session request status
    status: {
        type: String,
        enum: [
            "pending",
            "accepted",
            "rejected",
            "cancelled",
            "completed"
        ],
        default: "pending"
    }

}, {
    timestamps: true
});

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
