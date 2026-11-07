
const availabilityForm = document.getElementById("availabilityForm");
const availabilityList = document.getElementById("availabilityList");
const availabilityMessage = document.getElementById("availabilityMessage");
const addAvailabilityBtn = document.getElementById("addAvailabilityBtn");

// Get login details
const token = localStorage.getItem("skillbridgeToken");
const currentUser = JSON.parse(
    localStorage.getItem("skillbridgeUser") || "null"
);

// Redirect if student is not logged in
if (!token || !currentUser) {
    window.location.href = "login.html";
}


// Set minimum selectable date to today
const availabilityDate = document.getElementById("availabilityDate");

const today = new Date();

const localDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");

availabilityDate.min = localDate;


// Format date and time
function formatDateTime(date) {

    return new Date(date).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });

}


// Load student's availability
async function loadAvailability() {

    try {

        const response = await fetch("/api/availability", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load availability");
        }

        availabilityList.innerHTML = "";

        if (data.availability.length === 0) {

            availabilityList.textContent =
                "No availability added yet. Add your first time slot!";

            return;
        }

        // Display saved availability slots
        data.availability.forEach(slot => {

            const card = document.createElement("div");

            card.className = "profile-card";

            const date = document.createElement("h3");

            date.textContent = formatDateTime(slot.startAt);

            const time = document.createElement("p");

            time.textContent =
                `Until: ${formatDateTime(slot.endAt)}`;

            const status = document.createElement("p");

            status.textContent = `Status: ${slot.status}`;

            const deleteBtn = document.createElement("button");

            deleteBtn.textContent = "Remove";

            deleteBtn.className = "login-btn";

            deleteBtn.addEventListener("click", () => {
                deleteAvailability(slot._id);
            });

            card.appendChild(date);
            card.appendChild(time);
            card.appendChild(status);

            if (slot.status === "available") {
                card.appendChild(deleteBtn);
            }

            availabilityList.appendChild(card);

        });

    } catch (error) {

        availabilityList.textContent = error.message;

    }

}


// Add a new availability slot
availabilityForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const date = availabilityDate.value;
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;

    // Convert local date and time into UTC
    const startAt = new Date(`${date}T${startTime}`);
    const endAt = new Date(`${date}T${endTime}`);

    // Validate time range
    if (endAt <= startAt) {

        availabilityMessage.textContent =
            "End time must be later than start time.";

        return;
    }

    if (startAt <= new Date()) {

        availabilityMessage.textContent =
            "Please select a future time slot.";

        return;
    }

    try {

        addAvailabilityBtn.disabled = true;

        availabilityMessage.textContent = "Adding availability...";

        const response = await fetch("/api/availability", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                startAt: startAt.toISOString(),
                endAt: endAt.toISOString()
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to add availability");
        }

        availabilityMessage.textContent =
            "Availability added successfully!";

        availabilityForm.reset();

        await loadAvailability();

    } catch (error) {

        availabilityMessage.textContent = error.message;

    } finally {

        addAvailabilityBtn.disabled = false;

    }

});


// Delete an availability slot
async function deleteAvailability(slotId) {

    if (!confirm("Are you sure you want to remove this slot?")) {
        return;
    }

    try {

        const response = await fetch(
            `/api/availability/${slotId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to remove availability");
        }

        availabilityMessage.textContent =
            "Availability removed successfully!";

        await loadAvailability();

    } catch (error) {

        availabilityMessage.textContent = error.message;

    }

}


// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("skillbridgeToken");
    localStorage.removeItem("skillbridgeUser");

    window.location.href = "../index.html";

});


// Load availability when page opens
loadAvailability();
