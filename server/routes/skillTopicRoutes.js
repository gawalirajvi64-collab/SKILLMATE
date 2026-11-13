
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    getSkillTopics
} = require("../controllers/skillTopicController");

// Get topics for a particular skill
router.get("/:skillId", protect, getSkillTopics);

module.exports = router;
