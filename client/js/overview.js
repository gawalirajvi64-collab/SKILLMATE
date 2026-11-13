const token = localStorage.getItem("skillbridgeToken");
const currentUser = JSON.parse(localStorage.getItem("skillbridgeUser") || "null");

if (!token || !currentUser) {
    window.location.href = "login.html";
}

const welcomeName = document.getElementById("welcomeName");
const completedSessionsEl = document.getElementById("overviewCompletedSessions");
const learningHoursEl = document.getElementById("overviewLearningHours");
const learningSkillsEl = document.getElementById("overviewLearningSkills");
const teachingSkillsEl = document.getElementById("overviewTeachingSkills");

const recentActivityEl = document.getElementById("overviewRecentActivity");
const chartCanvas = document.getElementById("learningActivityChart");
const chartCount = document.getElementById("chartSessionCount");
const chartMessage = document.getElementById("chartMessage");
const filterButtons = document.querySelectorAll(".overview-chart-filters button");

let completedDates = [];
let currentPeriod = "weekly";

if (welcomeName && currentUser.fullName) {
    welcomeName.textContent = currentUser.fullName.split(" ")[0];
}

// Convert date into local calendar date
function getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Format date for activity list
function formatDate(date) {
    return new Date(date).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// Prepare chart data
function getChartData() {
    const now = new Date();
    const buckets = [];

    if (currentPeriod === "weekly") {
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);

            buckets.push({
                key: getLocalDateKey(date),
                label: date.toLocaleDateString([], { weekday: "short" }),
                count: 0
            });
        }
    } else {
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

            buckets.push({
                key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
                label: date.toLocaleDateString([], { month: "short" }),
                count: 0
            });
        }
    }

    completedDates.forEach(value => {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return;

        const key = currentPeriod === "weekly"
            ? getLocalDateKey(date)
            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        const bucket = buckets.find(item => item.key === key);

        if (bucket) bucket.count++;
    });

    return buckets;
}

// Draw activity graph using Canvas
function drawChart() {
    if (!chartCanvas) return;

    const context = chartCanvas.getContext("2d");
    const rect = chartCanvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const pixelRatio = window.devicePixelRatio || 1;

    chartCanvas.width = rect.width * pixelRatio;
    chartCanvas.height = rect.height * pixelRatio;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const width = rect.width;
    const height = rect.height;

    const padding = {
        top: 20,
        right: 20,
        bottom: 35,
        left: 35
    };

    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const data = getChartData();
    const maxValue = Math.max(3, ...data.map(item => item.count));
    const step = Math.ceil(maxValue / 3);
    const maxY = step * 3;

    context.clearRect(0, 0, width, height);

    // Horizontal grid lines and labels
    context.font = "11px Arial";
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillStyle = "#858197";
    context.strokeStyle = "#ECEAF3";
    context.lineWidth = 1;

    for (let i = 0; i <= 3; i++) {
        const value = maxY - i * step;
        const y = padding.top + (graphHeight / 3) * i;

        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(width - padding.right, y);
        context.stroke();

        context.fillText(value, padding.left - 9, y);
    }

    // Calculate points
    const points = data.map((item, index) => ({
        x: padding.left + (
            data.length === 1
                ? graphWidth / 2
                : (graphWidth / (data.length - 1)) * index
        ),
        y: padding.top + graphHeight - (
            item.count / maxY
        ) * graphHeight,
        label: item.label
    }));

    // Filled area
    if (points.length > 1) {
        context.beginPath();
        context.moveTo(points[0].x, padding.top + graphHeight);

        points.forEach(point => {
            context.lineTo(point.x, point.y);
        });

        context.lineTo(points[points.length - 1].x, padding.top + graphHeight);
        context.closePath();
        context.fillStyle = "rgba(96, 61, 235, 0.09)";
        context.fill();
    }

    // Activity line
    if (points.length > 1) {
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);

        points.slice(1).forEach(point => {
            context.lineTo(point.x, point.y);
        });

        context.strokeStyle = "#603DEB";
        context.lineWidth = 3;
        context.lineJoin = "round";
        context.lineCap = "round";
        context.stroke();
    }

    // Data points and labels
    points.forEach((point, index) => {
        context.beginPath();
        context.arc(point.x, point.y, 4, 0, Math.PI * 2);
        context.fillStyle = "#603DEB";
        context.fill();

        context.beginPath();
        context.arc(point.x, point.y, 2, 0, Math.PI * 2);
        context.fillStyle = "#FFFFFF";
        context.fill();

        context.fillStyle = "#858197";
        context.font = "11px Arial";
        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillText(point.label, point.x, height - padding.bottom + 12);
    });

    const total = data.reduce((sum, item) => sum + item.count, 0);

    if (chartCount) {
        chartCount.textContent = total;
    }

    if (chartMessage) {
        chartMessage.textContent = total === 0
            ? "No completed sessions in this period yet. Your activity will appear here as you complete sessions."
            : "Your completed learning sessions during this period.";
    }
}

// Load recent activity
function renderRecentActivity(activities) {
    if (!recentActivityEl) return;

    recentActivityEl.innerHTML = "";

    if (!activities || activities.length === 0) {
        const empty = document.createElement("div");
        empty.className = "overview-empty-state";
        empty.textContent = "No completed sessions yet. Your recent learning activity will appear here.";
        recentActivityEl.appendChild(empty);
        return;
    }

    activities.forEach(session => {
        const otherStudent =
            session.requester?._id === currentUser.id
                ? session.receiver
                : session.requester;

        const item = document.createElement("div");
        item.className = "overview-activity-item";

        const icon = document.createElement("div");
        icon.className = "overview-activity-icon";
        icon.textContent = "✓";

        const details = document.createElement("div");
        details.className = "overview-activity-details";

        const heading = document.createElement("h3");
        heading.textContent = `Learning session with ${otherStudent?.fullName || "SkillMate partner"}`;

        const date = document.createElement("p");
        date.textContent = `Completed · ${formatDate(session.completedAt || session.updatedAt)}`;

        details.appendChild(heading);
        details.appendChild(date);

        item.appendChild(icon);
        item.appendChild(details);

        recentActivityEl.appendChild(item);
    });
}

// Load actual progress from backend
async function loadOverview() {
    try {
        const response = await fetch("/api/progress", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load dashboard data.");
        }

        const progress = data.progress;

        completedSessionsEl.textContent = progress.completedSessions;
        learningHoursEl.textContent = progress.totalLearningHours;
        learningSkillsEl.textContent = progress.learningSkills;
        teachingSkillsEl.textContent = progress.teachingSkills;

        completedDates = data.completedSessionDates || [];

        renderRecentActivity(data.recentActivity);
        drawChart();

    } catch (error) {
        console.error("Overview Error:", error);

        if (chartMessage) {
            chartMessage.textContent = "Unable to load learning activity. Please refresh the page.";
        }

        if (recentActivityEl) {
            recentActivityEl.textContent = error.message;
        }
    }
}

// Weekly / Monthly filters
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentPeriod = button.dataset.period;

        filterButtons.forEach(item => {
            item.classList.toggle("active", item === button);
        });

        drawChart();
    });
});

// Redraw chart when browser size changes
window.addEventListener("resize", drawChart);

loadOverview();
