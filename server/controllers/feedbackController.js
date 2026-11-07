
const Feedback = require("../models/Feedback");
const Session = require("../models/Session");
const Notification = require("../models/Notification");

// Submit feedback
const submitFeedback = async (req, res) => {

    try {

        const { sessionId, rating, comment } = req.body;

        if (!sessionId || !rating) {
            return res.status(400).json({
                success: false,
                message: "Session and rating are required"
            });
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        if (comment && comment.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot exceed 500 characters"
            });
        }

        // Find completed session involving logged-in student
        const session = await Session.findOne({
            _id: sessionId,
            status: "completed",
            $or: [
                { requester: req.user._id },
                { receiver: req.user._id }
            ]
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Completed session not found"
            });
        }

        // Identify the other student
        const otherStudent =
            session.requester.toString() === req.user._id.toString()
                ? session.receiver
                : session.requester;

        // Save feedback
        const feedback = await Feedback.create({

            session: session._id,
            from: req.user._id,
            to: otherStudent,
            rating,
            comment: comment || ""

        });

        // Create notification for the receiver
        try {

            await Notification.create({

                recipient: otherStudent,
                sender: req.user._id,
                type: "feedback_received",
                message: `${req.user.fullName} submitted feedback for your learning session.`,
                relatedId: feedback._id

            });

        } catch (notificationError) {

            console.error(
                "Feedback Notification Error:",
                notificationError.message
            );

        }

        return res.status(201).json({
            success: true,
            message: "Feedback submitted successfully!",
            feedback
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already submitted feedback for this session"
            });
        }

        console.error("Submit Feedback Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to submit feedback"
        });

    }

};


// Get feedback received by logged-in student
const getFeedback = async (req, res) => {

    try {

        const feedback = await Feedback.find({
            to: req.user._id
        })
        .populate("from", "fullName")
        .populate("session", "startAt endAt")
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: feedback.length,
            feedback
        });

    } catch (error) {

        console.error("Get Feedback Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch feedback"
        });

    }

};


module.exports = {
    submitFeedback,
    getFeedback
};
