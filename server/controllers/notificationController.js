const Notification = require("../models/Notification");

// Get logged-in student's notifications
const getNotifications = async (req, res) => {

    try {

        const notifications = await Notification.find({
            recipient: req.user._id
        })
        .populate("sender", "fullName")
        .sort({ createdAt: -1 });

        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false
        });

        return res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            notifications
        });

    } catch (error) {

        console.error("Get Notifications Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch notifications"
        });

    }

};


// Mark notification as read
const markAsRead = async (req, res) => {

    try {

        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.user._id
            },
            {
                isRead: true
            },
            {
                new: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });

    } catch (error) {

        console.error("Mark Notification Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update notification"
        });

    }

};


module.exports = {
    getNotifications,
    markAsRead
};