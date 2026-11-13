const authButtons = document.getElementById("authButtons");

// Check login status when homepage loads
async function checkLoginStatus() {
    const token = localStorage.getItem("skillbridgeToken");

    if (!token || !authButtons) return;

    try {
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

        const welcomeText = document.createElement("span");
        welcomeText.className = "home-welcome-text";
        welcomeText.textContent = `Welcome, ${data.user.fullName}!`;

        const logoutButton = document.createElement("button");
        logoutButton.className = "home-logout-btn";
        logoutButton.textContent = "Logout";

        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("skillbridgeToken");
            localStorage.removeItem("skillbridgeUser");
            window.location.reload();
        });

        authButtons.replaceChildren(welcomeText, logoutButton);

    } catch (error) {
        localStorage.removeItem("skillbridgeToken");
        localStorage.removeItem("skillbridgeUser");
    }
}

checkLoginStatus();
