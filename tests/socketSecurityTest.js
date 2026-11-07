const { io } = require("socket.io-client");

const targetConversationId = process.env.TARGET_CONVERSATION_ID;
const token = process.env.TEST_TOKEN;

if (!token || !targetConversationId) {
    console.log("Missing test token or conversation ID.");
    process.exit(1);
}

const socket = io("http://localhost:5000", {
    auth: { token },
    reconnection: false,
    timeout: 5000
});

let stage = 0;

const timeout = setTimeout(() => {
    console.log("FAIL: Test timed out.");
    socket.disconnect();
    process.exit(1);
}, 10000);

socket.on("connect", () => {
    console.log("Socket authenticated successfully.");

    console.log("\nTesting unauthorized conversation access...");

    socket.emit("joinConversation", targetConversationId);
});

socket.on("chatError", (data) => {

    if (
        stage === 0 &&
        data.message === "You cannot access this conversation"
    ) {
        console.log("PASS: Outsider cannot join private conversation.");

        stage = 1;

        console.log("\nTesting message sending without joining...");

        socket.emit("sendMessage", {
            conversationId: targetConversationId,
            content: "Unauthorized socket security test"
        });

    } else if (
        stage === 1 &&
        data.message === "Join the conversation before sending messages"
    ) {
        console.log("PASS: User cannot send messages without joining.");

        clearTimeout(timeout);
        socket.disconnect();

        console.log("\nAll Socket.IO security tests passed!");

        process.exit(0);

    } else {
        console.log("FAIL: Unexpected response:", data.message);

        clearTimeout(timeout);
        socket.disconnect();
        process.exit(1);
    }
});

socket.on("joinedConversation", () => {
    console.log("FAIL: Unauthorized user joined the conversation.");

    clearTimeout(timeout);
    socket.disconnect();
    process.exit(1);
});

socket.on("connect_error", (error) => {
    console.log("FAIL: Socket authentication failed:", error.message);

    clearTimeout(timeout);
    process.exit(1);
});