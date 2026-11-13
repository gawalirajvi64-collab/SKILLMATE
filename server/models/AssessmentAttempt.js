
const mongoose = require("mongoose");

const assessmentAttemptSchema = new mongoose.Schema({

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

    assessmentType: {
        type: String,
        enum: ["initial", "reassessment"],
        required: true
    },

    questions: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QuestionBank",
            required: true
        },

        questionText: {
            type: String,
            required: true
        },

        questionType: {
            type: String,
            enum: ["mcq", "coding", "practical"],
            required: true
        },

        options: [{
            type: String
        }],

        correctAnswer: {
            type: String,
            required: true
        },

        explanation: {
            type: String,
            default: ""
        },

        topic: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SkillTopic"
        },

        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            required: true
        },

        studentAnswer: {
            type: String,
            default: ""
        },

        isCorrect: {
            type: Boolean,
            default: null
        },

        marks: {
            type: Number,
            default: 1,
            min: 0
        },

        awardedMarks: {
            type: Number,
            default: 0,
            min: 0
        }
    }],

    totalQuestions: {
        type: Number,
        required: true,
        min: 1
    },

    totalMarks: {
        type: Number,
        required: true,
        min: 1
    },

    obtainedMarks: {
        type: Number,
        default: 0,
        min: 0
    },

    percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    proficiency: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: null
    },

    status: {
        type: String,
        enum: ["in-progress", "completed", "abandoned"],
        default: "in-progress"
    },

    startedAt: {
        type: Date,
        default: Date.now
    },

    completedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

// Retrieve a student's assessment history
assessmentAttemptSchema.index({
    student: 1,
    skill: 1,
    createdAt: -1
});

// Retrieve attempts by assessment type
assessmentAttemptSchema.index({
    student: 1,
    skill: 1,
    assessmentType: 1,
    status: 1
});

// Allow only one in-progress assessment per student and skill
assessmentAttemptSchema.index(
    {
        student: 1,
        skill: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            status: "in-progress"
        }
    }
);

const AssessmentAttempt = mongoose.model(
    "AssessmentAttempt",
    assessmentAttemptSchema
);

module.exports = AssessmentAttempt;
