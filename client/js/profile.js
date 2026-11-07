
const profileForm = document.getElementById("profileForm");
const message = document.getElementById("message");
const saveBtn = document.getElementById("saveBtn");

// Get authentication token
const token = localStorage.getItem("skillbridgeToken");

// Redirect if student is not logged in
if (!token) {
    window.location.href = "login.html";
}


// Load student profile
async function loadProfile() {

    try {

        const response = await fetch("/api/auth/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load profile");
        }

        const user = data.user;

        // Display profile information
        document.getElementById("displayName").textContent = user.fullName;
        document.getElementById("displayCollege").textContent = user.college;

        document.getElementById("profileAvatar").textContent =
            user.fullName.charAt(0).toUpperCase();

        // Fill form fields
        document.getElementById("fullName").value = user.fullName;
        document.getElementById("email").value = user.email;
        document.getElementById("college").value = user.college;
        document.getElementById("department").value = user.department || "";
        document.getElementById("yearOfStudy").value = user.yearOfStudy || "";
        document.getElementById("bio").value = user.bio || "";

        // Update profile completion
        updateCompletion(user);

    } catch (error) {

        message.textContent = error.message;

        if (error.message.includes("token") ||
            error.message.includes("login")) {

            localStorage.removeItem("skillbridgeToken");
            localStorage.removeItem("skillbridgeUser");

            window.location.href = "login.html";
        }
    }
}


// Update profile completion display
function updateCompletion(user) {

    let completed = 0;

    if (user.fullName) completed++;
    if (user.email) completed++;
    if (user.college) completed++;
    if (user.department) completed++;
    if (user.yearOfStudy) completed++;
    if (user.bio) completed++;

    const percentage = Math.round((completed / 6) * 100);

    document.getElementById("completionText").textContent =
        percentage + "%";

    document.getElementById("progressFill").style.width =
        percentage + "%";
}


// Save updated profile
profileForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const profile = {
        fullName: document.getElementById("fullName").value.trim(),
        college: document.getElementById("college").value.trim(),
        department: document.getElementById("department").value.trim(),
        yearOfStudy: Number(document.getElementById("yearOfStudy").value),
        bio: document.getElementById("bio").value.trim()
    };

    try {

        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
        message.textContent = "";

        const response = await fetch("/api/users/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(profile)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Profile update failed");
        }

        message.textContent = "Profile updated successfully!";

        // Refresh displayed information
        await loadProfile();

    } catch (error) {

        message.textContent = error.message;

    } finally {

        saveBtn.disabled = false;
        saveBtn.textContent = "Save Profile";
    }
});


// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("skillbridgeToken");
    localStorage.removeItem("skillbridgeUser");

    window.location.href = "../index.html";
});


// Load profile when page opens
loadProfile();
