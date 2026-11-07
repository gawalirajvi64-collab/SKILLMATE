
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Get login details
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const message = document.getElementById("message");
    const submitButton = loginForm.querySelector("button[type='submit']");

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";
        message.textContent = "";

        // Send login request to backend
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        // Save login token and student details
        localStorage.setItem("skillbridgeToken", data.token);
        localStorage.setItem("skillbridgeUser", JSON.stringify(data.user));

        message.textContent = "Login successful! Redirecting...";

        // Redirect after login
        setTimeout(() => {
            window.location.href = "../index.html";
        }, 1200);

    } catch (error) {
        message.textContent = error.message;

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Login";
    }
});

