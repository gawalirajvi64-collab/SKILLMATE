
const express = require("express");

const router = express.Router();

// Import skill controller
const {
    getAllSkills
} = require("../controllers/skillController");

// Get all available skills
router.get("/", getAllSkills);

module.exports = router;
