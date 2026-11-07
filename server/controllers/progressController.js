
const Session = require("../models/Session");
const UserSkill = require("../models/UserSkill");

// Get student's learning progress
const getProgress = async (req, res) => {

    try {

        // Find completed sessions
        const completedSessions = await Session.find({
            $or: [
                { requester: req.user._id },
                { receiver: req.user._id }
            ],
            status: "completed"
        })
        .populate("requester", "fullName")
        .populate("receiver", "fullName")
        .sort({ updatedAt: -1 });

        // Calculate total learning minutes
        let totalLearningMinutes = 0;

        completedSessions.forEach(session => {

            const duration =
                new Date(session.endAt) - new Date(session.startAt);

            totalLearningMinutes += Math.max(
                0,
                Math.floor(duration / 60000)
            );

        });

        // Count skills being learned
        const learningSkills = await UserSkill.countDocuments({
            user: req.user._id,
            type: "learn"
        });

        // Count skills being taught
        const teachingSkills = await UserSkill.countDocuments({
            user: req.user._id,
            type: "teach"
        });

        // Get recent completed sessions
        const recentActivity = completedSessions.slice(0, 5);

        return res.status(200).json({

            success: true,

            progress: {
                completedSessions: completedSessions.length,
                totalLearningMinutes,
                totalLearningHours: Number(
                    (totalLearningMinutes / 60).toFixed(2)
                ),
                learningSkills,
                teachingSkills
            },

            recentActivity

        });

    } catch (error) {

        console.error("Get Progress Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch learning progress"
        });

    }

};

module.exports = {
    getProgress
};
