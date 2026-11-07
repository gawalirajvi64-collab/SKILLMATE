
const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    addAvailability,
    getAvailability,
    getStudentAvailability,
    deleteAvailability
} = require("../controllers/availabilityController");


// Add availability
router.post("/", protect, addAvailability);

// Get logged-in student's availability
router.get("/", protect, getAvailability);

// Get accepted connection's availability
router.get("/student/:userId", protect, getStudentAvailability);

// Delete availability
router.delete("/:id", protect, deleteAvailability);


module.exports = router;
