
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register a new student
const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, college } = req.body;

        // Check required fields
        if (!fullName || !email || !password || !college) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        // Check existing email
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create student
        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            college
        });

        return res.status(201).json({
            success: true,
            message: "Student registered successfully!",
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                college: newUser.college,
                isCollegeVerified: newUser.isCollegeVerified
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered"
            });
        }

        console.error("Registration Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during registration"
        });
    }
};


// Login an existing student
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and password"
            });
        }

        // Find student
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check account status
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                college: user.college,
                isCollegeVerified: user.isCollegeVerified
            }
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
};


// Get logged-in student's complete profile
const getProfile = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully!",
            user: {
                id: req.user._id,
                fullName: req.user.fullName,
                email: req.user.email,
                college: req.user.college,
                isCollegeVerified: req.user.isCollegeVerified,
                department: req.user.department,
                yearOfStudy: req.user.yearOfStudy,
                bio: req.user.bio,
                isProfileComplete: req.user.isProfileComplete
            }
        });

    } catch (error) {
        console.error("Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch profile"
        });
    }
};


// Export all authentication functions
module.exports = {
    registerUser,
    loginUser,
    getProfile
};
