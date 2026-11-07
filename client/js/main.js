
const authButtons = document.getElementById("authButtons");

// Check login status when homepage loads
async function checkLoginStatus() {

    const token = localStorage.getItem("skillbridgeToken");

    // If no token exists, show normal buttons
    if (!token) {
        return;
    }

    try {

        // Verify token with backend
        const response = await fetch("/api/auth/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error("Session expired");
        }

        // Get student name
        const studentName = data.user.fullName;

        // Update navigation buttons
        authButtons.innerHTML = `
            <span class="welcome-text">
                Welcome, ${studentName}!
            </span>

            <button class="login-btn" id="logoutBtn">
                Logout
            </button>
        `;

        // Logout functionality
        document.getElementById("logoutBtn").addEventListener("click", () => {

            localStorage.removeItem("skillbridgeToken");
            localStorage.removeItem("skillbridgeUser");

            window.location.reload();

        });

    } catch (error) {

        // Clear invalid or expired session
        localStorage.removeItem("skillbridgeToken");
        localStorage.removeItem("skillbridgeUser");

    }
}

// Run function
checkLoginStatus();
