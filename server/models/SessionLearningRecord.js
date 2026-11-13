
const mongoose = require("mongoose");

const sessionLearningRecordSchema = new mongoose.Schema({

    // Session in which these topics were covered
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true
    },

    // Student who taught the topics
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Student who learned the topics
    learner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Topics submitted by the teacher
    topics: [{
        type: String,
        trim: true,
        required: true,
        maxlength: 100
    }],

    // Learner's confirmation status
    confirmationStatus: {
        type: String,
        enum: ["pending", "confirmed", "corrected"],
        default: "pending"
    },

    // Topics after learner review
    confirmedTopics: [{
        type: String,
        trim: true,
        maxlength: 100
    }],

    // Optional feedback from learner
    learnerComment: {
        type: String,
        trim: true,
        maxlength: 300,
        default: ""
    },

    // Date when learner reviewed the topics
    reviewedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

// One learning record per session
sessionLearningRecordSchema.index(
    { session: 1 },
    { unique: true }
);

const SessionLearningRecord = mongoose.model(
    "SessionLearningRecord",
    sessionLearningRecordSchema
);

module.exports = SessionLearningRecord;
