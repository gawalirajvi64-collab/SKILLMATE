const token = localStorage.getItem("skillbridgeToken");
const currentUser = JSON.parse(
    localStorage.getItem("skillbridgeUser") || "null"
);

if (!token || !currentUser) {
    window.location.href = "login.html";
}

const skillSelect = document.getElementById("skillSelect");
const eligibilityInfo = document.getElementById("eligibilityInfo");
const startInitialBtn = document.getElementById("startInitialBtn");
const startReassessmentBtn = document.getElementById("startReassessmentBtn");
const assessmentArea = document.getElementById("assessmentArea");
const assessmentContent = document.getElementById("assessmentContent");
const resultArea = document.getElementById("resultArea");
const resultContent = document.getElementById("resultContent");
const historyContent = document.getElementById("historyContent");
const historyPagination = document.getElementById("historyPagination");

let learningSkills = [];
let assessmentHistory = [];
let currentAssessment = null;
let currentQuestionIndex = 0;
let answers = {};
let historyPage = 1;
let historyPages = 1;

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.message || "Something went wrong.");
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

function getSkillId(skill) {
    if (!skill) return "";
    return typeof skill === "object"
        ? String(skill._id || skill.id || "")
        : String(skill);
}

function getSkillName(skill) {
    if (!skill) return "Unknown Skill";
    return typeof skill === "object"
        ? skill.name || "Unknown Skill"
        : "Unknown Skill";
}

function getAttemptId(attempt) {
    return attempt._id || attempt.id;
}

function getAttemptSkillId(attempt) {
    return getSkillId(attempt.skill);
}

function formatDate(date) {
    if (!date) return "Not available";

    return new Date(date).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.className = isError ? "empty-state error-message" : "empty-state";
}

async function loadLearningSkills() {
    try {
        const data = await apiRequest("/api/user-skills");

        const userSkills =
            data.userSkills ||
            data.skills ||
            data.data ||
            [];

        learningSkills = userSkills.filter(item =>
            item.type === "learn"
        );

        skillSelect.innerHTML = "";

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Choose a skill";
        skillSelect.appendChild(placeholder);

        learningSkills.forEach(item => {
            const skill = item.skill || item.skillId;
            const skillId = getSkillId(skill);

            if (!skillId) return;

            const option = document.createElement("option");
            option.value = skillId;
            option.textContent =
                getSkillName(skill) !== "Unknown Skill"
                    ? getSkillName(skill)
                    : item.skillName || "Selected Skill";

            skillSelect.appendChild(option);
        });

        if (learningSkills.length === 0) {
            skillSelect.innerHTML =
                '<option value="">Add a learning skill first</option>';

            showMessage(
                eligibilityInfo,
                "You have not added any learning skills yet. Add a skill under My Skills to begin."
            );
            return;
        }

        await loadHistory(1);

    } catch (error) {
        showMessage(eligibilityInfo, error.message, true);
        skillSelect.innerHTML =
            '<option value="">Unable to load skills</option>';
    }
}

async function loadEligibility() {
    const skillId = skillSelect.value;

    startInitialBtn.hidden = true;
    startReassessmentBtn.hidden = true;
    startInitialBtn.disabled = true;

    if (!skillId) {
        eligibilityInfo.textContent =
            "Select a skill to view your assessment options.";
        return;
    }

    const historyData = await apiRequest(
    `/api/assessments/history?page=1&limit=50&skillId=${skillId}`
);

const skillHistory = historyData.history || [];

    const initialCompleted = skillHistory.some(attempt =>
        attempt.assessmentType === "initial" &&
        attempt.status === "completed"
    );

    const inProgress = skillHistory.find(attempt =>
        attempt.status === "in-progress"
    );

    if (inProgress) {
        eligibilityInfo.textContent =
            "You have an unfinished assessment for this skill. You can resume it from your assessment history.";
    } else if (!initialCompleted) {
        eligibilityInfo.textContent =
            "Your initial assessment is ready. Complete it to measure your current proficiency.";

        startInitialBtn.hidden = false;
        startInitialBtn.disabled = false;
        return;
    }

    if (initialCompleted) {
        try {
            const data = await apiRequest(
                `/api/assessments/eligibility/${skillId}`
            );

            const eligibility = data.eligibility || data;

            if (eligibility.eligible) {
                eligibilityInfo.textContent =
                    `You are eligible for reassessment. You have ${eligibility.completedSessions} completed learning sessions and ${eligibility.distinctTopics} confirmed topics.`;

                startReassessmentBtn.hidden = false;
            } else {
                eligibilityInfo.textContent =
                    `Reassessment progress: ${eligibility.completedSessions}/${eligibility.requiredSessions} completed sessions and ${eligibility.distinctTopics}/${eligibility.requiredTopics} confirmed topics.`;
            }

        } catch (error) {
            showMessage(eligibilityInfo, error.message, true);
        }
    }
}

function renderAssessment(assessment) {
    if (!assessment || !Array.isArray(assessment.questions)) {
        showMessage(
            assessmentContent,
            "Assessment questions could not be loaded.",
            true
        );
        return;
    }

    currentAssessment = assessment;
    currentQuestionIndex = 0;
    answers = {};

    assessment.questions.forEach(question => {
        if (question.studentAnswer) {
            answers[String(question.questionId)] = question.studentAnswer;
        }
    });

    resultArea.hidden = true;
    assessmentArea.hidden = false;

    renderQuestion();
    assessmentArea.scrollIntoView({ behavior: "smooth" });
}

function renderQuestion() {
    const questions = currentAssessment.questions;
    const question = questions[currentQuestionIndex];

    const questionId = String(question.questionId);
    const selectedAnswer = answers[questionId] || "";

    const progress =
        ((currentQuestionIndex + 1) / questions.length) * 100;

    assessmentContent.innerHTML = "";

    const topLine = document.createElement("div");
    topLine.className = "assessment-topline";

    const title = document.createElement("div");

    const heading = document.createElement("h2");
    heading.textContent =
        `${currentAssessment.skill?.name || "Skill"} Assessment`;

    const type = document.createElement("p");
    type.textContent =
        currentAssessment.assessmentType === "initial"
            ? "Initial Assessment"
            : "Reassessment";

    title.appendChild(heading);
    title.appendChild(type);

    const marks = document.createElement("p");
    marks.textContent =
        `${currentAssessment.totalMarks} total marks`;

    topLine.appendChild(title);
    topLine.appendChild(marks);

    const track = document.createElement("div");
    track.className = "assessment-progress-track";

    const fill = document.createElement("div");
    fill.className = "assessment-progress-fill";
    fill.style.width = `${progress}%`;

    track.appendChild(fill);

    const card = document.createElement("div");
    card.className = "question-card";

    const meta = document.createElement("div");
    meta.className = "question-meta";

    const topicTag = document.createElement("span");
    topicTag.className = "question-tag";
    topicTag.textContent = question.topic || "General";

    const difficultyTag = document.createElement("span");
    difficultyTag.className = "question-tag";
    difficultyTag.textContent = question.difficulty || "Assessment";

    meta.appendChild(topicTag);
    meta.appendChild(difficultyTag);

    const questionHeading = document.createElement("h3");
    questionHeading.textContent =
        `${currentQuestionIndex + 1}. ${question.questionText}`;

    const optionList = document.createElement("div");
    optionList.className = "option-list";

    (question.options || []).forEach((option, index) => {
        const label = document.createElement("label");
        label.className = "option-label";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "assessmentAnswer";
        radio.value = option;
        radio.checked = selectedAnswer === option;

        radio.addEventListener("change", () => {
            answers[questionId] = option;
            renderQuestion();
        });

        const optionText = document.createElement("span");
        optionText.textContent =
            `${String.fromCharCode(65 + index)}. ${option}`;

        label.appendChild(radio);
        label.appendChild(optionText);
        optionList.appendChild(label);
    });

    card.appendChild(meta);
    card.appendChild(questionHeading);
    card.appendChild(optionList);

    const counter = document.createElement("p");
    counter.className = "question-counter";

    const answeredCount = Object.keys(answers).length;

    counter.textContent =
        `${answeredCount} of ${questions.length} questions answered`;

    const navigation = document.createElement("div");
    navigation.className = "question-navigation";

    const previousButton = document.createElement("button");
    previousButton.className = "secondary-btn";
    previousButton.textContent = "Previous";
    previousButton.disabled = currentQuestionIndex === 0;

    previousButton.addEventListener("click", () => {
        currentQuestionIndex--;
        renderQuestion();
    });

    const nextButton = document.createElement("button");
    nextButton.className = "primary-btn";

    if (currentQuestionIndex === questions.length - 1) {
        nextButton.textContent = "Submit Assessment";
        nextButton.disabled = answeredCount !== questions.length;

        nextButton.addEventListener("click", submitCurrentAssessment);
    } else {
        nextButton.textContent = "Next Question";

        nextButton.addEventListener("click", () => {
            currentQuestionIndex++;
            renderQuestion();
        });
    }

    navigation.appendChild(previousButton);
    navigation.appendChild(nextButton);

    assessmentContent.appendChild(topLine);
    assessmentContent.appendChild(track);
    assessmentContent.appendChild(card);
    assessmentContent.appendChild(counter);
    assessmentContent.appendChild(navigation);
}

async function startAssessment(type) {
    const skillId = skillSelect.value;

    if (!skillId) return;

    startInitialBtn.disabled = true;
    startReassessmentBtn.disabled = true;

    eligibilityInfo.textContent = "Preparing your assessment...";

    try {
        const data = await apiRequest("/api/assessments/start", {
            method: "POST",
            body: JSON.stringify({
                skillId,
                assessmentType: type
            })
        });

        renderAssessment(data.assessment);

    } catch (error) {
        if (error.status === 409 && error.data?.assessmentId) {
            try {
                const data = await apiRequest(
                    `/api/assessments/${error.data.assessmentId}`
                );

                renderAssessment(data.assessment);
                return;

            } catch (resumeError) {
                showMessage(eligibilityInfo, resumeError.message, true);
            }
        } else {
            showMessage(eligibilityInfo, error.message, true);
        }

    } finally {
        startInitialBtn.disabled = false;
        startReassessmentBtn.disabled = false;
    }
}

async function submitCurrentAssessment() {
    if (!currentAssessment) return;

    const questions = currentAssessment.questions;

    if (Object.keys(answers).length !== questions.length) {
        alert("Please answer every question before submitting.");
        return;
    }

    const submitButton =
        assessmentContent.querySelector(".question-navigation button:last-child");

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
    }

    const submittedAnswers = questions.map(question => ({
        questionId: question.questionId,
        answer: answers[String(question.questionId)]
    }));

    try {
        const data = await apiRequest(
            `/api/assessments/${currentAssessment.id}/submit`,
            {
                method: "POST",
                body: JSON.stringify({
                    answers: submittedAnswers
                })
            }
        );

        renderResults(data);
        await loadHistory(1);

    } catch (error) {
        alert(error.message);

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Submit Assessment";
        }
    }
}

function renderResults(data) {
    const result = data.result || data;
    const assessment = result.assessment || result;
    const proficiency =
        result.skillProficiency ||
        data.skillProficiency ||
        {};

    const percentage = Number(assessment.percentage || 0);
    const obtainedMarks = assessment.obtainedMarks ?? 0;
    const totalMarks = assessment.totalMarks ?? currentAssessment.totalMarks;

    resultContent.innerHTML = "";

    const header = document.createElement("div");
    header.className = "result-header";

    const title = document.createElement("h2");
    title.textContent = "Assessment Completed";

    const score = document.createElement("div");
    score.className = "result-score";
    score.textContent = `${percentage}%`;

    const level = document.createElement("span");
    level.className = "result-level";
    level.textContent =
        assessment.proficiency || proficiency.currentLevel || "Not available";

    const subtitle = document.createElement("p");
    subtitle.textContent =
        "Your assessment result has been saved successfully.";

    header.appendChild(title);
    header.appendChild(score);
    header.appendChild(level);
    header.appendChild(subtitle);

    const stats = document.createElement("div");
    stats.className = "result-stats";

    [
        ["Score", `${obtainedMarks}/${totalMarks}`],
        ["Proficiency", assessment.proficiency || proficiency.currentLevel || "�"],
        ["Assessments", proficiency.totalAssessments ?? "�"]
    ].forEach(([label, value]) => {
        const stat = document.createElement("div");
        stat.className = "result-stat";

        const strong = document.createElement("strong");
        strong.textContent = value;

        const span = document.createElement("span");
        span.textContent = label;

        stat.appendChild(strong);
        stat.appendChild(span);
        stats.appendChild(stat);
    });

    resultContent.appendChild(header);
    resultContent.appendChild(stats);

    if (proficiency.previousScore !== null &&
        proficiency.previousScore !== undefined) {

        const comparison = document.createElement("p");
        comparison.className = "empty-state";
        comparison.textContent =
            `Previous score: ${proficiency.previousScore}% | Current score: ${proficiency.latestScore}%`;

        resultContent.appendChild(comparison);
    }

    const questions = assessment.questions || [];

    if (questions.length > 0) {
        const reviewHeading = document.createElement("h2");
        reviewHeading.textContent = "Answer Review";

        const reviewList = document.createElement("div");
        reviewList.className = "review-list";

        questions.forEach(question => {
            const item = document.createElement("div");
            item.className = "review-item";

            const heading = document.createElement("h4");
            heading.textContent =
                `${question.questionNumber}. ${question.questionText}`;

            const status = document.createElement("p");
            status.className = question.isCorrect
                ? "review-correct"
                : "review-wrong";

            status.textContent =
                question.isCorrect ? "Correct answer" : "Incorrect answer";

            const yourAnswer = document.createElement("p");
            yourAnswer.textContent =
                `Your answer: ${question.studentAnswer || "Not answered"}`;

            const correctAnswer = document.createElement("p");
            correctAnswer.textContent =
                `Correct answer: ${question.correctAnswer || "Not available"}`;

            const explanation = document.createElement("p");
            explanation.textContent =
                `Explanation: ${question.explanation || "No explanation available."}`;

            item.appendChild(heading);
            item.appendChild(status);
            item.appendChild(yourAnswer);
            item.appendChild(correctAnswer);
            item.appendChild(explanation);

            reviewList.appendChild(item);
        });

        resultContent.appendChild(reviewHeading);
        resultContent.appendChild(reviewList);
    }

    const backButton = document.createElement("button");
    backButton.className = "primary-btn";
    backButton.textContent = "Back to Assessments";

    backButton.addEventListener("click", () => {
        resultArea.hidden = true;
        assessmentArea.hidden = true;
        currentAssessment = null;
        loadEligibility();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    resultContent.appendChild(backButton);

    assessmentArea.hidden = true;
    resultArea.hidden = false;
    resultArea.scrollIntoView({ behavior: "smooth" });
}

async function resumeAssessment(id) {
    try {
        const data = await apiRequest(`/api/assessments/${id}`);
        renderAssessment(data.assessment);
    } catch (error) {
        alert(error.message);
    }
}

async function loadHistory(page = 1) {
    historyPage = page;
    historyContent.textContent = "Loading assessment history...";

    try {
        const data = await apiRequest(
            `/api/assessments/history?page=${page}&limit=5`
        );

        assessmentHistory = data.history || [];

        const pagination = data.pagination || {};
        historyPages = pagination.totalPages || 1;

        historyContent.innerHTML = "";

        if (assessmentHistory.length === 0) {
            showMessage(
                historyContent,
                "No assessments yet. Select a learning skill above to get started."
            );
            historyPagination.innerHTML = "";
            await loadEligibility();
            return;
        }

        const list = document.createElement("div");
        list.className = "history-list";

        assessmentHistory.forEach(attempt => {
            const card = document.createElement("div");
            card.className = "history-card";

            const details = document.createElement("div");

            const heading = document.createElement("h3");
            heading.textContent =
    `${getSkillName(attempt.skill)} - ${
        attempt.assessmentType === "initial"
            ? "Initial Assessment"
            : "Reassessment"
    }`;

            const date = document.createElement("p");
            date.textContent = formatDate(attempt.createdAt);

            const status = document.createElement("p");
            status.textContent =
                `Status: ${attempt.status} | Score: ${
                    attempt.status === "completed"
                        ? `${attempt.percentage}%`
                        : "Pending"
                }`;

            details.appendChild(heading);
            details.appendChild(date);
            details.appendChild(status);

            card.appendChild(details);

            if (attempt.status === "in-progress") {
                const resumeButton = document.createElement("button");
                resumeButton.className = "primary-btn";
                resumeButton.textContent = "Resume";

                resumeButton.addEventListener("click", () => {
                    resumeAssessment(getAttemptId(attempt));
                });

                card.appendChild(resumeButton);
            }

            list.appendChild(card);
        });

        historyContent.appendChild(list);

        historyPagination.innerHTML = "";

        const previous = document.createElement("button");
        previous.className = "secondary-btn";
        previous.textContent = "Previous";
        previous.disabled = !pagination.hasPreviousPage;

        previous.addEventListener("click", () => {
            loadHistory(historyPage - 1);
        });

        const pageLabel = document.createElement("span");
        pageLabel.textContent = `Page ${historyPage} of ${historyPages}`;

        const next = document.createElement("button");
        next.className = "secondary-btn";
        next.textContent = "Next";
        next.disabled = !pagination.hasNextPage;

        next.addEventListener("click", () => {
            loadHistory(historyPage + 1);
        });

        historyPagination.appendChild(previous);
        historyPagination.appendChild(pageLabel);
        historyPagination.appendChild(next);

        await loadEligibility();

    } catch (error) {
        showMessage(historyContent, error.message, true);
    }
}

skillSelect.addEventListener("change", loadEligibility);

startInitialBtn.addEventListener("click", () => {
    startAssessment("initial");
});

startReassessmentBtn.addEventListener("click", () => {
    startAssessment("reassessment");
});

document.getElementById("refreshHistoryBtn")
    .addEventListener("click", () => loadHistory(historyPage));

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("skillbridgeToken");
    localStorage.removeItem("skillbridgeUser");
    window.location.href = "../index.html";
});

loadLearningSkills();
