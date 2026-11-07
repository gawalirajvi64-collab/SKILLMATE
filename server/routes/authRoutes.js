
const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Import controller functions
const {
    registerUser,
    loginUser,
    getProfile
} = require("../controllers/authController");

// Import authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Registration rate limiter
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: {
        success: false,
        message: "Too many registration attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Login rate limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Student registration
router.post("/register", registerLimiter, registerUser);

// Student login
router.post("/login", loginLimiter, loginUser);

// Get logged-in student's profile (Protected)
router.get("/profile", protect, getProfile);

module.exports = router;
