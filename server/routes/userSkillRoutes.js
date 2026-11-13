
const express = require("express");

const router = express.Router();

// Authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Import controller functions
const {
    addUserSkill,
    getUserSkills,
    removeUserSkill,
    getConnectedStudentTeachingSkills
} = require("../controllers/userSkillController");

// Add a skill
router.post("/", protect, addUserSkill);

// Get logged-in student's skills
router.get("/", protect, getUserSkills);

// Get teaching skills of an accepted connection
router.get(
    "/connection/:connectionId/teaching-skills",
    protect,
    getConnectedStudentTeachingSkills
);

// Remove a skill
router.delete("/:id", protect, removeUserSkill);

module.exports = router;
