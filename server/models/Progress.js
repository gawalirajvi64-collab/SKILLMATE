
const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({

    // Student whose progress is being tracked
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    // Total completed learning sessions
    completedSessions: {
        type: Number,
        default: 0,
        min: 0
    },

    // Total learning time in minutes
    totalLearningMinutes: {
        type: Number,
        default: 0,
        min: 0
    },

    // Date of the latest completed session
    lastSessionAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

const Progress = mongoose.model("Progress", progressSchema);

module.exports = Progress;

