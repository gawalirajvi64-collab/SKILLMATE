
const Availability = require("../models/Availability");
const Connection = require("../models/Connection");


// Add a new availability slot
const addAvailability = async (req, res) => {

    try {

        const { startAt, endAt } = req.body;

        if (!startAt || !endAt) {
            return res.status(400).json({
                success: false,
                message: "Please provide start and end time"
            });
        }

        const start = new Date(startAt);
        const end = new Date(endAt);

        if (
            isNaN(start.getTime()) ||
            isNaN(end.getTime()) ||
            end <= start ||
            start <= new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid future time slot"
            });
        }

        const overlappingSlot = await Availability.findOne({
            user: req.user._id,
            startAt: { $lt: end },
            endAt: { $gt: start }
        });

        if (overlappingSlot) {
            return res.status(409).json({
                success: false,
                message: "This time slot overlaps with an existing slot"
            });
        }

        const availability = await Availability.create({
            user: req.user._id,
            startAt: start,
            endAt: end
        });

        return res.status(201).json({
            success: true,
            message: "Availability added successfully!",
            availability
        });

    } catch (error) {

        console.error("Add Availability Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add availability"
        });

    }

};


// Get logged-in student's availability
const getAvailability = async (req, res) => {

    try {

        const availability = await Availability.find({
            user: req.user._id
        }).sort({ startAt: 1 });

        return res.status(200).json({
            success: true,
            count: availability.length,
            availability
        });

    } catch (error) {

        console.error("Get Availability Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch availability"
        });

    }

};


// Get another accepted connection's available slots
const getStudentAvailability = async (req, res) => {

    try {

        const { userId } = req.params;

        // Check accepted connection
        const connection = await Connection.findOne({
            status: "accepted",
            $or: [
                {
                    requester: req.user._id,
                    receiver: userId
                },
                {
                    requester: userId,
                    receiver: req.user._id
                }
            ]
        });

        if (!connection) {
            return res.status(403).json({
                success: false,
                message: "You can only view availability of accepted connections"
            });
        }

        // Fetch only future available slots
        const availability = await Availability.find({
            user: userId,
            status: "available",
            startAt: { $gt: new Date() }
        }).sort({ startAt: 1 });

        return res.status(200).json({
            success: true,
            count: availability.length,
            availability
        });

    } catch (error) {

        console.error("Get Student Availability Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch student's availability"
        });

    }

};


// Delete an availability slot
const deleteAvailability = async (req, res) => {

    try {

        const { id } = req.params;

        const deletedSlot = await Availability.findOneAndDelete({
            _id: id,
            user: req.user._id,
            status: "available"
        });

        if (!deletedSlot) {
            return res.status(404).json({
                success: false,
                message: "Available slot not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Availability removed successfully!"
        });

    } catch (error) {

        console.error("Delete Availability Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete availability"
        });

    }

};


module.exports = {
    addAvailability,
    getAvailability,
    getStudentAvailability,
    deleteAvailability
};
