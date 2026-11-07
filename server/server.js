
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { Server } = require("socket.io");

// Import chat socket handler
const configureChatSocket = require("./sockets/chatSocket");

const PORT = process.env.PORT || 5000;

// Allowed frontend origins
const allowedOrigins = [
    "http://localhost:5000",
    process.env.CLIENT_URL
].filter(Boolean);

// Start server
const startServer = async () => {

    try {

        // Connect to MongoDB
        await connectDB();

        // Create HTTP server
        const server = app.listen(PORT, () => {

            console.log("--------------------------------");
            console.log("SkillBridge Server Started!");
            console.log(`Port: ${PORT}`);
            console.log(`Health: http://localhost:${PORT}/api/health`);
            console.log("--------------------------------");

        });

        // Initialize Socket.IO
        const io = new Server(server, {

            cors: {
                origin: allowedOrigins,
                methods: ["GET", "POST"],
                credentials: true
            }

        });

        // Configure real-time chat
        configureChatSocket(io);

        console.log("SkillBridge Real-Time Chat Initialized!");

        // Handle unexpected server errors
        server.on("error", (error) => {

            console.error("HTTP Server Error:", error.message);

            process.exit(1);

        });

        // Graceful shutdown
        const shutdown = () => {

            console.log("\nShutting down SkillBridge server...");

            io.close(() => {

                server.close(async () => {

                    console.log("SkillBridge server closed.");

                    process.exit(0);

                });

            });

        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

    } catch (error) {

        console.error("Server startup failed:", error.message);

        process.exit(1);

    }

};

startServer();
