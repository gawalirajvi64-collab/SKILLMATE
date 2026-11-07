
const conversationList = document.getElementById("conversationList");
const chatHeader = document.getElementById("chatHeader");
const messagesArea = document.getElementById("messagesArea");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");

// Get login details
const token = localStorage.getItem("skillbridgeToken");

const currentUser = JSON.parse(
    localStorage.getItem("skillbridgeUser") || "null"
);

// Redirect if student is not logged in
if (!token || !currentUser) {
    window.location.href = "login.html";
}


// Store conversations and active chat
let conversations = [];
let activeConversationId = null;

// Prevent duplicate messages
let displayedMessageIds = new Set();


// Connect to Socket.IO
const socket = io({
    auth: {
        token: token
    }
});


// Socket connection status
socket.on("connect", () => {

    console.log("Connected to SkillBridge Real-Time Chat!");

});

socket.on("connect_error", (error) => {

    console.error("Chat Connection Error:", error.message);

});


// Format message time
function formatTime(date) {

    return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

}


// Display a message
function displayMessage(message) {

    // Prevent duplicate messages
    if (displayedMessageIds.has(message._id)) {
        return;
    }

    displayedMessageIds.add(message._id);

    const bubble = document.createElement("div");

    const isSent =
        message.sender._id === currentUser.id;

    bubble.className = isSent
        ? "message-bubble sent"
        : "message-bubble received";

    const content = document.createElement("div");

    content.textContent = message.content;

    const time = document.createElement("span");

    time.className = "message-time";

    time.textContent = formatTime(message.createdAt);

    bubble.appendChild(content);
    bubble.appendChild(time);

    messagesArea.appendChild(bubble);

    // Scroll to latest message
    messagesArea.scrollTop = messagesArea.scrollHeight;

}


// Load all conversations
async function loadConversations() {

    try {

        const response = await fetch("/api/conversations", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load conversations");
        }

        conversations = data.conversations;

        conversationList.innerHTML = "";

        if (conversations.length === 0) {

            conversationList.textContent =
                "No conversations yet. Connect with a student to start chatting.";

            return;
        }

        // Display conversation list
        conversations.forEach(conversation => {

            const otherStudent = conversation.participants.find(
                student => student._id === currentUser.id
                    ? false
                    : true
            );

            if (!otherStudent) return;

            const item = document.createElement("div");

            item.className = "conversation-item";

            if (conversation._id === activeConversationId) {
                item.classList.add("active");
            }

            const name = document.createElement("h3");

            name.textContent = otherStudent.fullName;

            const college = document.createElement("p");

            college.textContent = otherStudent.college;

            item.appendChild(name);
            item.appendChild(college);

            item.addEventListener("click", () => {
                openConversation(conversation._id);
            });

            conversationList.appendChild(item);

        });

    } catch (error) {

        conversationList.textContent = error.message;

    }

}


// Load messages from the backend
async function loadMessages(conversationId) {

    try {

        const response = await fetch(
            `/api/messages/${conversationId}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load messages");
        }

        // Ignore old response if another chat was selected
        if (activeConversationId !== conversationId) {
            return;
        }

        // Display previous messages
        data.messages.forEach(message => {
            displayMessage(message);
        });

    } catch (error) {

        messagesArea.textContent = error.message;

    }

}


// Open selected conversation
async function openConversation(conversationId) {

    const conversation = conversations.find(
        item => item._id === conversationId
    );

    if (!conversation) return;

    activeConversationId = conversationId;

    // Reset displayed messages
    displayedMessageIds.clear();

    messagesArea.innerHTML = "";

    messagesArea.textContent = "Loading messages...";

    // Find other student
    const otherStudent = conversation.participants.find(
        student => student._id !== currentUser.id
    );

    if (!otherStudent) return;

    // Update chat header
    chatHeader.innerHTML = "";

    const name = document.createElement("h2");

    name.textContent = otherStudent.fullName;

    const college = document.createElement("p");

    college.textContent = otherStudent.college;

    chatHeader.appendChild(name);
    chatHeader.appendChild(college);

    // Enable message input
    messageInput.disabled = false;

    sendMessageBtn.disabled = false;

    // Update selected conversation
    await loadConversations();

    // Join real-time conversation room
    socket.emit("joinConversation", conversationId);

    // Load previous messages
    await loadMessages(conversationId);

}


// Listen for successful room joining
socket.on("joinedConversation", (data) => {

    console.log(data.message);

});


// Receive real-time messages
socket.on("messageReceived", (message) => {

    if (
        message.conversation === activeConversationId
    ) {

        displayMessage(message);

    }

});


// Handle chat errors
socket.on("chatError", (data) => {

    alert(data.message);

});


// Send a real-time message
messageForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const content = messageInput.value.trim();

    if (!content || !activeConversationId) return;

    if (!socket.connected) {
        alert("Chat connection is unavailable. Please try again.");
        return;
    }

    sendMessageBtn.disabled = true;

    socket.emit("sendMessage", {
        conversationId: activeConversationId,
        content: content
    }, (response) => {

        sendMessageBtn.disabled = false;

        if (!response || !response.success) {
            alert(
                response?.message ||
                "Unable to send message. Please try again."
            );
            return;
        }

        messageInput.value = "";
        messageInput.focus();

    });

});


// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("skillbridgeToken");

    localStorage.removeItem("skillbridgeUser");

    window.location.href = "../index.html";

});


// Load conversations when page opens
loadConversations();
