
const mongoose = require("mongoose");

const questionBankSchema = new mongoose.Schema({

    skill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
        required: true
    },

    topic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SkillTopic",
        required: true
    },

    question: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },

    questionType: {
        type: String,
        enum: ["mcq", "coding", "practical"],
        default: "mcq",
        required: true
    },

    options: [{
        type: String,
        trim: true,
        maxlength: 500
    }],

    correctAnswer: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },

    explanation: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ""
    },

    difficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

// Validate MCQ questions before saving
questionBankSchema.pre("validate", function () {

    if (this.questionType !== "mcq") {
        return;
    }

    if (!Array.isArray(this.options) || this.options.length !== 4) {
        this.invalidate(
            "options",
            "MCQ questions must have exactly four options."
        );
        return;
    }

    const normalizedOptions = this.options.map(
        option => option.trim().toLowerCase()
    );

    if (new Set(normalizedOptions).size !== 4) {
        this.invalidate(
            "options",
            "MCQ options must not contain duplicates."
        );
    }

    const normalizedAnswer = this.correctAnswer.trim().toLowerCase();

    if (!normalizedOptions.includes(normalizedAnswer)) {
        this.invalidate(
            "correctAnswer",
            "Correct answer must match one of the four options."
        );
    }
});

// Efficient question retrieval
questionBankSchema.index({
    skill: 1,
    topic: 1,
    difficulty: 1,
    isActive: 1
});

const QuestionBank = mongoose.model(
    "QuestionBank",
    questionBankSchema
);

module.exports = QuestionBank;
