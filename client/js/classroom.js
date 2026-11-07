
const classroomStatus = document.getElementById("classroomStatus");
const sessionDetails = document.getElementById("sessionDetails");
const jitsiContainer = document.getElementById("jitsiContainer");

const token = localStorage.getItem("skillbridgeToken");

const currentUser = JSON.parse(
    localStorage.getItem("skillbridgeUser") || "null"
);

const sessionId = new URLSearchParams(
    window.location.search
).get("sessionId");

// Check login
if (!token || !currentUser) {
    window.location.href = "login.html";
}

// Check session ID
if (!sessionId) {
    classroomStatus.textContent = "Session not found";
    sessionDetails.textContent = "Please open the classroom from My Sessions.";
}

// Format date and time
function formatDateTime(date) {
    return new Date(date).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// Load Jitsi and join classroom
async function joinClassroom() {

    try {

        classroomStatus.textContent = "Connecting to classroom...";
        sessionDetails.textContent = "Verifying your session...";

        // Get authorized classroom details
        const response = await fetch(
            `/api/classrooms/${sessionId}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to access classroom");
        }

        sessionDetails.textContent =
            `Session: ${formatDateTime(data.startAt)} - ${formatDateTime(data.endAt)}`;

        // Load Jitsi external API
        const script = document.createElement("script");

        script.src = "https://meet.jit.si/external_api.js";

        script.onload = () => {

            const domain = "meet.jit.si";

            const options = {

                roomName: data.meetingRoomId,

                width: "100%",

                height: 600,

                parentNode: jitsiContainer,

                userInfo: {
                    displayName: currentUser.fullName
                },

                configOverwrite: {
                    prejoinPageEnabled: true
                },

                interfaceConfigOverwrite: {
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_BRAND_WATERMARK: false
                }

            };

            const api = new JitsiMeetExternalAPI(
                domain,
                options
            );

            classroomStatus.textContent =
                "Your classroom is ready!";

            // Handle leaving the meeting
            api.addEventListener("readyToClose", () => {

                classroomStatus.textContent =
                    "You have left the classroom.";

                sessionDetails.textContent =
                    "You can return to My Sessions.";

                jitsiContainer.innerHTML = "";

            });

        };

        script.onerror = () => {

            classroomStatus.textContent =
                "Unable to load video classroom.";

            sessionDetails.textContent =
                "Please check your internet connection and try again.";

        };

        document.body.appendChild(script);

    } catch (error) {

        classroomStatus.textContent =
            "Unable to join classroom";

        sessionDetails.textContent = error.message;

    }

}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("skillbridgeToken");
    localStorage.removeItem("skillbridgeUser");

    window.location.href = "../index.html";

});

// Start classroom
if (token && currentUser && sessionId) {
    joinClassroom();
}
