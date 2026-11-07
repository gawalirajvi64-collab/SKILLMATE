const token = localStorage.getItem("skillbridgeToken");

const unreadCount = document.getElementById("unreadCount");
const notificationList = document.getElementById("notificationList");

if (!token) {
    window.location.href = "login.html";
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// Load notifications
async function loadNotifications() {

    try {

        const response = await fetch("/api/notifications", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load notifications");
        }

        unreadCount.textContent = data.unreadCount;

        notificationList.innerHTML = "";

        if (data.notifications.length === 0) {

            notificationList.textContent =
                "You're all caught up! No notifications yet.";

            return;

        }

        data.notifications.forEach(notification => {

            const card = document.createElement("div");
            card.className = "profile-card";

            const heading = document.createElement("h3");
            heading.textContent = notification.type
                .replaceAll("_", " ")
                .toUpperCase();

            const message = document.createElement("p");
            message.textContent = notification.message;

            const date = document.createElement("p");
            date.textContent = formatDate(notification.createdAt);

            const status = document.createElement("p");
            status.textContent = notification.isRead
                ? "Read"
                : "Unread";

            card.appendChild(heading);
            card.appendChild(message);
            card.appendChild(date);
            card.appendChild(status);

            if (!notification.isRead) {

                const readBtn = document.createElement("button");
                readBtn.textContent = "Mark as Read";
                readBtn.className = "register-btn";

                readBtn.addEventListener("click", () => {
                    markAsRead(notification._id);
                });

                card.appendChild(readBtn);

            }

            notificationList.appendChild(card);

        });

    } catch (error) {

        notificationList.textContent = error.message;

    }

}

// Mark notification as read
async function markAsRead(id) {

    try {

        const response = await fetch(
            `/api/notifications/${id}/read`,
            {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to update notification");
        }

        await loadNotifications();

    } catch (error) {

        alert(error.message);

    }

}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("skillbridgeToken");
    localStorage.removeItem("skillbridgeUser");

    window.location.href = "../index.html";

});

// Load notifications
loadNotifications();