
const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({

    // Two students participating in the match
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],

    // Skills that create the match
    matchedSkills: [{

        skill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Skill",
            required: true
        },

        // Student who can teach this skill
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Student who wants to learn this skill
        learner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }

    }],

    // Compatibility score between students
    compatibilityScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },

    // Current match status
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }

}, {
    timestamps: true
});


// Create Match model
const Match = mongoose.model("Match", matchSchema);

module.exports = Match;
