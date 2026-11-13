
const receivedList = document.getElementById("receivedRequests");
const sentList = document.getElementById("sentRequests");
const acceptedList = document.getElementById("acceptedConnections");

const totalConnections = document.getElementById("connectionCount");
const pendingConnections = document.getElementById("pendingCount");
const acceptedCount = document.getElementById("acceptedCount");

// Get authentication token
const token = localStorage.getItem("skillbridgeToken");

// Redirect if student is not logged in
if (!token) {
    window.location.href = "login.html";
}


// Get current logged-in student's ID
function getCurrentUserId() {

    const user = JSON.parse(
        localStorage.getItem("skillbridgeUser") || "null"
    );

    return user ? user.id : null;

}


// Load all connections
async function loadConnections() {

    try {

        const response = await fetch("/api/connections", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load connections");
        }

        const connections = data.connections;
        const currentUserId = getCurrentUserId();

        // Separate pending received requests
        const received = connections.filter(connection =>
            String(connection.receiver._id) === String(currentUserId) &&
            connection.status === "pending"
        );

        // Separate pending sent requests
        const sent = connections.filter(connection =>
            String(connection.requester._id) === String(currentUserId) &&
            connection.status === "pending"
        );

        // Separate accepted connections
        const accepted = connections.filter(connection =>
            connection.status === "accepted"
        );

        // Update statistics
        totalConnections.textContent = connections.length;

        pendingConnections.textContent =
            connections.filter(connection =>
                connection.status === "pending"
            ).length;

        acceptedCount.textContent = accepted.length;

        // Display connection sections
        displayConnections(received, receivedList, "received");

        displayConnections(sent, sentList, "sent");

        displayConnections(accepted, acceptedList, "accepted");

    } catch (error) {

        receivedList.textContent = error.message;
        sentList.textContent = error.message;
        acceptedList.textContent = error.message;

    }

}


// Display connection cards
function displayConnections(connections, container, type) {

    container.innerHTML = "";

    if (connections.length === 0) {

        container.textContent = "No connections to display yet.";
        return;

    }

    connections.forEach(connection => {

        const card = document.createElement("div");
        card.className = "connection-card";

        // Identify the other student
        const currentUserId = getCurrentUserId();

        let student;

        if (type === "received") {

            student = connection.requester;

        }
        else if (type === "sent") {

            student = connection.receiver;

        }
        else {

            student =
                String(connection.requester._id) === String(currentUserId)
                    ? connection.receiver
                    : connection.requester;

        }

        // Student information
        const studentInfo = document.createElement("div");
        studentInfo.className = "connection-student-info";

        // Student avatar
        const avatar = document.createElement("div");
        avatar.className = "connection-avatar";
        avatar.textContent =
            student.fullName.charAt(0).toUpperCase();

        // Student details
        const details = document.createElement("div");

        const name = document.createElement("h3");
        name.textContent = student.fullName;

        const college = document.createElement("p");
        college.textContent = student.college;

        details.appendChild(name);
        details.appendChild(college);

        studentInfo.appendChild(avatar);
        studentInfo.appendChild(details);

        card.appendChild(studentInfo);

        // Connection status
        const status = document.createElement("span");
        status.className = "connection-status";
        status.textContent = connection.status.toUpperCase();

        card.appendChild(status);

        // Accept and reject buttons
        if (type === "received" && connection.status === "pending") {

            const actions = document.createElement("div");
            actions.className = "connection-actions";

            // Accept button
            const acceptButton = document.createElement("button");
            acceptButton.textContent = "Accept";
            acceptButton.className = "accept-btn";

            acceptButton.addEventListener("click", () => {
                respondToRequest(connection._id, "accepted");
            });

            // Reject button
            const rejectButton = document.createElement("button");
            rejectButton.textContent = "Reject";
            rejectButton.className = "reject-btn";

            rejectButton.addEventListener("click", () => {
                respondToRequest(connection._id, "rejected");
            });

            actions.appendChild(acceptButton);
            actions.appendChild(rejectButton);

            card.appendChild(actions);

        }

        container.appendChild(card);

    });

}


// Accept or reject a connection request
async function respondToRequest(connectionId, status) {

    try {

        const response = await fetch(
            `/api/connections/${connectionId}/respond`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to update request");
        }

        alert(data.message);

        // Refresh connection details
        await loadConnections();

    } catch (error) {

        alert(error.message);

    }

}


// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("skillbridgeToken");
    localStorage.removeItem("skillbridgeUser");

    window.location.href = "../index.html";

});


// Load connections when page opens
loadConnections();
