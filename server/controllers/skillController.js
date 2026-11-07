
const Skill = require("../models/Skill");

// Get all available skills
const getAllSkills = async (req, res) => {
    try {

        const skills = await Skill.find({
            isActive: true
        }).sort({ category: 1, name: 1 });

        return res.status(200).json({
            success: true,
            count: skills.length,
            skills
        });

    } catch (error) {

        console.error("Get Skills Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch skills"
        });
    }
};


// Export controller functions
module.exports = {
    getAllSkills
};
