
const mongoose = require("mongoose");

const skillProficiencySchema = new mongoose.Schema({

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    skill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
        required: true
    },

    initialScore: {
        type: Number,
        default: null,
        min: 0,
        max: 100
    },

    latestScore: {
        type: Number,
        default: null,
        min: 0,
        max: 100
    },

    previousScore: {
        type: Number,
        default: null,
        min: 0,
        max: 100
    },

    currentLevel: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: null
    },

    totalAssessments: {
        type: Number,
        default: 0,
        min: 0
    },

    lastAssessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AssessmentAttempt",
        default: null
    },

    lastAssessedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

// One proficiency record per student per skill
skillProficiencySchema.index(
    { student: 1, skill: 1 },
    { unique: true }
);

const SkillProficiency = mongoose.model(
    "SkillProficiency",
    skillProficiencySchema
);

module.exports = SkillProficiency;
