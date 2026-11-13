
(() => {
    const token = localStorage.getItem("skillbridgeToken");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const app = document.getElementById("dashboardApp");
    if (!app) return;

    const currentPage = window.location.pathname.split("/").pop();

    const navigation = [
        { label: "Overview", href: "dashboard.html", icon: "◫" },
        { label: "My Skills", href: "skills.html", icon: "✳" },
        { label: "Discover Students", href: "matches.html", icon: "⌕" },
        { label: "Connections", href: "connections.html", icon: "♧" },
        { label: "Messages", href: "chat.html", icon: "▤" },
        { label: "Notifications", href: "notifications.html", icon: "♧" },
        { label: "Availability", href: "availability.html", icon: "◷" },
        { label: "My Sessions", href: "sessions.html", icon: "▣" },
        { label: "Skill Assessment", href: "assessment.html", icon: "✓" },
        { label: "My Progress", href: "progress.html", icon: "↗" },
        { label: "Feedback", href: "feedback.html", icon: "☆" }
    ];

    // Create sidebar
    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";
    sidebar.id = "sidebar";

    sidebar.innerHTML = `
        <a class="brand" href="dashboard.html">
            <span class="brand-symbol">S</span>
            <span>SkillMate</span>
        </a>

        <div class="sidebar-label">WORKSPACE</div>

        <nav class="sidebar-nav">
            ${navigation.map(item => `
                <a href="${item.href}"
                   class="sidebar-link ${currentPage === item.href ? "active" : ""}">
                    <span class="sidebar-icon">${item.icon}</span>
                    <span>${item.label}</span>
                </a>
            `).join("")}
        </nav>
    `;

    app.insertBefore(sidebar, app.firstChild);

    // Create a topbar for pages that do not already have one
    let topbar = app.querySelector(".dashboard-topbar");

    if (!topbar) {
        topbar = document.createElement("header");
        topbar.className = "dashboard-topbar";

        topbar.innerHTML = `
            <div class="topbar-left">
                <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
                    ☰
                </button>
                <div class="topbar-title">
                    <span>MY ACCOUNT</span>
                    <h2>My Profile</h2>
                </div>
            </div>

            <div class="topbar-actions">
                <a href="notifications.html"
                   class="topbar-notification"
                   aria-label="Notifications">♧</a>
            </div>
        `;

        const main = app.querySelector(".dashboard-main");

        if (main) {
            main.insertBefore(topbar, main.firstChild);
        }
    }

    // Add profile dropdown to the topbar
    let topbarActions = topbar.querySelector(".topbar-actions");

    if (!topbarActions) {
        topbarActions = document.createElement("div");
        topbarActions.className = "topbar-actions";
        topbar.appendChild(topbarActions);
    }

    const profileMenu = document.createElement("div");
    profileMenu.className = "topbar-profile";

    profileMenu.innerHTML = `
        <button
            type="button"
            class="profile-menu-toggle"
            id="profileMenuToggle"
            aria-label="Open profile menu"
            aria-expanded="false"
            aria-controls="profileDropdown"
        >
            <span class="topbar-avatar" id="topbarAvatar">S</span>
            <span class="profile-menu-arrow">⌄</span>
        </button>

        <div class="profile-dropdown" id="profileDropdown" hidden>
            <a href="profile.html">My Profile</a>
            <a href="progress.html">My Progress</a>
            <div class="profile-dropdown-divider"></div>
            <button type="button" id="logoutBtn">Log out</button>
        </div>
    `;

    topbarActions.appendChild(profileMenu);

    // Profile dropdown interactions
    const profileMenuToggle = document.getElementById("profileMenuToggle");
    const profileDropdown = document.getElementById("profileDropdown");

    profileMenuToggle.addEventListener("click", event => {
        event.stopPropagation();

        const isOpen = !profileDropdown.hidden;
        profileDropdown.hidden = isOpen;
        profileMenuToggle.setAttribute("aria-expanded", String(!isOpen));
    });

    document.addEventListener("click", event => {
        if (!profileMenu.contains(event.target)) {
            profileDropdown.hidden = true;
            profileMenuToggle.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            profileDropdown.hidden = true;
            profileMenuToggle.setAttribute("aria-expanded", "false");
        }
    });

    // Logout is handled here on all pages except Profile,
    // where profile.js already has its own logout handler.
    if (currentPage !== "profile.html") {
        document.getElementById("logoutBtn").addEventListener("click", () => {
            localStorage.removeItem("skillbridgeToken");
            localStorage.removeItem("skillbridgeUser");
            window.location.href = "../index.html";
        });
    }

    // Mobile sidebar toggle
    const menuToggle = document.getElementById("menuToggle");

    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("sidebar-open");
        });

        document.addEventListener("click", event => {
            if (
                window.innerWidth <= 900 &&
                !sidebar.contains(event.target) &&
                !menuToggle.contains(event.target)
            ) {
                sidebar.classList.remove("sidebar-open");
            }
        });
    }

    // Load user details for the top-right avatar
    fetch("/api/auth/profile", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(async response => {
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load profile");
            }

            return data.user;
        })
        .then(user => {
            const name = user.fullName || "Student";
            const initial = name.charAt(0).toUpperCase();

            document.getElementById("topbarAvatar").textContent = initial;
        })
        .catch(() => {
            localStorage.removeItem("skillbridgeToken");
            localStorage.removeItem("skillbridgeUser");
            window.location.href = "login.html";
        });
})();
