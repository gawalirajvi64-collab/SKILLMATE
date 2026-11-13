
const Session = require("../models/Session");
const UserSkill = require("../models/UserSkill");
const SkillProficiency = require("../models/SkillProficiency");
const Skill = require("../models/Skill");

// Get student's learning progress
const getProgress = async (req, res) => {
    try {
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

        let totalLearningMinutes = 0;

        completedSessions.forEach(session => {
            const duration =
                new Date(session.endAt) - new Date(session.startAt);

            totalLearningMinutes += Math.max(
                0,
                Math.floor(duration / 60000)
            );
        });

        const learningSkills = await UserSkill.countDocuments({
            user: req.user._id,
            type: "learn"
        });

        const teachingSkills = await UserSkill.countDocuments({
            user: req.user._id,
            type: "teach"
        });

        const recentActivity = completedSessions.slice(0, 5);

	const completedSessionDates = completedSessions.map(session =>
    session.completedAt || session.updatedAt
);

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
completedSessionDates,
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


// Get progress for a particular skill
const getSkillProgress = async (req, res) => {
    try {
        const { skillId } = req.params;

        if (!skillId || !skillId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid skill ID"
            });
        }

        const skill = await Skill.findById(skillId);

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: "Skill not found"
            });
        }

        const proficiency = await SkillProficiency.findOne({
            student: req.user._id,
            skill: skillId
        });

        if (!proficiency) {
            return res.status(200).json({
                success: true,
                skill: {
                    id: skill._id,
                    name: skill.name
                },
                proficiency: null,
                message: "No assessment progress available for this skill yet."
            });
        }

        return res.status(200).json({
            success: true,
            skill: {
                id: skill._id,
                name: skill.name
            },
            proficiency: {
                initialScore: proficiency.initialScore,
                previousScore: proficiency.previousScore,
                latestScore: proficiency.latestScore,
                currentLevel: proficiency.currentLevel,
                totalAssessments: proficiency.totalAssessments,
                lastAssessment: proficiency.lastAssessment,
                lastAssessedAt: proficiency.lastAssessedAt
            }
        });

    } catch (error) {
        console.error("Get Skill Progress Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch skill progress"
        });
    }
};


module.exports = {
    getProgress,
    getSkillProgress
};
