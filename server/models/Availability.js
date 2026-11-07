
const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({

    // Student who added this availability
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Starting date and time (stored in UTC)
    startAt: {
        type: Date,
        required: true
    },

    // Ending date and time (stored in UTC)
    endAt: {
        type: Date,
        required: true
    },

    // Availability status
    status: {
        type: String,
        enum: ["available", "booked"],
        default: "available"
    }

}, {
    timestamps: true
});


// Create Availability model
const Availability = mongoose.model(
    "Availability",
    availabilitySchema
);

module.exports = Availability;
