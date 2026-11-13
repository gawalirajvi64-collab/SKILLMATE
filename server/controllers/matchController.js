
const User = require("../models/User");
const Skill = require("../models/Skill");

const {
    findMatchesForStudent
} = require("../services/matchingService");


// Find matches for logged-in student
const getStudentMatches = async (req, res) => {

    try {

        const matches = await findMatchesForStudent(
            req.user._id
        );

        const formattedMatches = await Promise.all(

            matches.map(async (match) => {

                const otherUserId = match.users.find(
                    userId =>
                        userId.toString() !== req.user._id.toString()
                );

                const otherUser = await User.findById(otherUserId)
                    .select("fullName college department yearOfStudy");

                const matchedSkills = await Promise.all(

                    match.matchedSkills.map(async (item) => {

                        const skill = await Skill.findById(item.skill)
                            .select("name category");

                        const isCurrentStudentTeacher =
                            item.teacher.toString() === req.user._id.toString();

                        return {
                            skillName: skill ? skill.name : "Unknown Skill",
                            category: skill ? skill.category : "",

                            role: isCurrentStudentTeacher
                                ? "You can teach"
                                : "You can learn",

                            teacherAssessment: item.teacherAssessment
                                ? {
                                    score: item.teacherAssessment.score,
                                    level: item.teacherAssessment.level,
                                    totalAssessments: item.teacherAssessment.totalAssessments,
                                    lastAssessedAt: item.teacherAssessment.lastAssessedAt
                                }
                                : null
                        };

                    })

                );

                return {
                    student: otherUser,
                    compatibilityScore: match.compatibilityScore,
                    matchedSkills
                };

            })

        );

        return res.status(200).json({
            success: true,
            count: formattedMatches.length,
            matches: formattedMatches
        });

    } catch (error) {

        console.error("Get Student Matches Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to find student matches"
        });

    }

};


module.exports = {
    getStudentMatches
};
