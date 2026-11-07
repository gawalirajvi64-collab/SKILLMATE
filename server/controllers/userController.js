
const User = require("../models/User");

// Update student's profile
const updateProfile = async (req, res) => {
    try {

        const {
            fullName,
            college,
            department,
            yearOfStudy,
            bio
        } = req.body;

        // Update basic information
        if (fullName !== undefined) {
            if (typeof fullName !== "string" || fullName.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Full name must contain at least 2 characters"
                });
            }

            req.user.fullName = fullName.trim();
        }

        if (college !== undefined) {
            if (typeof college !== "string" || !college.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid college name"
                });
            }

            req.user.college = college.trim();
        }

        if (department !== undefined) {
            if (typeof department !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department"
                });
            }

            req.user.department = department.trim();
        }

        if (yearOfStudy !== undefined) {
            const year = Number(yearOfStudy);

            if (!Number.isInteger(year) || year < 1 || year > 8) {
                return res.status(400).json({
                    success: false,
                    message: "Year of study must be between 1 and 8"
                });
            }

            req.user.yearOfStudy = year;
        }

        if (bio !== undefined) {
            if (typeof bio !== "string" || bio.length > 300) {
                return res.status(400).json({
                    success: false,
                    message: "Bio must not exceed 300 characters"
                });
            }

            req.user.bio = bio.trim();
        }

        // Check profile completion
        req.user.isProfileComplete = Boolean(
            req.user.fullName &&
            req.user.college &&
            req.user.department &&
            req.user.yearOfStudy
        );

        // Save updated profile
        const updatedUser = await req.user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully!",
            user: {
                id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                college: updatedUser.college,
                department: updatedUser.department,
                yearOfStudy: updatedUser.yearOfStudy,
                bio: updatedUser.bio,
                isProfileComplete: updatedUser.isProfileComplete
            }
        });

    } catch (error) {

        console.error("Profile Update Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update profile"
        });
    }
};

module.exports = { updateProfile };
