
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    // Student's basic information
    fullName: {
        type: String,
        required: [true, "Full name is required"],
        trim: true,
        minlength: 2,
        maxlength: 60
    },

    // Email address
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true
    },

    // Hashed password
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: 8,
        select: false
    },

    // College information
    college: {
        type: String,
        required: [true, "College name is required"],
        trim: true
    },

    // College verification status
    isCollegeVerified: {
        type: Boolean,
        default: false
    },

    // Student's department
    department: {
        type: String,
        trim: true,
        default: ""
    },

    // Current year of study
    yearOfStudy: {
        type: Number,
        min: 1,
        max: 8,
        default: null
    },

    // Short student biography
    bio: {
        type: String,
        trim: true,
        maxlength: 300,
        default: ""
    },

    // Profile completion status
    isProfileComplete: {
        type: Boolean,
        default: false
    },

    // Account status
    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

// Create User model
const User = mongoose.model("User", userSchema);

module.exports = User;
