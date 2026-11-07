const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
    auth: {
        token: "invalid.fake.token"
    },
    reconnection: false,
    timeout: 5000
});

socket.on("connect", () => {
    console.log("FAIL: Invalid token was accepted.");
    socket.disconnect();
    process.exit(1);
});

socket.on("connect_error", (error) => {
    console.log("PASS: Invalid token rejected.");
    console.log("Server response:", error.message);
    process.exit(0);
});
