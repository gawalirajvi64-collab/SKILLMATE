
const matchesList = document.getElementById("matchesList");
const matchCount = document.getElementById("matchCount");

// Get authentication token
const token = localStorage.getItem("skillbridgeToken");

// Redirect if student is not logged in
if (!token) {
    window.location.href = "login.html";
}


// Load matches and connections
async function loadMatches() {

    try {

        // Fetch matches and existing connections
        const [matchResponse, connectionResponse] = await Promise.all([

            fetch("/api/matches", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }),

            fetch("/api/connections", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })

        ]);

        const matchData = await matchResponse.json();
        const connectionData = await connectionResponse.json();

        if (!matchResponse.ok) {
            throw new Error(matchData.message || "Unable to load matches");
        }

        if (!connectionResponse.ok) {
            throw new Error(connectionData.message || "Unable to load connections");
        }

        // Update match count
        matchCount.textContent = matchData.count;

        // Clear previous content
        matchesList.innerHTML = "";

        // Check whether matches exist
        if (matchData.matches.length === 0) {

            matchesList.textContent =
                "No matches found yet. Add more teaching and learning skills to discover students.";

            return;
        }


        // Display each recommended student
        matchData.matches.forEach(match => {

            const card = document.createElement("div");

            card.className = "match-card";


            // Student information
            const studentInfo = document.createElement("div");

            studentInfo.className = "match-student-info";

            const avatar = document.createElement("div");

            avatar.className = "match-avatar";

            avatar.textContent =
                match.student.fullName.charAt(0).toUpperCase();


            const studentDetails = document.createElement("div");

            const studentName = document.createElement("h3");

            studentName.textContent = match.student.fullName;

            const college = document.createElement("p");

            college.textContent = match.student.college;

            studentDetails.appendChild(studentName);

            studentDetails.appendChild(college);

            studentInfo.appendChild(avatar);

            studentInfo.appendChild(studentDetails);


            // Compatibility score
            const score = document.createElement("div");

            score.className = "match-score";

            score.textContent =
                match.compatibilityScore + "% Match";


            // Matched skills section
            const skillsSection = document.createElement("div");

            skillsSection.className = "matched-skills";

            const skillsHeading = document.createElement("h4");

            skillsHeading.textContent = "Skill Exchange";

            skillsSection.appendChild(skillsHeading);


            match.matchedSkills.forEach(skill => {

                const skillItem = document.createElement("div");

                skillItem.className = "matched-skill-item";

                const skillName = document.createElement("strong");

                skillName.textContent = skill.skillName;

                const role = document.createElement("span");

                role.textContent = skill.role;

                skillItem.appendChild(skillName);

                skillItem.appendChild(role);

                skillsSection.appendChild(skillItem);

            });


            // Find existing connection with this student
            const existingConnection = connectionData.connections.find(connection => {

                const requesterId = connection.requester._id;

                const receiverId = connection.receiver._id;

                const studentId = match.student._id;

                return requesterId === studentId ||
                       receiverId === studentId;

            });


            // Connect button
            const connectButton = document.createElement("button");

            connectButton.className = "connect-btn";


            if (existingConnection) {

                // Show existing connection status
                if (existingConnection.status === "accepted") {

                    connectButton.textContent = "Connected";

                } else if (existingConnection.status === "pending") {

                    const currentUser = JSON.parse(
                        localStorage.getItem("skillbridgeUser")
                    );

                    if (existingConnection.requester._id === currentUser.id) {

                        connectButton.textContent = "Request Sent";

                    } else {

                        connectButton.textContent = "Request Received";

                    }

                } else {

                    connectButton.textContent = "Request Rejected";

                }

                connectButton.disabled = true;

            } else {

                connectButton.textContent = "Connect";

                connectButton.addEventListener("click", () => {

                    sendConnectionRequest(
                        match.student._id,
                        connectButton
                    );

                });

            }


            // Build match card
            card.appendChild(studentInfo);

            card.appendChild(score);

            card.appendChild(skillsSection);

            card.appendChild(connectButton);

            matchesList.appendChild(card);

        });

    } catch (error) {

        matchesList.textContent = error.message;

    }

}


// Send a connection request
async function sendConnectionRequest(studentId, button) {

    try {

        button.disabled = true;

        button.textContent = "Sending...";

        const response = await fetch("/api/connections", {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                receiverId: studentId
            })

        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to send request");
        }

        alert(data.message);

        // Reload matches to update connection status
        await loadMatches();

    } catch (error) {

        alert(error.message);

        button.disabled = false;

        button.textContent = "Connect";

    }

}


// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("skillbridgeToken");

    localStorage.removeItem("skillbridgeUser");

    window.location.href = "../index.html";

});


// Load matches when page opens
loadMatches();
