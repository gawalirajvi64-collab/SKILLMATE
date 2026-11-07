
const token = localStorage.getItem("skillbridgeToken");

const currentUser = JSON.parse(
    localStorage.getItem("skillbridgeUser") || "null"
);

const completedSessions =
    document.getElementById("completedSessions");

const totalLearningHours =
    document.getElementById("totalLearningHours");

const learningSkills =
    document.getElementById("learningSkills");

const teachingSkills =
    document.getElementById("teachingSkills");

const recentActivity =
    document.getElementById("recentActivity");

// Check login
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

// Load student progress
async function loadProgress() {

    try {

        const response = await fetch("/api/progress", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to load progress"
            );
        }

        const progress = data.progress;

        // Update progress statistics
        completedSessions.textContent =
            progress.completedSessions;

        totalLearningHours.textContent =
            progress.totalLearningHours;

        learningSkills.textContent =
            progress.learningSkills;

        teachingSkills.textContent =
            progress.teachingSkills;

        // Display recent activity
        recentActivity.innerHTML = "";

        if (data.recentActivity.length === 0) {

            recentActivity.textContent =
                "No completed learning sessions yet. Start learning with your SkillBridge partners!";

            return;

        }

        data.recentActivity.forEach(session => {

            const card = document.createElement("div");

            card.className = "profile-card";

            const otherStudent =
                session.requester._id === currentUser.id
                    ? session.receiver
                    : session.requester;

            const heading = document.createElement("h3");

            heading.textContent =
                `Learning session with ${otherStudent.fullName}`;

            const date = document.createElement("p");

            date.textContent =
                `Date: ${formatDateTime(session.startAt)}`;

            const status = document.createElement("p");

            status.textContent = "Status: Completed";

            card.appendChild(heading);
            card.appendChild(date);
            card.appendChild(status);

            recentActivity.appendChild(card);

        });

    } catch (error) {

        recentActivity.textContent = error.message;

    }

}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("skillbridgeToken");
    localStorage.removeItem("skillbridgeUser");

    window.location.href = "../index.html";

});

// Load progress when page opens
loadProgress();
