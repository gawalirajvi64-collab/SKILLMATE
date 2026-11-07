
const Connection = require("../models/Connection");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Send a connection request
const sendConnectionRequest = async (req, res) => {

    try {

        const { receiverId } = req.body;

        if (!receiverId) {
            return res.status(400).json({
                success: false,
                message: "Receiver ID is required"
            });
        }

        if (receiverId.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot connect with yourself"
            });
        }

        const receiver = await User.findById(receiverId);

        if (!receiver || !receiver.isActive) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const existingConnection = await Connection.findOne({
            $or: [
                {
                    requester: req.user._id,
                    receiver: receiverId
                },
                {
                    requester: receiverId,
                    receiver: req.user._id
                }
            ]
        });

        if (existingConnection) {
            return res.status(409).json({
                success: false,
                message: "A connection request already exists"
            });
        }

        const connection = await Connection.create({
            requester: req.user._id,
            receiver: receiverId
        });

        // Create notification for receiver
        await Notification.create({
            recipient: receiverId,
            sender: req.user._id,
            type: "connection_request",
            message: `${req.user.fullName} sent you a connection request.`,
            relatedId: connection._id
        });

        return res.status(201).json({
            success: true,
            message: "Connection request sent successfully!",
            connection
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A connection request already exists"
            });
        }

        console.error("Send Connection Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to send connection request"
        });

    }

};


// Get all connection requests
const getConnections = async (req, res) => {

    try {

        const connections = await Connection.find({
            $or: [
                { requester: req.user._id },
                { receiver: req.user._id }
            ]
        })
        .populate("requester", "fullName college")
        .populate("receiver", "fullName college")
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: connections.length,
            connections
        });

    } catch (error) {

        console.error("Get Connections Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch connections"
        });

    }

};


// Accept or reject connection request
const respondToConnection = async (req, res) => {

    try {

        const { status } = req.body;
        const { id } = req.params;

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be accepted or rejected"
            });
        }

        const connection = await Connection.findOne({
            _id: id,
            receiver: req.user._id,
            status: "pending"
        });

        if (!connection) {
            return res.status(404).json({
                success: false,
                message: "Pending connection request not found"
            });
        }

        connection.status = status;

        await connection.save();

        // Notify the original requester
        await Notification.create({
            recipient: connection.requester,
            sender: req.user._id,
            type: status === "accepted"
                ? "connection_accepted"
                : "connection_rejected",
            message: `${req.user.fullName} ${status} your connection request.`,
            relatedId: connection._id
        });

        return res.status(200).json({
            success: true,
            message: `Connection request ${status} successfully!`,
            connection
        });

    } catch (error) {

        console.error("Respond to Connection Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update connection request"
        });

    }

};


module.exports = {
    sendConnectionRequest,
    getConnections,
    respondToConnection
};
