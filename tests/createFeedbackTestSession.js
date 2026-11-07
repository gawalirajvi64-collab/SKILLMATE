
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../server/config/db");
const Session = require("../server/models/Session");

const createTestSession = async () => {

    try {

        await connectDB();

        // Find an existing accepted session
        const existingSession = await Session.findOne({
            status: "accepted"
        });

        if (!existingSession) {
            throw new Error("No accepted session found");
        }

        // Create a separate completed test session
        const testSession = await Session.create({

            requester: existingSession.requester,
            receiver: existingSession.receiver,
            connection: existingSession.connection,
            availability: existingSession.availability,

            startAt: new Date("2026-11-04T10:00:00.000Z"),
            endAt: new Date("2026-11-04T11:00:00.000Z"),

            status: "completed"

        });

        console.log("--------------------------------");
        console.log("Test Session Created Successfully!");
        console.log("Test Session ID:", testSession._id);
        console.log("Status:", testSession.status);
        console.log("--------------------------------");

    } catch (error) {

        console.error("Error:", error.message);

    } finally {

        await mongoose.disconnect();

    }

};

createTestSession();
