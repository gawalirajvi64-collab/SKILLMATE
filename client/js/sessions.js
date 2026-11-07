
const receivedRequests = document.getElementById("receivedRequests");
const upcomingSessions = document.getElementById("upcomingSessions");
const sentRequests = document.getElementById("sentRequests");
const sessionHistory = document.getElementById("sessionHistory");

// Request session elements
const connectionSelect = document.getElementById("connectionSelect");
const availabilitySelect = document.getElementById("availabilitySelect");
const requestSessionBtn = document.getElementById("requestSessionBtn");
const requestMessage = document.getElementById("requestMessage");

const token = localStorage.getItem("skillbridgeToken");

const currentUser = JSON.parse(
    localStorage.getItem("skillbridgeUser") || "null"
);

const currentUserId = currentUser
    ? (currentUser.id || currentUser._id)
    : null;

if (!token || !currentUser) {
    window.location.href = "login.html";
}


// Format date and time
function formatDateTime(date) {

    return new Date(date).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });

}


// Create session card
function createSessionCard(session, student, showActions = false) {

    const card = document.createElement("div");

    card.className = "profile-card";

    const name = document.createElement("h3");
    name.textContent = student.fullName;

    const college = document.createElement("p");
    college.textContent = student.college;

    const date = document.createElement("p");
    date.textContent = `Date and Time: ${formatDateTime(session.startAt)}`;

    const endTime = document.createElement("p");
    endTime.textContent = `Ends: ${formatDateTime(session.endAt)}`;

    const status = document.createElement("p");
    status.textContent = `Status: ${session.status}`;

    card.appendChild(name);
    card.appendChild(college);
    card.appendChild(date);
    card.appendChild(endTime);
    card.appendChild(status);


    // Join and complete buttons
    if (session.status === "accepted") {

        const joinBtn = document.createElement("button");

        joinBtn.textContent = "Join Classroom";
        joinBtn.className = "register-btn";
        joinBtn.style.marginTop = "15px";

        joinBtn.addEventListener("click", () => {

            window.location.href =
                `classroom.html?sessionId=${session._id}`;

        });

        card.appendChild(joinBtn);


        const completeBtn = document.createElement("button");

        completeBtn.textContent = "Mark as Completed";
        completeBtn.className = "login-btn";
        completeBtn.style.marginTop = "15px";
        completeBtn.style.marginLeft = "10px";

        completeBtn.addEventListener("click", () => {

            completeSession(session._id);

        });

        card.appendChild(completeBtn);

    }


    // Accept and reject buttons
    if (showActions) {

        const acceptBtn = document.createElement("button");

        acceptBtn.textContent = "Accept";
        acceptBtn.className = "login-btn";

        acceptBtn.addEventListener("click", () => {

            respondToSession(session._id, "accepted");

        });


        const rejectBtn = document.createElement("button");

        rejectBtn.textContent = "Reject";
        rejectBtn.className = "login-btn";
        rejectBtn.style.marginLeft = "10px";

        rejectBtn.addEventListener("click", () => {

            respondToSession(session._id, "rejected");

        });

        card.appendChild(acceptBtn);
        card.appendChild(rejectBtn);

    }

    return card;

}


// Load accepted connections
async function loadAcceptedConnections() {

    try {

        const response = await fetch("/api/connections", {

            method: "GET",

            headers: {
                "Authorization": `Bearer ${token}`
            }

        });

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Unable to load connections"
            );

        }

        const acceptedConnections = data.connections.filter(
            connection => connection.status === "accepted"
        );

        connectionSelect.innerHTML =
            '<option value="">Select a student</option>';

        availabilitySelect.innerHTML =
            '<option value="">Select a student first</option>';

        availabilitySelect.disabled = true;
        requestSessionBtn.disabled = true;


        if (acceptedConnections.length === 0) {

            connectionSelect.innerHTML =
                '<option value="">No accepted connections available</option>';

            return;

        }


        acceptedConnections.forEach(connection => {

            const otherStudent =
                String(connection.requester._id) === String(currentUserId)
                    ? connection.receiver
                    : connection.requester;

            const option = document.createElement("option");

            option.value = connection._id;

            option.textContent =
                `${otherStudent.fullName} - ${otherStudent.college}`;

            option.dataset.studentId = otherStudent._id;

            connectionSelect.appendChild(option);

        });


    } catch (error) {

        connectionSelect.innerHTML =
            '<option value="">Unable to load connections</option>';

        requestMessage.textContent = error.message;

    }

}


// Load selected student's available slots
async function loadStudentAvailability(studentId) {

    availabilitySelect.innerHTML =
        '<option value="">Loading available slots...</option>';

    availabilitySelect.disabled = true;
    requestSessionBtn.disabled = true;

    requestMessage.textContent = "";


    try {

        const response = await fetch(
            `/api/availability/student/${studentId}`,
            {

                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }

            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Unable to load available slots"
            );

        }


        availabilitySelect.innerHTML =
            '<option value="">Select a time slot</option>';


        if (data.availability.length === 0) {

            availabilitySelect.innerHTML =
                '<option value="">No available slots</option>';

            return;

        }


        data.availability.forEach(slot => {

            const option = document.createElement("option");

            option.value = slot._id;

            option.textContent =
                `${formatDateTime(slot.startAt)} - ${formatDateTime(slot.endAt)}`;

            availabilitySelect.appendChild(option);

        });

        availabilitySelect.disabled = false;


    } catch (error) {

        availabilitySelect.innerHTML =
            '<option value="">Unable to load slots</option>';

        requestMessage.textContent = error.message;

    }

}


// When student is selected
connectionSelect.addEventListener("change", () => {

    const selectedOption =
        connectionSelect.options[connectionSelect.selectedIndex];

    const studentId = selectedOption.dataset.studentId;

    availabilitySelect.innerHTML =
        '<option value="">Select a student first</option>';

    availabilitySelect.disabled = true;
    requestSessionBtn.disabled = true;

    requestMessage.textContent = "";


    if (studentId) {

        loadStudentAvailability(studentId);

    }

});


// Enable request button after selecting a slot
availabilitySelect.addEventListener("change", () => {

    requestSessionBtn.disabled =
        !availabilitySelect.value;

});


// Send session request
requestSessionBtn.addEventListener("click", async () => {

    const connectionId = connectionSelect.value;
    const availabilityId = availabilitySelect.value;

    if (!connectionId || !availabilityId) {

        requestMessage.textContent =
            "Please select a student and time slot.";

        return;

    }


    try {

        requestSessionBtn.disabled = true;

        requestMessage.textContent =
            "Sending session request...";


        const response = await fetch("/api/sessions", {

            method: "POST",

            headers: {

                "Content-Type": "application/json",

                "Authorization": `Bearer ${token}`

            },

            body: JSON.stringify({

                connectionId,
                availabilityId

            })

        });


        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Unable to send session request"
            );

        }


        requestMessage.textContent = data.message;

        availabilitySelect.value = "";

        requestSessionBtn.disabled = true;

        await loadSessions();

        // Refresh slots in case the selected slot was booked
        const selectedOption =
            connectionSelect.options[connectionSelect.selectedIndex];

        const studentId = selectedOption.dataset.studentId;

        if (studentId) {

            await loadStudentAvailability(studentId);

        }


    } catch (error) {

        requestMessage.textContent = error.message;

        requestSessionBtn.disabled =
            !availabilitySelect.value;

    }

});


// Load all sessions
async function loadSessions() {

    try {

        const response = await fetch("/api/sessions", {

            method: "GET",

            headers: {

                "Authorization": `Bearer ${token}`

            }

        });

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Unable to load sessions"
            );

        }


        const sessions = data.sessions;

        receivedRequests.innerHTML = "";
        upcomingSessions.innerHTML = "";
        sentRequests.innerHTML = "";
        sessionHistory.innerHTML = "";


        // Filter session categories
        const received = sessions.filter(session =>

            String(session.receiver._id) === String(currentUserId) &&
            session.status === "pending"

        );


        const sent = sessions.filter(session =>

            String(session.requester._id) === String(currentUserId) &&
            session.status === "pending"

        );


        const upcoming = sessions.filter(session =>

            session.status === "accepted"

        );


        const history = sessions.filter(session =>

            ["rejected", "cancelled", "completed"].includes(session.status)

        );


        // Update summary counts
        document.getElementById("upcomingCount").textContent =
            upcoming.length;

        document.getElementById("pendingCount").textContent =
            received.length;

        document.getElementById("completedCount").textContent =
            sessions.filter(session =>

                session.status === "completed"

            ).length;


        // Received requests
        if (received.length === 0) {

            receivedRequests.textContent =
                "No pending requests received.";

        } else {

            received.forEach(session => {

                receivedRequests.appendChild(

                    createSessionCard(
                        session,
                        session.requester,
                        true
                    )

                );

            });

        }


        // Upcoming sessions
        if (upcoming.length === 0) {

            upcomingSessions.textContent =
                "No upcoming sessions.";

        } else {

            upcoming.forEach(session => {

                const otherStudent =

                    String(session.requester._id) === String(currentUserId)
                        ? session.receiver
                        : session.requester;


                upcomingSessions.appendChild(

                    createSessionCard(session, otherStudent)

                );

            });

        }


        // Sent requests
        if (sent.length === 0) {

            sentRequests.textContent =
                "No pending requests sent.";

        } else {

            sent.forEach(session => {

                sentRequests.appendChild(

                    createSessionCard(
                        session,
                        session.receiver
                    )

                );

            });

        }


        // Session history
        if (history.length === 0) {

            sessionHistory.textContent =
                "No session history available.";

        } else {

            history.forEach(session => {

                const otherStudent =

                    String(session.requester._id) === String(currentUserId)
                        ? session.receiver
                        : session.requester;


                sessionHistory.appendChild(

                    createSessionCard(session, otherStudent)

                );

            });

        }


    } catch (error) {

        receivedRequests.textContent = error.message;

    }

}


// Accept or reject session request
async function respondToSession(sessionId, status) {

    try {

        const response = await fetch(
            `/api/sessions/${sessionId}/respond`,
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

            throw new Error(
                data.message || "Unable to update session"
            );

        }


        alert(data.message);

        await loadSessions();

    } catch (error) {

        alert(error.message);

    }

}


// Mark session as completed
async function completeSession(sessionId) {

    try {

        const confirmed = confirm(
            "Are you sure you want to mark this session as completed?"
        );

        if (!confirmed) {

            return;

        }


        const response = await fetch(
            `/api/sessions/${sessionId}/complete`,
            {

                method: "PUT",

                headers: {

                    "Authorization": `Bearer ${token}`

                }

            }
        );


        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Unable to complete session"
            );

        }


        alert(data.message);

        await loadSessions();

    } catch (error) {

        alert(error.message);

    }

}


// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("skillbridgeToken");

    localStorage.removeItem("skillbridgeUser");

    window.location.href = "../index.html";

});


// Initial page loading
loadAcceptedConnections();

loadSessions();
