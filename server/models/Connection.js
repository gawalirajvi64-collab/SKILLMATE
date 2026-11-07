
const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema({

    // Students involved in the connection
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Connection request status
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }

}, {
    timestamps: true
});


// Prevent duplicate requests in the same direction
connectionSchema.index(
    { requester: 1, receiver: 1 },
    { unique: true }
);


// Create Connection model
const Connection = mongoose.model("Connection", connectionSchema);

module.exports = Connection;
