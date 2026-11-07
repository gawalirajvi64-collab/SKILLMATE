
const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({

    // Name of the skill
    name: {
        type: String,
        required: [true, "Skill name is required"],
        unique: true,
        trim: true,
        maxlength: 50
    },

    // Skill category
    category: {
        type: String,
        required: [true, "Skill category is required"],
        trim: true
    },

    // Short description of the skill
    description: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ""
    },

    // Skill availability status
    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});


// Create Skill model
const Skill = mongoose.model("Skill", skillSchema);

module.exports = Skill;
