
const token = localStorage.getItem("skillbridgeToken");

const currentUser = JSON.parse(
    localStorage.getItem("skillbridgeUser") || "null"
);

const feedbackForm = document.getElementById("feedbackForm");
const receivedFeedback = document.getElementById("receivedFeedback");

if (!token || !currentUser) {
    window.location.href = "login.html";
}

let completedSessions = [];
let receivedFeedbackList = [];

let sessionIndex = 0;
let feedbackIndex = 0;

let selectedRating = 0;
let isSubmitting = false;

// Format date
function formatDateTime(date) {
    return new Date(date).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// Create carousel navigation
function createNavigation(index, total, onPrevious, onNext) {
    const navigation = document.createElement("div");
    navigation.className = "feedback-carousel-nav";

    const previousButton = document.createElement("button");
    previousButton.type = "button";
    previousButton.className = "feedback-nav-btn";
    previousButton.textContent = "←";
    previousButton.setAttribute("aria-label", "Previous");
    previousButton.disabled = index === 0;
    previousButton.addEventListener("click", onPrevious);

    const counter = document.createElement("span");
    counter.className = "feedback-counter";
    counter.textContent = `${index + 1} of ${total}`;

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "feedback-nav-btn";
    nextButton.textContent = "→";
    nextButton.setAttribute("aria-label", "Next");
    nextButton.disabled = index === total - 1;
    nextButton.addEventListener("click", onNext);

    navigation.append(
        previousButton,
        counter,
        nextButton
    );

    return navigation;
}

// Load completed sessions
async function loadCompletedSessions() {
    try {
        const response = await fetch("/api/sessions", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load sessions");
        }

        completedSessions = data.sessions.filter(
            session => session.status === "completed"
        );

        sessionIndex = 0;
        renderSession();

    } catch (error) {
        feedbackForm.textContent = error.message;
    }
}

// Render one session at a time
function renderSession() {
    feedbackForm.innerHTML = "";

    if (completedSessions.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "feedback-empty";
        emptyMessage.textContent =
            "No completed sessions available for feedback right now.";

        feedbackForm.appendChild(emptyMessage);
        return;
    }

    const session = completedSessions[sessionIndex];

    const otherStudent =
        session.requester._id === currentUser.id
            ? session.receiver
            : session.requester;

    selectedRating = 0;

    const card = document.createElement("div");
    card.className = "profile-card feedback-carousel-card";

    const heading = document.createElement("h3");
    heading.textContent = `Feedback for ${otherStudent.fullName}`;

    const date = document.createElement("p");
    date.className = "feedback-session-date";
    date.textContent = `Session: ${formatDateTime(session.startAt)}`;

    const ratingLabel = document.createElement("label");
    ratingLabel.textContent = "How was your experience?";

    const starContainer = document.createElement("div");
    starContainer.className = "feedback-stars";
    starContainer.setAttribute("role", "group");
    starContainer.setAttribute("aria-label", "Choose a rating");

    const starButtons = [];

    function updateStars(rating) {
        starButtons.forEach((button, index) => {
            const active = index < rating;

            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        });
    }

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("button");

        star.type = "button";
        star.className = "feedback-star";
        star.textContent = "★";
        star.setAttribute("aria-label", `${i} star${i > 1 ? "s" : ""}`);
        star.setAttribute("aria-pressed", "false");

        star.addEventListener("click", () => {
            selectedRating = i;
            updateStars(selectedRating);
        });

        starButtons.push(star);
        starContainer.appendChild(star);
    }

    const ratingHint = document.createElement("p");
    ratingHint.className = "feedback-rating-hint";
    ratingHint.textContent = "Select 1 to 5 stars";

    const comment = document.createElement("textarea");
    comment.className = "feedback-comment";
    comment.placeholder = "Write your feedback...";
    comment.maxLength = 500;
    comment.rows = 4;

    const characterCount = document.createElement("p");
    characterCount.className = "feedback-character-count";
    characterCount.textContent = "0 / 500";

    comment.addEventListener("input", () => {
        characterCount.textContent = `${comment.value.length} / 500`;
    });

    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.className = "register-btn";
    submitButton.textContent = "Submit Feedback";

    submitButton.addEventListener("click", () => {
        submitFeedback(
            session._id,
            selectedRating,
            comment.value,
            submitButton
        );
    });

    card.append(
        heading,
        date,
        ratingLabel,
        starContainer,
        ratingHint,
        comment,
        characterCount,
        submitButton
    );

    feedbackForm.appendChild(card);

    const navigation = createNavigation(
        sessionIndex,
        completedSessions.length,
        () => {
            sessionIndex--;
            renderSession();
        },
        () => {
            sessionIndex++;
            renderSession();
        }
    );

    feedbackForm.appendChild(navigation);
}

// Submit feedback
async function submitFeedback(sessionId, rating, comment, button) {
    if (isSubmitting) return;

    if (!rating) {
        alert("Please select a star rating before submitting.");
        return;
    }

    try {
        isSubmitting = true;
        button.disabled = true;
        button.textContent = "Submitting...";

        const response = await fetch("/api/feedback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
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

        alert(data.message || "Feedback submitted successfully!");

        // Remove the submitted session from this list
        completedSessions = completedSessions.filter(
            session => session._id !== sessionId
        );

        if (sessionIndex >= completedSessions.length) {
            sessionIndex = Math.max(0, completedSessions.length - 1);
        }

        renderSession();
        await loadReceivedFeedback();

    } catch (error) {
        alert(error.message);
        button.disabled = false;
        button.textContent = "Submit Feedback";

    } finally {
        isSubmitting = false;
    }
}

// Load feedback received
async function loadReceivedFeedback() {
    try {
        const response = await fetch("/api/feedback", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load feedback");
        }

        receivedFeedbackList = data.feedback || [];
        feedbackIndex = 0;

        renderReceivedFeedback();

    } catch (error) {
        receivedFeedback.textContent = error.message;
    }
}

// Render one received feedback card at a time
function renderReceivedFeedback() {
    receivedFeedback.innerHTML = "";

    if (receivedFeedbackList.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "feedback-empty";
        emptyMessage.textContent =
            "You haven't received any feedback yet.";

        receivedFeedback.appendChild(emptyMessage);
        return;
    }

    const item = receivedFeedbackList[feedbackIndex];

    const card = document.createElement("div");
    card.className = "profile-card feedback-carousel-card received-feedback-card";

    const heading = document.createElement("h3");
    heading.textContent = `From: ${item.from.fullName}`;

    const rating = document.createElement("div");
    rating.className = "feedback-received-stars";
    rating.textContent =
        "★".repeat(item.rating) + "☆".repeat(5 - item.rating);

    const ratingText = document.createElement("p");
    ratingText.className = "feedback-rating-text";
    ratingText.textContent = `${item.rating} out of 5 stars`;

    const comment = document.createElement("p");
    comment.className = "feedback-received-comment";
    comment.textContent = item.comment || "No written comment.";

    card.append(
        heading,
        rating,
        ratingText,
        comment
    );

    receivedFeedback.appendChild(card);

    const navigation = createNavigation(
        feedbackIndex,
        receivedFeedbackList.length,
        () => {
            feedbackIndex--;
            renderReceivedFeedback();
        },
        () => {
            feedbackIndex++;
            renderReceivedFeedback();
        }
    );

    receivedFeedback.appendChild(navigation);
}

// Logout
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("skillbridgeToken");
        localStorage.removeItem("skillbridgeUser");
        window.location.href = "../index.html";
    });
}

// Load page data
loadCompletedSessions();
loadReceivedFeedback();
