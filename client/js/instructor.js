const token = localStorage.getItem("skillbridgeToken");

const currentUser = JSON.parse(
    localStorage.getItem("skillbridgeUser") || "null"
);

if (!token || !currentUser) {
    window.location.href = "login.html";
}

// Dashboard elements
const teachingSkills = document.getElementById("teachingSkills");
const totalSessions = document.getElementById("totalSessions");
const completedSessions = document.getElementById("completedSessions");
const learners = document.getElementById("learners");
const teachingActivity = document.getElementById("teachingActivity");

// Format date and time
function formatDateTime(date) {
    return new Date(date).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// Load instructor dashboard
async function loadInstructorDashboard() {

    try {

        const headers = {
            "Authorization": `Bearer ${token}`
        };

        // Fetch progress and sessions
        const [progressResponse, sessionResponse] = await Promise.all([

            fetch("/api/progress", { headers }),

            fetch("/api/sessions", { headers })

        ]);

        const progressData = await progressResponse.json();
        const sessionData = await sessionResponse.json();

        if (!progressResponse.ok) {
            throw new Error(progressData.message);
        }

        if (!sessionResponse.ok) {
            throw new Error(sessionData.message);
        }

        const sessions = sessionData.sessions;

        // Calculate dashboard statistics
        teachingSkills.textContent =
            progressData.progress.teachingSkills;

        totalSessions.textContent = sessions.length;

        completedSessions.textContent =
            sessions.filter(session =>
                session.status === "completed"
            ).length;

        // Find unique students from session history
        const studentIds = new Set();

        sessions.forEach(session => {

            const otherStudent =
                session.requester._id === currentUser.id
                    ? session.receiver
                    : session.requester;

            studentIds.add(otherStudent._id);

        });

        learners.textContent = studentIds.size;

        // Display teaching activity
        teachingActivity.innerHTML = "";

        if (sessions.length === 0) {

            teachingActivity.textContent =
                "No teaching activity yet. Add your skills and connect with students!";

            return;

        }

        sessions.slice(0, 5).forEach(session => {

            const otherStudent =
                session.requester._id === currentUser.id
                    ? session.receiver
                    : session.requester;

            const card = document.createElement("div");
            card.className = "profile-card";

            const heading = document.createElement("h3");
            heading.textContent = otherStudent.fullName;

            const date = document.createElement("p");
            date.textContent =
                `Session: ${formatDateTime(session.startAt)}`;

            const status = document.createElement("p");
            status.textContent =
                `Status: ${session.status}`;

            card.appendChild(heading);
            card.appendChild(date);
            card.appendChild(status);

            teachingActivity.appendChild(card);

        });

    } catch (error) {

        teachingActivity.textContent =
            error.message || "Unable to load instructor dashboard";

    }

}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("skillbridgeToken");
    localStorage.removeItem("skillbridgeUser");

    window.location.href = "../index.html";

});

// Load dashboard
loadInstructorDashboard();