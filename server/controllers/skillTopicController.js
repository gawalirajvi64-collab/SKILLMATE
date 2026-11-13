
const SkillTopic = require("../models/SkillTopic");
const Skill = require("../models/Skill");

// Get all topics for a particular skill
const getSkillTopics = async (req, res) => {

    try {

        const { skillId } = req.params;

        if (!skillId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid skill ID."
            });
        }

        const skill = await Skill.findOne({
            _id: skillId,
            isActive: true
        });

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: "Skill not found."
            });
        }

        const topics = await SkillTopic.find({
    skill: skillId,
    isActive: true
});

const levelOrder = {
    beginner: 1,
    intermediate: 2,
    advanced: 3
};

topics.sort((a, b) => {
    return levelOrder[a.level] - levelOrder[b.level]
        || a.order - b.order;
});

        return res.status(200).json({
            success: true,
            skill: {
                id: skill._id,
                name: skill.name,
                category: skill.category
            },
            totalTopics: topics.length,
            topics
        });

    } catch (error) {

        console.error("Get skill topics error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve skill topics."
        });

    }
};

module.exports = {
    getSkillTopics
};
