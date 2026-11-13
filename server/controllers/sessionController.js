
const Session = require("../models/Session");
const Availability = require("../models/Availability");
const Connection = require("../models/Connection");
const UserSkill = require("../models/UserSkill");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const crypto = require("crypto");


// Send a session request
const requestSession = async (req, res) => {

    try {

        const { connectionId, availabilityId, skillId } = req.body;

        // Validate required fields
        if (!connectionId || !availabilityId || !skillId) {
            return res.status(400).json({
                success: false,
                message: "Connection, availability and skill are required"
            });
        }

        // Validate MongoDB IDs
        if (
            !mongoose.isValidObjectId(connectionId) ||
            !mongoose.isValidObjectId(availabilityId) ||
            !mongoose.isValidObjectId(skillId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid connection, availability or skill ID"
            });
        }

        // Find an accepted connection involving the requester
        const connection = await Connection.findOne({
            _id: connectionId,
            status: "accepted",
            $or: [
                { requester: req.user._id },
                { receiver: req.user._id }
            ]
        });

        if (!connection) {
            return res.status(403).json({
                success: false,
                message: "You can only request sessions with accepted connections"
            });
        }

        // The other student owns the selected availability slot
        const receiverId =
            connection.requester.toString() === req.user._id.toString()
                ? connection.receiver
                : connection.requester;

        // Verify that the requester wants to learn this skill
        const learnerSkill = await UserSkill.findOne({
            user: req.user._id,
            skill: skillId,
            type: "learn"
        });

        if (!learnerSkill) {
            return res.status(403).json({
                success: false,
                message: "You must add this skill to your learning skills first"
            });
        }

        // Verify that the receiver can teach this skill
        const teacherSkill = await UserSkill.findOne({
            user: receiverId,
            skill: skillId,
            type: "teach"
        });

        if (!teacherSkill) {
            return res.status(403).json({
                success: false,
                message: "This student has not listed this skill as a teaching skill"
            });
        }

        // Verify availability belongs to the receiver
        const availability = await Availability.findOne({
            _id: availabilityId,
            user: receiverId,
            status: "available",
            startAt: { $gt: new Date() }
        });

        if (!availability) {
            return res.status(404).json({
                success: false,
                message: "This availability slot is no longer available"
            });
        }

        // Prevent duplicate requests for the same slot
        const existingSession = await Session.findOne({
            availability: availability._id,
            status: { $in: ["pending", "accepted"] }
        });

        if (existingSession) {
            return res.status(409).json({
                success: false,
                message: "This slot already has a session request or booking"
            });
        }

        // Create session with the selected skill
        const session = await Session.create({
            requester: req.user._id,
            receiver: receiverId,
            connection: connection._id,
            skill: skillId,
            availability: availability._id,
            startAt: availability.startAt,
            endAt: availability.endAt
        });

        // Notify receiver about the session request
        await Notification.create({
            recipient: receiverId,
            sender: req.user._id,
            type: "session_request",
            message: `${req.user.fullName} sent you a session request.`,
            relatedId: session._id
        });

        return res.status(201).json({
            success: true,
            message: "Session request sent successfully!",
            session
        });

    } catch (error) {

        console.error("Request Session Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to send session request"
        });

    }

};


// Get all session requests
const getSessions = async (req, res) => {

    try {

        const sessions = await Session.find({
            $or: [
                { requester: req.user._id },
                { receiver: req.user._id }
            ]
        })
        .populate("requester", "fullName college")
        .populate("receiver", "fullName college")
        .populate("skill", "name category")
        .populate("availability")
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: sessions.length,
            sessions
        });

    } catch (error) {

        console.error("Get Sessions Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch sessions"
        });

    }

};


// Accept or reject a session request
const respondToSession = async (req, res) => {

    try {

        const { status } = req.body;
        const { id } = req.params;

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be accepted or rejected"
            });
        }

        const session = await Session.findOne({
            _id: id,
            receiver: req.user._id,
            status: "pending"
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Pending session request not found"
            });
        }

        const availability = await Availability.findOne({
            _id: session.availability,
            user: req.user._id,
            status: "available"
        });

        if (status === "accepted") {

            if (!availability) {
                return res.status(409).json({
                    success: false,
                    message: "This availability slot is no longer available"
                });
            }

            const existingBooking = await Session.findOne({
                _id: { $ne: session._id },
                availability: session.availability,
                status: "accepted"
            });

            if (existingBooking) {
                return res.status(409).json({
                    success: false,
                    message: "This slot has already been booked"
                });
            }

            availability.status = "booked";

            await availability.save();

            // Generate a unique meeting room ID
            session.meetingRoomId =
                "skillbridge-" + crypto.randomUUID();

        }

        session.status = status;

        await session.save();

        // Notify original requester about the response
        await Notification.create({
            recipient: session.requester,
            sender: req.user._id,
            type: status === "accepted"
                ? "session_accepted"
                : "session_rejected",
            message: `${req.user.fullName} ${status} your session request.`,
            relatedId: session._id
        });

        return res.status(200).json({
            success: true,
            message: `Session request ${status} successfully!`,
            session
        });

    } catch (error) {

        console.error("Respond to Session Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to respond to session request"
        });

    }

};


// Mark an accepted session as completed
const completeSession = async (req, res) => {

    try {

        const { id } = req.params;

        const session = await Session.findOne({
            _id: id,
            $or: [
                { requester: req.user._id },
                { receiver: req.user._id }
            ],
            status: "accepted"
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Accepted session not found"
            });
        }

        if (new Date() < new Date(session.endAt)) {
            return res.status(400).json({
                success: false,
                message: "You can complete the session only after its scheduled end time"
            });
        }

       session.status = "completed";
session.completedAt = new Date();

await session.save();

        return res.status(200).json({
            success: true,
            message: "Session marked as completed successfully!",
            session
        });

    } catch (error) {

        console.error("Complete Session Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to complete session"
        });

    }

};


// Export controller functions
module.exports = {
    requestSession,
    getSessions,
    respondToSession,
    completeSession
};
