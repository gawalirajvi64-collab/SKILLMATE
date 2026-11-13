
const mongoose = require("mongoose");

const skillTopicSchema = new mongoose.Schema({

    skill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    description: {
        type: String,
        trim: true,
        maxlength: 300,
        default: ""
    },

    level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        required: true
    },

    order: {
        type: Number,
        required: true,
        min: 1
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

// Prevent duplicate topics for the same skill
skillTopicSchema.index(
    { skill: 1, name: 1 },
    { unique: true }
);

// Retrieve topics in learning order
skillTopicSchema.index(
    { skill: 1, level: 1, order: 1 }
);

const SkillTopic = mongoose.model("SkillTopic", skillTopicSchema);

module.exports = SkillTopic;
