
const Session = require("../models/Session");
const crypto = require("crypto");

// Get secure classroom details
const getClassroom = async (req, res) => {

    try {

        const { id } = req.params;

        // Find session belonging to logged-in student
        const session = await Session.findOne({
            _id: id,
            $or: [
                { requester: req.user._id },
                { receiver: req.user._id }
            ]
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        // Only accepted sessions can access classroom
        if (session.status !== "accepted") {
            return res.status(403).json({
                success: false,
                message: "Classroom is available only for accepted sessions"
            });
        }

        // Generate room ID for older accepted sessions
        if (!session.meetingRoomId) {

            session.meetingRoomId =
                "skillbridge-" + crypto.randomUUID();

            await session.save();

        }

        return res.status(200).json({
            success: true,
            message: "Classroom details fetched successfully!",
            meetingRoomId: session.meetingRoomId,
            startAt: session.startAt,
            endAt: session.endAt
        });

    } catch (error) {

        console.error("Classroom Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to access classroom"
        });

    }

};

module.exports = {
    getClassroom
};
