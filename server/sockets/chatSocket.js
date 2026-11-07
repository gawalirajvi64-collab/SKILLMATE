
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");


// Configure Socket.IO chat functionality
const configureChatSocket = (io) => {

    // Authenticate Socket.IO connections
    io.use(async (socket, next) => {

        try {

            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            const user = await User.findById(decoded.id);

            if (!user || !user.isActive) {
                return next(new Error("Invalid user"));
            }

            socket.user = user;

            next();

        } catch (error) {

            next(new Error("Invalid or expired token"));

        }

    });


    // Handle authenticated student connection
    io.on("connection", (socket) => {

        console.log(
            `Student connected to chat: ${socket.user.fullName}`
        );


        // Join a conversation room
        socket.on("joinConversation", async (conversationId) => {

            try {

                // Validate conversation ID
                if (!mongoose.Types.ObjectId.isValid(conversationId)) {

                    socket.emit("chatError", {
                        message: "Invalid conversation ID"
                    });

                    return;
                }

                // Verify conversation membership
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: socket.user._id
                });

                if (!conversation) {

                    socket.emit("chatError", {
                        message: "You cannot access this conversation"
                    });

                    return;
                }

                // Join authorized conversation room
                await socket.join(`conversation:${conversationId}`);

                socket.emit("joinedConversation", {
                    conversationId,
                    message: "Conversation joined successfully!"
                });

            } catch (error) {

                socket.emit("chatError", {
                    message: "Unable to join conversation"
                });

            }

        });


        // Send a real-time message with acknowledgement
        socket.on("sendMessage", async (data, callback) => {

            try {

                // Validate incoming data
                if (!data || typeof data !== "object") {
                    throw new Error("Invalid message data");
                }

                const { conversationId, content } = data;

                // Validate conversation ID
                if (!mongoose.Types.ObjectId.isValid(conversationId)) {
                    throw new Error("Invalid conversation ID");
                }

                // Validate message content
                if (
                    typeof content !== "string" ||
                    !content.trim() ||
                    content.trim().length > 2000
                ) {
                    throw new Error("Please enter a valid message");
                }

                // Require room membership before sending
                const roomName = `conversation:${conversationId}`;

                if (!socket.rooms.has(roomName)) {
                    throw new Error("Join the conversation before sending messages");
                }

                // Verify conversation membership again
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: socket.user._id
                });

                if (!conversation) {
                    throw new Error("Conversation not found");
                }

                // Save message
                const newMessage = await Message.create({
                    conversation: conversation._id,
                    sender: socket.user._id,
                    content: content.trim()
                });

                // Update latest message
                conversation.lastMessage = newMessage._id;

                await conversation.save();

                // Prepare message details
                const formattedMessage = await Message.findById(
                    newMessage._id
                ).populate("sender", "fullName");

                // Broadcast to conversation room
                io.to(roomName).emit(
                    "messageReceived",
                    formattedMessage
                );

                // Confirm successful delivery to sender
                if (typeof callback === "function") {
                    callback({
                        success: true,
                        message: "Message sent successfully!"
                    });
                }

            } catch (error) {

                console.error("Real-Time Message Error:", error);

                // Send failure acknowledgement
                if (typeof callback === "function") {

                    callback({
                        success: false,
                        message: error.message || "Unable to send message"
                    });

                } else {

                    socket.emit("chatError", {
                        message: error.message || "Unable to send message"
                    });

                }

            }

        });


        // Handle disconnection
        socket.on("disconnect", () => {

            console.log(
                `Student disconnected: ${socket.user.fullName}`
            );

        });

    });

};


// Export configuration
module.exports = configureChatSocket;
