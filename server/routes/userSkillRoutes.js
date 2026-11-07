
const express = require("express");

const router = express.Router();

// Import authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Import user skill controller
const {
    addUserSkill,
    getUserSkills,
    removeUserSkill
} = require("../controllers/userSkillController");

// Add a skill
router.post("/", protect, addUserSkill);

// Get logged-in student's skills
router.get("/", protect, getUserSkills);

// Remove a skill
router.delete("/:id", protect, removeUserSkill);

module.exports = router;
