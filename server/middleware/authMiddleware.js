
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

// Protect routes from unauthorized access
const protect = async (req, res, next) => {

    try {

        // Check JWT secret configuration
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing.");

            return res.status(500).json({
                success: false,
                message: "Server authentication configuration error"
            });
        }

        // Get token from request header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Please login first."
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is missing"
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Validate user ID inside token
        if (
            !decoded.id ||
            !mongoose.Types.ObjectId.isValid(decoded.id)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }

        // Find logged-in student
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "User not found or account inactive"
            });
        }

        // Attach user to request
        req.user = user;

        next();

    } catch (error) {

        if (error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError") {

            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });

        }

        console.error("Authentication Middleware Error:", error);

        return res.status(500).json({
            success: false,
            message: "Authentication service temporarily unavailable"
        });

    }

};

module.exports = { protect };
