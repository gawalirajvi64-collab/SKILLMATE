
const mongoose = require("mongoose");

const userSkillSchema = new mongoose.Schema({

    // Student who selected this skill
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Selected skill
    skill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
        required: true
    },

    // Whether the student wants to teach or learn
    type: {
        type: String,
        enum: ["teach", "learn"],
        required: true
    },

    // Student's proficiency level
    proficiency: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        required: true
    }

}, {
    timestamps: true
});


// Prevent duplicate skill entries for the same student and type
userSkillSchema.index(
    { user: 1, skill: 1, type: 1 },
    { unique: true }
);


// Create UserSkill model
const UserSkill = mongoose.model("UserSkill", userSkillSchema);

module.exports = UserSkill;
