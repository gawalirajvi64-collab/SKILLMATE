
const API_URL = "http://localhost:5000/api";

// DOM Elements
const receivedRequests = document.getElementById("receivedRequests");
const upcomingSessionsList = document.getElementById("upcomingSessionsList");
const sentRequests = document.getElementById("sentRequests");
const sessionHistory = document.getElementById("sessionHistory");

const connectionSelect = document.getElementById("connectionSelect");
const skillSelect = document.getElementById("skillSelect");
const availabilitySelect = document.getElementById("availabilitySelect");

const requestSessionBtn = document.getElementById("requestSessionBtn");
const requestMessage = document.getElementById("requestMessage");

// Authentication
const token = localStorage.getItem("skillbridgeToken");

const currentUser = JSON.parse(
    localStorage.getItem("skillbridgeUser") || "null"
);

// Support both id and _id formats
const currentUserId = currentUser?.id || currentUser?._id;

if (!token || !currentUser || !currentUserId) {
    window.location.href = "../login.html";
}

// Store the logged-in student's learning skills
const myLearningSkillIds = new Set();

// Common request headers
function getHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    };
}

// Reset dropdowns
function resetSkillSelect(message = "Select a student first") {
    skillSelect.innerHTML = "";

    const option = document.createElement("option");
    option.value = "";
    option.textContent = message;

    skillSelect.appendChild(option);
    skillSelect.disabled = true;
}

function resetAvailabilitySelect(message = "Select a skill first") {
    availabilitySelect.innerHTML = "";

    const option = document.createElement("option");
    option.value = "";
    option.textContent = message;

    availabilitySelect.appendChild(option);
    availabilitySelect.disabled = true;
}

// Get a student's display name
function getStudentName(student) {
    return student?.fullName || student?.name || "Student";
}

// Load the logged-in student's learning skills
async function loadMyLearningSkills() {
    const response = await fetch(`${API_URL}/user-skills`, {
        headers: getHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to load your skills.");
    }

    myLearningSkillIds.clear();

    data.userSkills.forEach(userSkill => {
        if (
            userSkill.type === "learn" &&
            userSkill.skill &&
            userSkill.skill._id
        ) {
            myLearningSkillIds.add(String(userSkill.skill._id));
        }
    });
}

// Load accepted connections
async function loadAcceptedConnections() {
    const response = await fetch(`${API_URL}/connections`, {
        headers: getHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to load connections.");
    }

    connectionSelect.innerHTML =
        '<option value="">Select a student</option>';

    data.connections
        .filter(connection => connection.status === "accepted")
        .forEach(connection => {

            const otherStudent =
                String(connection.requester._id) === String(currentUserId)
                    ? connection.receiver
                    : connection.requester;

            const option = document.createElement("option");

            option.value = connection._id;

            option.textContent =
                `${getStudentName(otherStudent)} (${otherStudent.college || "College"})`;

            option.dataset.studentId = otherStudent._id;

            connectionSelect.appendChild(option);
        });

    resetSkillSelect();
    resetAvailabilitySelect();
}

// Load teaching skills of the selected connected student
async function loadStudentTeachingSkills(connectionId) {
    resetSkillSelect("Loading available skills...");
    resetAvailabilitySelect();

    requestSessionBtn.disabled = true;

    const response = await fetch(
        `${API_URL}/user-skills/connection/${connectionId}/teaching-skills`,
        {
            headers: getHeaders()
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to load teaching skills.");
    }

    skillSelect.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a skill";

    skillSelect.appendChild(defaultOption);

    // Only show skills that:
    // 1. The other student can teach.
    // 2. The logged-in student wants to learn.
    const matchingSkills = data.teachingSkills.filter(userSkill => {
        return (
            userSkill.skill &&
            myLearningSkillIds.has(String(userSkill.skill._id))
        );
    });

    matchingSkills.forEach(userSkill => {
        const option = document.createElement("option");

        option.value = userSkill.skill._id;
        option.textContent = userSkill.skill.name;

        skillSelect.appendChild(option);
    });

    skillSelect.disabled = matchingSkills.length === 0;

    if (matchingSkills.length === 0) {
        skillSelect.innerHTML =
            '<option value="">No matching skills available</option>';
    }
}

// Load available time slots of the selected student
async function loadStudentAvailability(studentId) {
    resetAvailabilitySelect("Loading available slots...");

    const response = await fetch(
        `${API_URL}/availability/student/${studentId}`,
        {
            headers: getHeaders()
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to load availability.");
    }

    availabilitySelect.innerHTML =
        '<option value="">Select a time slot</option>';

    const availableSlots = data.availability || [];

    availableSlots.forEach(slot => {
        const option = document.createElement("option");

        option.value = slot._id;

        const start = new Date(slot.startAt);
        const end = new Date(slot.endAt);

        option.textContent =
            `${start.toLocaleString()} - ${end.toLocaleTimeString()}`;

        availabilitySelect.appendChild(option);
    });

    availabilitySelect.disabled = availableSlots.length === 0;

    if (availableSlots.length === 0) {
        availabilitySelect.innerHTML =
            '<option value="">No available slots</option>';
    }
}

// Create a session card
function createSessionCard(session, student, showActions = false) {
    const card = document.createElement("div");
    card.className = "session-card";

    const name = document.createElement("h3");
    name.textContent = getStudentName(student);

    const college = document.createElement("p");
    college.textContent = student?.college || "College not available";

    const skill = document.createElement("p");
    skill.textContent = session.skill
        ? `Skill: ${session.skill.name}`
        : "Skill: Not recorded";

    const date = document.createElement("p");
    date.textContent =
        `Start: ${new Date(session.startAt).toLocaleString()}`;

    const endDate = document.createElement("p");
    endDate.textContent =
        `End: ${new Date(session.endAt).toLocaleString()}`;

    const status = document.createElement("p");
    status.textContent = `Status: ${session.status}`;

    card.append(name, college, skill, date, endDate, status);

    if (session.status === "accepted" && session.meetingRoomId) {
        const joinButton = document.createElement("button");

        joinButton.textContent = "Join Classroom";

        joinButton.addEventListener("click", () => {
            window.open(
                `https://meet.jit.si/${encodeURIComponent(session.meetingRoomId)}`,
                "_blank",
                "noopener,noreferrer"
            );
        });

        card.appendChild(joinButton);
    }

    if (session.status === "accepted") {
        const completeButton = document.createElement("button");

        completeButton.textContent = "Mark Completed";

        completeButton.addEventListener("click", () => {
            completeSession(session._id);
        });

        card.appendChild(completeButton);
    }

    if (showActions && session.status === "pending") {
        const acceptButton = document.createElement("button");
        acceptButton.textContent = "Accept";

        acceptButton.addEventListener("click", () => {
            respondToSession(session._id, "accepted");
        });

        const rejectButton = document.createElement("button");
        rejectButton.textContent = "Reject";

        rejectButton.addEventListener("click", () => {
            respondToSession(session._id, "rejected");
        });

        card.append(acceptButton, rejectButton);
    }

    return card;
}

// Load all sessions
async function loadSessions() {
    const response = await fetch(`${API_URL}/sessions`, {
        headers: getHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to load sessions.");
    }

    const sessions = data.sessions || [];

    receivedRequests.innerHTML = "";
    upcomingSessionsList.innerHTML = "";
    sentRequests.innerHTML = "";
    sessionHistory.innerHTML = "";

    let receivedCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;

    sessions.forEach(session => {
        const isRequester =
            String(session.requester._id) === String(currentUserId);

        const otherStudent = isRequester
            ? session.receiver
            : session.requester;

        if (session.status === "completed") {
            completedCount++;

            sessionHistory.appendChild(
                createSessionCard(session, otherStudent)
            );
        } else if (session.status === "pending" && !isRequester) {
            receivedCount++;

            receivedRequests.appendChild(
                createSessionCard(session, otherStudent, true)
            );
        } else if (session.status === "pending" && isRequester) {
            sentRequests.appendChild(
                createSessionCard(session, otherStudent)
            );
        } else if (session.status === "accepted") {
            upcomingCount++;

            upcomingSessionsList.appendChild(
                createSessionCard(session, otherStudent)
            );
        }
    });

    if (receivedCount === 0) {
        receivedRequests.textContent = "No received requests.";
    }

    if (upcomingCount === 0) {
        upcomingSessionsList.textContent = "No upcoming sessions.";
    }

    if (sentRequests.children.length === 0) {
        sentRequests.textContent = "No sent requests.";
    }

    if (completedCount === 0) {
        sessionHistory.textContent = "No previous sessions.";
    }

    document.getElementById("totalSessions").textContent =
        sessions.length;

    document.getElementById("upcomingSessions").textContent =
        upcomingCount;

    document.getElementById("completedSessions").textContent =
        completedCount;
}

// Respond to a session request
async function respondToSession(sessionId, status) {
    try {
        const response = await fetch(
            `${API_URL}/sessions/${sessionId}/respond`,
            {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({ status })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to respond.");
        }

        await loadSessions();

    } catch (error) {
        alert(error.message);
    }
}

// Mark session as completed
async function completeSession(sessionId) {
    try {
        const response = await fetch(
            `${API_URL}/sessions/${sessionId}/complete`,
            {
                method: "PUT",
                headers: getHeaders()
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to complete session.");
        }

        await loadSessions();

    } catch (error) {
        alert(error.message);
    }
}

// When student selection changes
connectionSelect.addEventListener("change", async () => {
    const connectionId = connectionSelect.value;

    resetSkillSelect();
    resetAvailabilitySelect();

    requestSessionBtn.disabled = true;
    requestMessage.textContent = "";

    if (!connectionId) {
        return;
    }

    try {
        await loadStudentTeachingSkills(connectionId);
    } catch (error) {
        resetSkillSelect("Unable to load skills");
        requestMessage.textContent = error.message;
    }
});

// When skill selection changes
skillSelect.addEventListener("change", async () => {
    const selectedOption =
        connectionSelect.options[connectionSelect.selectedIndex];

    const studentId = selectedOption?.dataset.studentId;
    const skillId = skillSelect.value;

    resetAvailabilitySelect();

    requestSessionBtn.disabled = true;
    requestMessage.textContent = "";

    if (!skillId || !studentId) {
        return;
    }

    try {
        await loadStudentAvailability(studentId);
    } catch (error) {
        resetAvailabilitySelect("Unable to load slots");
        requestMessage.textContent = error.message;
    }
});

// When availability selection changes
availabilitySelect.addEventListener("change", () => {
    requestSessionBtn.disabled = !(
        connectionSelect.value &&
        skillSelect.value &&
        availabilitySelect.value
    );
});

// Request a session
requestSessionBtn.addEventListener("click", async () => {
    const connectionId = connectionSelect.value;
    const skillId = skillSelect.value;
    const availabilityId = availabilitySelect.value;

    if (!connectionId || !skillId || !availabilityId) {
        requestMessage.textContent =
            "Please select a student, skill and time slot.";

        return;
    }

    requestSessionBtn.disabled = true;
    requestMessage.textContent = "Sending session request...";

    try {
        const response = await fetch(`${API_URL}/sessions`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                connectionId,
                skillId,
                availabilityId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to send request.");
        }

        requestMessage.textContent =
            "Session request sent successfully!";

        availabilitySelect.value = "";

        await loadSessions();

    } catch (error) {
        requestMessage.textContent = error.message;
    } finally {
        requestSessionBtn.disabled = !(
            connectionSelect.value &&
            skillSelect.value &&
            availabilitySelect.value
        );
    }
});

// Initialize page
async function initializePage() {
    try {
        await loadMyLearningSkills();
        await loadAcceptedConnections();
        await loadSessions();

    } catch (error) {
        requestMessage.textContent = error.message;
    }
}

initializePage();
