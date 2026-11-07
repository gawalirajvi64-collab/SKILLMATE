const token = localStorage.getItem("skillbridgeToken");

const currentUser = JSON.parse(
    localStorage.getItem("skillbridgeUser") || "null"
);

const feedbackForm = document.getElementById("feedbackForm");
const receivedFeedback = document.getElementById("receivedFeedback");

if (!token || !currentUser) {
    window.location.href = "login.html";
}

// Format date
function formatDateTime(date) {
    return new Date(date).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// Load completed sessions
async function loadCompletedSessions() {

    try {

        const response = await fetch("/api/sessions", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load sessions");
        }

        const completed = data.sessions.filter(
            session => session.status === "completed"
        );

        feedbackForm.innerHTML = "";

        if (completed.length === 0) {
            feedbackForm.textContent =
                "No completed sessions available for feedback yet.";
            return;
        }

        completed.forEach(session => {

            const otherStudent =
                session.requester._id === currentUser.id
                    ? session.receiver
                    : session.requester;

            const card = document.createElement("div");
            card.className = "profile-card";

            const heading = document.createElement("h3");
            heading.textContent =
                `Feedback for ${otherStudent.fullName}`;

            const date = document.createElement("p");
            date.textContent =
                `Session: ${formatDateTime(session.startAt)}`;

            const ratingLabel = document.createElement("label");
            ratingLabel.textContent = "Select Rating:";

            const rating = document.createElement("select");

            for (let i = 1; i <= 5; i++) {
                const option = document.createElement("option");
                option.value = i;
                option.textContent = `${i} Star${i > 1 ? "s" : ""}`;
                rating.appendChild(option);
            }

            const comment = document.createElement("textarea");
            comment.placeholder = "Write your feedback...";
            comment.maxLength = 500;
            comment.rows = 3;

            const submitBtn = document.createElement("button");
            submitBtn.textContent = "Submit Feedback";
            submitBtn.className = "register-btn";

            submitBtn.addEventListener("click", () => {
                submitFeedback(session._id, rating.value, comment.value);
            });

            card.appendChild(heading);
            card.appendChild(date);
            card.appendChild(ratingLabel);
            card.appendChild(rating);
            card.appendChild(document.createElement("br"));
            card.appendChild(comment);
            card.appendChild(document.createElement("br"));
            card.appendChild(submitBtn);

            feedbackForm.appendChild(card);

        });

    } catch (error) {

        feedbackForm.textContent = error.message;

    }

}

// Submit feedback
async function submitFeedback(sessionId, rating, comment) {

    try {

        const response = await fetch("/api/feedback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                sessionId,
                rating: Number(rating),
                comment
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to submit feedback");
        }

        alert(data.message);

        await loadCompletedSessions();
        await loadReceivedFeedback();

    } catch (error) {

        alert(error.message);

    }

}

// Load feedback received
async function loadReceivedFeedback() {

    try {

        const response = await fetch("/api/feedback", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load feedback");
        }

        receivedFeedback.innerHTML = "";

        if (data.feedback.length === 0) {
            receivedFeedback.textContent =
                "You haven't received any feedback yet.";
            return;
        }

        data.feedback.forEach(item => {

            const card = document.createElement("div");
            card.className = "profile-card";

            const heading = document.createElement("h3");
            heading.textContent = `From: ${item.from.fullName}`;

            const rating = document.createElement("p");
            rating.textContent = `Rating: ${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}`;

            const comment = document.createElement("p");
            comment.textContent = item.comment || "No written comment.";

            card.appendChild(heading);
            card.appendChild(rating);
            card.appendChild(comment);

            receivedFeedback.appendChild(card);

        });

    } catch (error) {

        receivedFeedback.textContent = error.message;

    }

}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("skillbridgeToken");
    localStorage.removeItem("skillbridgeUser");

    window.location.href = "../index.html";

});

// Load page data
loadCompletedSessions();
loadReceivedFeedback();