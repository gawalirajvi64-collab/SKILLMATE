const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({

    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true
    },

    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },

    comment: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ""
    }

}, {
    timestamps: true
});

// One review per student for each session
feedbackSchema.index(
    { session: 1, from: 1 },
    { unique: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;