
const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Get form values
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const college = document.getElementById("college").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const message = document.getElementById("message");
    const submitButton = registerForm.querySelector("button[type='submit']");

    // Check password match
    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match!";
        return;
    }

    // Check password length
    if (password.length < 8) {
        message.textContent = "Password must contain at least 8 characters.";
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Creating Account...";
        message.textContent = "";

        // Send registration data to backend
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fullName,
                email,
                password,
                college
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed");
        }

        message.textContent = "Registration successful! Redirecting to login...";

        // Redirect to login page
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

    } catch (error) {
        message.textContent = error.message;

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Create Account";
    }
});
