
const mongoose = require("mongoose");
const Session = require("../models/Session");
const SessionLearningRecord = require("../models/SessionLearningRecord");

// Teacher submits topics covered during a completed session
const submitLearningRecord = async (req, res) => {
    try {
        const { sessionId, topics } = req.body;

        if (!sessionId || !Array.isArray(topics) || topics.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Session and at least one topic are required"
            });
        }

        if (!mongoose.isValidObjectId(sessionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid session ID"
            });
        }

        if (topics.length > 20) {
            return res.status(400).json({
                success: false,
                message: "You can submit a maximum of 20 topics"
            });
        }

        const cleanedTopics = topics.map(topic =>
            typeof topic === "string" ? topic.trim() : ""
        );

        if (cleanedTopics.some(topic => !topic || topic.length > 100)) {
            return res.status(400).json({
                success: false,
                message: "Each topic must contain 1-100 characters"
            });
        }

        const normalizedTopics = cleanedTopics.map(topic =>
            topic.toLowerCase()
        );

        if (new Set(normalizedTopics).size !== cleanedTopics.length) {
            return res.status(400).json({
                success: false,
                message: "Duplicate topics are not allowed"
            });
        }

        // Only the teacher of a completed session can submit topics
        const session = await Session.findOne({
            _id: sessionId,
            receiver: req.user._id,
            status: "completed"
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Completed session not found or you are not its teacher"
            });
        }

        const existingRecord = await SessionLearningRecord.findOne({
            session: session._id
        });

        if (existingRecord) {
            return res.status(409).json({
                success: false,
                message: "Topics have already been submitted for this session"
            });
        }

        const record = await SessionLearningRecord.create({
            session: session._id,
            teacher: session.receiver,
            learner: session.requester,
            topics: cleanedTopics
        });

        return res.status(201).json({
            success: true,
            message: "Session topics submitted successfully!",
            record
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Topics have already been submitted for this session"
            });
        }

        console.error("Submit Learning Record Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to submit session topics"
        });
    }
};


// Learner confirms or corrects submitted topics
const reviewLearningRecord = async (req, res) => {
    try {
        const { status, confirmedTopics, learnerComment } = req.body;
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid learning record ID"
            });
        }

        if (!["confirmed", "corrected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be confirmed or corrected"
            });
        }

        if (
            !Array.isArray(confirmedTopics) ||
            confirmedTopics.length === 0 ||
            confirmedTopics.length > 20
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide between 1 and 20 confirmed topics"
            });
        }

        if (
            confirmedTopics.some(topic =>
                typeof topic !== "string" ||
                !topic.trim() ||
                topic.trim().length > 100
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Each topic must contain 1-100 characters"
            });
        }

        if (
            learnerComment !== undefined &&
            (
                typeof learnerComment !== "string" ||
                learnerComment.length > 300
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Learner comment cannot exceed 300 characters"
            });
        }

        const cleanedTopics = confirmedTopics.map(topic => topic.trim());

        const normalizedTopics = cleanedTopics.map(topic =>
            topic.toLowerCase()
        );

        if (new Set(normalizedTopics).size !== cleanedTopics.length) {
            return res.status(400).json({
                success: false,
                message: "Duplicate confirmed topics are not allowed"
            });
        }

        // Only the learner can review their pending record
        const record = await SessionLearningRecord.findOne({
            _id: id,
            learner: req.user._id,
            confirmationStatus: "pending"
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Pending learning record not found or you are not its learner"
            });
        }

        // Confirmed topics must exactly match the teacher's submission
        if (
            status === "confirmed" &&
            (
                cleanedTopics.length !== record.topics.length ||
                cleanedTopics.some((topic, index) =>
                    topic.toLowerCase() !== record.topics[index].toLowerCase()
                )
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "For confirmation, topics must match the teacher's submission. Use corrected status to make changes."
            });
        }

        record.confirmedTopics = cleanedTopics;
        record.confirmationStatus = status;
        record.learnerComment = learnerComment?.trim() || "";
        record.reviewedAt = new Date();

        await record.save();

        return res.status(200).json({
            success: true,
            message: "Learning topics reviewed successfully!",
            record
        });

    } catch (error) {
        console.error("Review Learning Record Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to review learning topics"
        });
    }
};


// Get learning records for the logged-in student
const getLearningRecords = async (req, res) => {
    try {
        const records = await SessionLearningRecord.find({
            $or: [
                { teacher: req.user._id },
                { learner: req.user._id }
            ]
        })
        .populate("session", "startAt endAt skill status")
        .populate("teacher", "fullName college")
        .populate("learner", "fullName college")
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: records.length,
            records
        });

    } catch (error) {
        console.error("Get Learning Records Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch learning records"
        });
    }
};


module.exports = {
    submitLearningRecord,
    reviewLearningRecord,
    getLearningRecords
};
