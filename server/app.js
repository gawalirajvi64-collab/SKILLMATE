
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const path = require("path");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const skillRoutes = require("./routes/skillRoutes");
const userSkillRoutes = require("./routes/userSkillRoutes");
const matchRoutes = require("./routes/matchRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const classroomRoutes = require("./routes/classroomRoutes");
const progressRoutes = require("./routes/progressRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://meet.jit.si"],
            frameSrc: ["'self'", "https://meet.jit.si"],
            connectSrc: [
                "'self'",
                "https://meet.jit.si",
                "wss://meet.jit.si",
                "https://*.jit.si",
                "wss://*.jit.si"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "blob:",
                "https://*.jit.si"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://meet.jit.si"
            ],
            fontSrc: [
                "'self'",
                "data:",
                "https://fonts.gstatic.com"
            ]
        }
    }
}));

// CORS configuration
const allowedOrigins = [
    "http://localhost:5000",
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Parse incoming JSON data
app.use(express.json({
    limit: "10kb"
}));

// Parse cookies
app.use(cookieParser());

// Serve frontend files
app.use(express.static(path.join(__dirname, "../client")));

// Authentication routes
app.use("/api/auth", authRoutes);

// User profile routes
app.use("/api/users", userRoutes);

// Available skills routes
app.use("/api/skills", skillRoutes);

// Student skill management routes
app.use("/api/user-skills", userSkillRoutes);

// Student matching routes
app.use("/api/matches", matchRoutes);

// Student connection routes
app.use("/api/connections", connectionRoutes);

// Student conversation routes
app.use("/api/conversations", conversationRoutes);

// Student messaging routes
app.use("/api/messages", messageRoutes);

// Student availability routes
app.use("/api/availability", availabilityRoutes);

// Student session routes
app.use("/api/sessions", sessionRoutes);

// Live classroom routes
app.use("/api/classrooms", classroomRoutes);

// Student progress routes
app.use("/api/progress", progressRoutes);

// Student feedback routes
app.use("/api/feedback", feedbackRoutes);

// Student notification routes
app.use("/api/notifications", notificationRoutes);

// Health check API
app.get("/api/health", (req, res) => {

    res.status(200).json({
        success: true,
        message: "SkillBridge server is running successfully!",
        status: "Healthy"
    });

});

// Handle unknown API routes
app.use("/api", (req, res) => {

    res.status(404).json({
        success: false,
        message: "API route not found"
    });

});

// Centralized error handling
app.use((error, req, res, next) => {

    console.error("Server Error:", error.message);

    if (res.headersSent) {
        return next(error);
    }

    if (error.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Request body is too large"
        });
    }

    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON data"
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });

});

module.exports = app;
