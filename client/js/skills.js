
const skillForm = document.getElementById("skillForm");
const skillSelect = document.getElementById("skillSelect");
const skillMessage = document.getElementById("skillMessage");
const mySkillsList = document.getElementById("mySkillsList");
const addSkillBtn = document.getElementById("addSkillBtn");

// Get authentication token
const token = localStorage.getItem("skillbridgeToken");

// Redirect if student is not logged in
if (!token) {
    window.location.href = "login.html";
}


// Load all available skills
async function loadAvailableSkills() {

    try {

        const response = await fetch("/api/skills");
        const data = await response.json();

        if (!response.ok) {
            throw new Error("Unable to load available skills");
        }

        skillSelect.innerHTML = '<option value="">Select Skill</option>';

        data.skills.forEach(skill => {

            const option = document.createElement("option");

            option.value = skill._id;
            option.textContent = `${skill.name} (${skill.category})`;

            skillSelect.appendChild(option);

        });

    } catch (error) {

        skillSelect.innerHTML = '<option value="">Unable to load skills</option>';
        skillMessage.textContent = error.message;

    }
}


// Load student's selected skills
async function loadMySkills() {

    try {

        const response = await fetch("/api/user-skills", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load your skills");
        }

        mySkillsList.innerHTML = "";

        if (data.userSkills.length === 0) {

            mySkillsList.textContent = "You haven't added any skills yet.";

            return;
        }

        data.userSkills.forEach(userSkill => {

            const skillCard = document.createElement("div");

            skillCard.className = "user-skill-item";

            const skillInfo = document.createElement("div");

            const skillName = document.createElement("h3");
            skillName.textContent = userSkill.skill.name;

            const skillDetails = document.createElement("p");

            skillDetails.textContent =
                `${userSkill.type.toUpperCase()} • ${userSkill.proficiency}`;

            const removeButton = document.createElement("button");

            removeButton.textContent = "Remove";
            removeButton.className = "remove-skill-btn";

            removeButton.addEventListener("click", () => {
                removeSkill(userSkill._id);
            });

            skillInfo.appendChild(skillName);
            skillInfo.appendChild(skillDetails);

            skillCard.appendChild(skillInfo);
            skillCard.appendChild(removeButton);

            mySkillsList.appendChild(skillCard);

        });

    } catch (error) {

        mySkillsList.textContent = error.message;

    }
}


// Add a new skill
skillForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const skillData = {
        skillId: skillSelect.value,
        type: document.getElementById("skillType").value,
        proficiency: document.getElementById("proficiency").value
    };

    try {

        addSkillBtn.disabled = true;
        addSkillBtn.textContent = "Adding...";
        skillMessage.textContent = "";

        const response = await fetch("/api/user-skills", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(skillData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to add skill");
        }

        skillMessage.textContent = "Skill added successfully!";

        skillForm.reset();

        await loadMySkills();

    } catch (error) {

        skillMessage.textContent = error.message;

    } finally {

        addSkillBtn.disabled = false;
        addSkillBtn.textContent = "Add Skill";

    }

});


// Remove a selected skill
async function removeSkill(skillId) {

    if (!confirm("Are you sure you want to remove this skill?")) {
        return;
    }

    try {

        const response = await fetch(`/api/user-skills/${skillId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to remove skill");
        }

        skillMessage.textContent = "Skill removed successfully!";

        await loadMySkills();

    } catch (error) {

        skillMessage.textContent = error.message;

    }

}


// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("skillbridgeToken");
    localStorage.removeItem("skillbridgeUser");

    window.location.href = "../index.html";

});


// Load data when page opens
loadAvailableSkills();
loadMySkills();
