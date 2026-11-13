
const UserSkill = require("../models/UserSkill");
const Skill = require("../models/Skill");
const Connection = require("../models/Connection");
const mongoose = require("mongoose");

// Add a skill to student's profile
const addUserSkill = async (req, res) => {
    try {

        const { skillId, type, proficiency } = req.body;

        // Validate required fields
        if (!skillId || !type || !proficiency) {
            return res.status(400).json({
                success: false,
                message: "Please provide skill, type and proficiency"
            });
        }

        // Validate skill type
        if (!["teach", "learn"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Type must be teach or learn"
            });
        }

        // Validate proficiency
        if (!["beginner", "intermediate", "advanced"].includes(proficiency)) {
            return res.status(400).json({
                success: false,
                message: "Invalid proficiency level"
            });
        }

        // Check whether skill exists
        const skill = await Skill.findOne({
            _id: skillId,
            isActive: true
        });

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: "Skill not found"
            });
        }

        // Check duplicate skill
        const existingSkill = await UserSkill.findOne({
            user: req.user._id,
            skill: skillId,
            type
        });

        if (existingSkill) {
            return res.status(409).json({
                success: false,
                message: "This skill is already added"
            });
        }

        // Create student skill entry
        const userSkill = await UserSkill.create({
            user: req.user._id,
            skill: skillId,
            type,
            proficiency
        });

        return res.status(201).json({
            success: true,
            message: "Skill added successfully!",
            userSkill
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This skill is already added"
            });
        }

        console.error("Add User Skill Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add skill"
        });
    }
};


// Get student's selected skills
const getUserSkills = async (req, res) => {
    try {

        const userSkills = await UserSkill.find({
            user: req.user._id
        }).populate("skill", "name category description");

        return res.status(200).json({
            success: true,
            count: userSkills.length,
            userSkills
        });

    } catch (error) {

        console.error("Get User Skills Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch student skills"
        });
    }
};


// Remove a skill from student's profile
const removeUserSkill = async (req, res) => {
    try {

        const { id } = req.params;

        const deletedSkill = await UserSkill.findOneAndDelete({
            _id: id,
            user: req.user._id
        });

        if (!deletedSkill) {
            return res.status(404).json({
                success: false,
                message: "Skill entry not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Skill removed successfully!"
        });

    } catch (error) {

        console.error("Remove User Skill Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to remove skill"
        });
    }
};
// Get teaching skills of an accepted connection
const getConnectedStudentTeachingSkills = async (req, res) => {

    try {

        const { connectionId } = req.params;

        // Validate connection ID
        if (!mongoose.isValidObjectId(connectionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid connection ID"
            });
        }

        // Verify accepted connection involving logged-in student
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
                message: "Accepted connection not found"
            });
        }

        // Identify the other student
        const studentId =
            connection.requester.toString() === req.user._id.toString()
                ? connection.receiver
                : connection.requester;

        // Fetch only the other student's teaching skills
        const teachingSkills = await UserSkill.find({
            user: studentId,
            type: "teach"
        }).populate("skill", "name category description");

        return res.status(200).json({
            success: true,
            count: teachingSkills.length,
            teachingSkills
        });

    } catch (error) {

        console.error("Get Connected Student Teaching Skills Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch teaching skills"
        });

    }

};


// Export controller functions
module.exports = {
    addUserSkill,
    getUserSkills,
    removeUserSkill,
    getConnectedStudentTeachingSkills
};
