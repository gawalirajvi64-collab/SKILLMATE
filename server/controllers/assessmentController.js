const SessionLearningRecord = require("../models/SessionLearningRecord");
const mongoose = require("mongoose");

const Skill = require("../models/Skill");
const UserSkill = require("../models/UserSkill");
const SkillTopic = require("../models/SkillTopic");
const QuestionBank = require("../models/QuestionBank");
const AssessmentAttempt = require("../models/AssessmentAttempt");
const SkillProficiency = require("../models/SkillProficiency");

const {
    generateMissingQuestions
} = require("../services/assessmentQuestionService");

// Convert percentage into proficiency level
const getProficiencyLevel = (percentage) => {

    if (percentage < 40) {
        return "beginner";
    }

    if (percentage < 75) {
        return "intermediate";
    }

    return "advanced";
};



const getReassessmentEligibilityData = async (studentId, skillId) => {

    const learningRecords = await SessionLearningRecord.find({
        learner: studentId,
        confirmationStatus: { $in: ["confirmed", "corrected"] },
        confirmedTopics: { $exists: true, $ne: [] }
    }).populate({
        path: "session",
        match: {
            skill: skillId,
            status: "completed"
        },
        select: "_id skill status"
    });

    // Keep only records belonging to completed sessions
    const validRecords = learningRecords.filter(
        record => record.session !== null
    );

    // Count each completed session only once
    const uniqueSessionIds = new Set();

    // Collect distinct confirmed topics
    const distinctTopics = new Set();

    validRecords.forEach(record => {

        uniqueSessionIds.add(
            record.session._id.toString()
        );

        record.confirmedTopics.forEach(topic => {

            const normalizedTopic = topic.trim().toLowerCase();

            if (normalizedTopic) {
                distinctTopics.add(normalizedTopic);
            }

        });

    });

    const completedSessions = uniqueSessionIds.size;
    const topicCount = distinctTopics.size;

    const requiredSessions = 3;
    const requiredTopics = 5;

    const eligible =
        completedSessions >= requiredSessions &&
        topicCount >= requiredTopics;

    return {
        eligible,
        completedSessions,
        requiredSessions,
        distinctTopics: topicCount,
        requiredTopics,
        remainingSessions: Math.max(
            0,
            requiredSessions - completedSessions
        ),
        remainingTopics: Math.max(
            0,
            requiredTopics - topicCount
        )
    };
};


// Start an initial skill assessment

// Start an initial assessment or reassessment
const startAssessment = async (req, res) => {

    try {

        const { skillId, assessmentType = "initial" } = req.body;

        // Validate assessment type
        if (!["initial", "reassessment"].includes(assessmentType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid assessment type."
            });
        }

        // Validate skill ID
        if (!mongoose.Types.ObjectId.isValid(skillId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid skill ID."
            });
        }

        // Check whether the skill exists and is active
        const skill = await Skill.findOne({
            _id: skillId,
            isActive: true
        });

        if (!skill) {
            return res.status(404).json({
                success: false,
                message: "Skill not found or inactive."
            });
        }

        // Student must have selected this skill to learn
        const learningSkill = await UserSkill.findOne({
            user: req.user._id,
            skill: skillId,
            type: "learn"
        });

        if (!learningSkill) {
            return res.status(403).json({
                success: false,
                message: "Add this skill to your learning skills before starting an assessment."
            });
        }

        // Prevent multiple unfinished assessments
        const existingAttempt = await AssessmentAttempt.findOne({
            student: req.user._id,
            skill: skillId,
            status: "in-progress"
        });

        if (existingAttempt) {
            return res.status(409).json({
                success: false,
                message: "You already have an unfinished assessment for this skill.",
                assessmentId: existingAttempt._id
            });
        }

        let topics = [];

        if (assessmentType === "initial") {

            // Prevent another initial assessment
            const previousInitialAttempt = await AssessmentAttempt.findOne({
                student: req.user._id,
                skill: skillId,
                assessmentType: "initial",
                status: "completed"
            });

            if (previousInitialAttempt) {
                return res.status(409).json({
                    success: false,
                    message: "Your initial assessment is already completed. Use reassessment when eligible."
                });
            }

            // Fetch all active skill topics
            topics = await SkillTopic.find({
                skill: skillId,
                isActive: true
            }).sort({ order: 1 });

        } else {

            // A completed initial assessment is required
            const initialAttempt = await AssessmentAttempt.findOne({
                student: req.user._id,
                skill: skillId,
                assessmentType: "initial",
                status: "completed"
            });

            if (!initialAttempt) {
                return res.status(403).json({
                    success: false,
                    message: "Complete your initial assessment before starting a reassessment."
                });
            }

            // Check reassessment eligibility
            const eligibilityResponse = await getReassessmentEligibilityData(
                req.user._id,
                skillId
            );

            if (!eligibilityResponse.eligible) {
                return res.status(403).json({
                    success: false,
                    message: "You are not yet eligible for reassessment.",
                    eligibility: eligibilityResponse
                });
            }

            // Fetch confirmed learning records for this skill
            const learningRecords = await SessionLearningRecord.find({
                learner: req.user._id,
                confirmationStatus: { $in: ["confirmed", "corrected"] },
                confirmedTopics: { $exists: true, $ne: [] }
            }).populate({
                path: "session",
                match: {
                    skill: skillId,
                    status: "completed"
                },
                select: "skill status"
            });

            const confirmedTopicNames = [
                ...new Set(
                    learningRecords
                        .filter(record => record.session !== null)
                        .flatMap(record => record.confirmedTopics)
                        .map(topic => topic.trim().toLowerCase())
                )
            ];

            // Match confirmed topics with the skill topic catalogue
            topics = await SkillTopic.find({
                skill: skillId,
                isActive: true,
                name: {
                    $in: confirmedTopicNames.map(
                        name => new RegExp(
                            "^" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$",
                            "i"
                        )
                    )
                }
            });

        }

        if (topics.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No confirmed assessment topics are available for this skill."
            });
        }

        // Fetch active MCQ questions from the selected topics

// Fetch active MCQ questions from the selected topics
let questions = await QuestionBank.find({
    skill: skillId,
    topic: { $in: topics.map(topic => topic._id) },
    questionType: "mcq",
    isActive: true
});

// Generate missing questions automatically when required
if (questions.length < 10) {

    let remainingQuestions = 10 - questions.length;

    for (const topic of topics) {

        if (remainingQuestions <= 0) {
            break;
        }

        const existingTopicQuestions = questions.filter(
            question =>
                question.topic.toString() === topic._id.toString()
        ).length;

        const remainingTopics = topics.length -
            topics.indexOf(topic);

        const allocation = Math.ceil(
            remainingQuestions / remainingTopics
        );

        const targetCount = Math.min(
            10,
            existingTopicQuestions + allocation
        );

        if (targetCount <= existingTopicQuestions) {
            continue;
        }

        await generateMissingQuestions({
            skill,
            topic,
            requiredCount: targetCount
        });

        // Refresh questions after generation
        questions = await QuestionBank.find({
            skill: skillId,
            topic: { $in: topics.map(item => item._id) },
            questionType: "mcq",
            isActive: true
        });

        remainingQuestions = Math.max(
            0,
            10 - questions.length
        );
    }
}

// Final availability check
if (questions.length < 10) {
    return res.status(400).json({
        success: false,
        message: "Not enough assessment questions are available. Please try again later.",
        availableQuestions: questions.length
    });
}


        // Shuffle questions using Fisher-Yates algorithm
        const shuffledQuestions = [...questions];

        for (let i = shuffledQuestions.length - 1; i > 0; i--) {

            const j = Math.floor(Math.random() * (i + 1));

            [shuffledQuestions[i], shuffledQuestions[j]] =
                [shuffledQuestions[j], shuffledQuestions[i]];

        }

        // Select 10 questions
        const selectedQuestions = shuffledQuestions.slice(0, 10);

        // Create secure server-side assessment snapshot
        const attemptQuestions = selectedQuestions.map(question => ({

            question: question._id,
            questionText: question.question,
            questionType: question.questionType,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            topic: question.topic,
            difficulty: question.difficulty

        }));

        const attempt = await AssessmentAttempt.create({

            student: req.user._id,
            skill: skillId,
            assessmentType,
            questions: attemptQuestions,
            totalQuestions: attemptQuestions.length,
            totalMarks: attemptQuestions.length,
            status: "in-progress"

        });

        // Prepare safe questions without answer keys
        const safeQuestions = attempt.questions.map((question, index) => ({

            questionId: question._id,
            questionNumber: index + 1,
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.options,

            topic: topics.find(
                topic => topic._id.equals(question.topic)
            )?.name || "Unknown Topic",

            difficulty: question.difficulty

        }));

        return res.status(201).json({

            success: true,
            message: assessmentType === "initial"
                ? "Initial assessment started successfully."
                : "Reassessment started successfully.",

            assessment: {
                id: attempt._id,

                skill: {
                    id: skill._id,
                    name: skill.name
                },

                assessmentType: attempt.assessmentType,
                totalQuestions: attempt.totalQuestions,
                totalMarks: attempt.totalMarks,
                questions: safeQuestions
            }

        });


    } catch (error) {

        console.error("Start Assessment Error:", error);

        // Handle duplicate in-progress assessment
        if (error.code === 11000) {

            const existingAttempt = await AssessmentAttempt.findOne({
                student: req.user._id,
                skill: req.body.skillId,
                status: "in-progress"
            });

            return res.status(409).json({
                success: false,
                message: "You already have an unfinished assessment for this skill.",
                assessmentId: existingAttempt?._id || null
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to start assessment."
        });

    }

};

// Get an existing assessment safely
const getAssessment = async (req, res) => {

    try {

        const { id } = req.params;

        // Validate assessment ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid assessment ID."
            });
        }

        // Only the owner can access the assessment
        const attempt = await AssessmentAttempt.findOne({
            _id: id,
            student: req.user._id
        })
        .populate("skill", "name")
        .populate("questions.topic", "name");

        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found."
            });
        }

        // Do not allow access to abandoned attempts
        if (attempt.status === "abandoned") {
            return res.status(400).json({
                success: false,
                message: "This assessment has been abandoned."
            });
        }

        // Never expose answer keys through the retrieval endpoint
        const safeQuestions = attempt.questions.map((question, index) => ({

            questionId: question._id,
            questionNumber: index + 1,
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.options,
            topic: question.topic?.name || "Unknown Topic",
            difficulty: question.difficulty,
            studentAnswer: question.studentAnswer

        }));

        return res.status(200).json({

            success: true,

            assessment: {
                id: attempt._id,
                skill: attempt.skill,
                assessmentType: attempt.assessmentType,
                totalQuestions: attempt.totalQuestions,
                totalMarks: attempt.totalMarks,
                status: attempt.status,
                questions: safeQuestions
            }

        });

    } catch (error) {

        console.error("Get Assessment Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve assessment."
        });

    }
};


// Submit assessment answers and calculate results
const submitAssessment = async (req, res) => {

    const dbSession = await mongoose.startSession();

    try {

        const { id } = req.params;
        const { answers } = req.body;

        // Validate assessment ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid assessment ID."
            });
        }

        // Validate submitted answers
        if (!Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: "Answers must be provided as an array."
            });
        }

        let responseData = null;
        let responseStatus = 200;

        // Use a transaction to save assessment and proficiency together
        await dbSession.withTransaction(async () => {

            // Retrieve only the logged-in student's assessment
            const attempt = await AssessmentAttempt.findOne({
                _id: id,
                student: req.user._id
            }).session(dbSession);

            if (!attempt) {

                responseStatus = 404;

                responseData = {
                    success: false,
                    message: "Assessment not found."
                };

                return;
            }

            // Prevent duplicate submissions
            if (attempt.status !== "in-progress") {

                responseStatus = 409;

                responseData = {
                    success: false,
                    message: "This assessment has already been submitted or is no longer active."
                };

                return;
            }


            // Validate assessment data integrity before scoring
            const calculatedTotalMarks = attempt.questions.reduce(
                (total, question) => total + question.marks,
                0
            );

            if (
                attempt.questions.length !== attempt.totalQuestions ||
                !Number.isFinite(attempt.totalMarks) ||
                attempt.totalMarks <= 0 ||
                !Number.isFinite(calculatedTotalMarks) ||
                attempt.totalMarks !== calculatedTotalMarks ||
                attempt.questions.some(
                    question =>
                        !Number.isFinite(question.marks) ||
                        question.marks <= 0 ||
                        !Number.isFinite(question.awardedMarks) ||
                        question.awardedMarks < 0 ||
                        question.awardedMarks > question.marks
                )
            ) {
                responseStatus = 500;

                responseData = {
                    success: false,
                    message: "Assessment data integrity validation failed."
                };

                return;
            }

            // Ensure every question has exactly one answer
            if (answers.length !== attempt.questions.length) {

                responseStatus = 400;

                responseData = {
                    success: false,
                    message: "Please submit an answer for every assessment question."
                };

                return;
            }

            const answerMap = new Map();

            for (const item of answers) {

                if (
                    !item ||
                    !mongoose.Types.ObjectId.isValid(item.questionId) ||
                    typeof item.answer !== "string" ||
                    item.answer.trim().length === 0 ||
                    item.answer.length > 1000
                ) {

                    responseStatus = 400;

                    responseData = {
                        success: false,
                        message: "One or more submitted answers are invalid."
                    };

                    return;
                }

                const questionId = item.questionId.toString();

                if (answerMap.has(questionId)) {

                    responseStatus = 400;

                    responseData = {
                        success: false,
                        message: "Duplicate answers for a question are not allowed."
                    };

                    return;
                }

                answerMap.set(questionId, item.answer.trim());

            }

            // Verify that all submitted question IDs belong to this attempt
            for (const questionId of answerMap.keys()) {

                const belongsToAttempt = attempt.questions.some(
                    question => question._id.toString() === questionId
                );

                if (!belongsToAttempt) {

                    responseStatus = 400;

                    responseData = {
                        success: false,
                        message: "An invalid question was included in the submission."
                    };

                    return;
                }

            }

            let obtainedMarks = 0;

            // Check answers using the server-side answer key
            for (const question of attempt.questions) {

                if (question.questionType !== "mcq") {

                    responseStatus = 400;

                    responseData = {
                        success: false,
                        message: "Automatic scoring currently supports MCQ questions only."
                    };

                    return;
                }

                const submittedAnswer = answerMap.get(
                    question._id.toString()
                );

                // Answer must be one of the available options
                const validOption = question.options.some(
                    option =>
                        option.trim().toLowerCase() ===
                        submittedAnswer.toLowerCase()
                );

                if (!validOption) {

                    responseStatus = 400;

                    responseData = {
                        success: false,
                        message: "A submitted answer does not match the available options."
                    };

                    return;
                }

                const isCorrect =
                    submittedAnswer.toLowerCase() ===
                    question.correctAnswer.trim().toLowerCase();

                question.studentAnswer = submittedAnswer;
                question.isCorrect = isCorrect;

                question.awardedMarks = isCorrect
                    ? question.marks
                    : 0;

                obtainedMarks += question.awardedMarks;

            }

            // Validate calculated score
if (
    !Number.isFinite(obtainedMarks) ||
    obtainedMarks < 0 ||
    obtainedMarks > attempt.totalMarks
) {
    responseStatus = 500;

    responseData = {
        success: false,
        message: "Calculated assessment score is invalid."
    };

    return;
}

// Calculate percentage
const percentage = Number(
    ((obtainedMarks / attempt.totalMarks) * 100).toFixed(2)
);

            // Determine proficiency
            const proficiencyLevel = getProficiencyLevel(percentage);

            // Complete the assessment
            attempt.obtainedMarks = obtainedMarks;
            attempt.percentage = percentage;
            attempt.proficiency = proficiencyLevel;
            attempt.status = "completed";
            attempt.completedAt = new Date();

            await attempt.save({
                session: dbSession
            });

            // Find or create the student's skill proficiency record
            let proficiency = await SkillProficiency.findOne({
                student: req.user._id,
                skill: attempt.skill
            }).session(dbSession);

            if (!proficiency) {

                proficiency = new SkillProficiency({

                    student: req.user._id,
                    skill: attempt.skill,

                    initialScore:
                        attempt.assessmentType === "initial"
                            ? percentage
                            : null,

                    latestScore: percentage,
                    previousScore: null,
                    currentLevel: proficiencyLevel,
                    totalAssessments: 1,
                    lastAssessment: attempt._id,
                    lastAssessedAt: new Date()

                });

            } else {

                // Preserve the first initial assessment score
                if (
                    attempt.assessmentType === "initial" &&
                    proficiency.initialScore === null
                ) {
                    proficiency.initialScore = percentage;
                }

                proficiency.previousScore = proficiency.latestScore;
                proficiency.latestScore = percentage;
                proficiency.currentLevel = proficiencyLevel;

                proficiency.totalAssessments += 1;

                proficiency.lastAssessment = attempt._id;
                proficiency.lastAssessedAt = new Date();

            }

            await proficiency.save({
                session: dbSession
            });

            // Prepare result after successful scoring
            responseStatus = 200;

            responseData = {

                success: true,
                message: "Assessment submitted and scored successfully.",

                result: {
                    assessmentId: attempt._id,
                    skill: attempt.skill,
                    assessmentType: attempt.assessmentType,
                    totalQuestions: attempt.totalQuestions,
                    totalMarks: attempt.totalMarks,
                    obtainedMarks: attempt.obtainedMarks,
                    percentage: attempt.percentage,
                    proficiency: attempt.proficiency,
                    status: attempt.status,
                    completedAt: attempt.completedAt,

                    questions: attempt.questions.map((question, index) => ({

                        questionNumber: index + 1,
                        questionText: question.questionText,
                        studentAnswer: question.studentAnswer,
                        correctAnswer: question.correctAnswer,
                        isCorrect: question.isCorrect,
                        marks: question.marks,
                        awardedMarks: question.awardedMarks,
                        explanation: question.explanation

                    }))

                },

                skillProficiency: {
                    initialScore: proficiency.initialScore,
                    latestScore: proficiency.latestScore,
                    previousScore: proficiency.previousScore,
                    currentLevel: proficiency.currentLevel,
                    totalAssessments: proficiency.totalAssessments
                }

            };

        });

        return res.status(responseStatus).json(responseData);

    } catch (error) {

        console.error("Submit Assessment Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to submit assessment."
        });

    } finally {

        await dbSession.endSession();

    }

};



// Check whether a student is eligible for reassessment

// Get the logged-in student's assessment history

// Get the logged-in student's assessment history
const getAssessmentHistory = async (req, res) => {

    try {

        const {
            page = "1",
            limit = "10",
            assessmentType,
            skillId
        } = req.query;

        // Validate pagination
        const currentPage = Number(page);
        const pageLimit = Number(limit);

        if (
            !Number.isInteger(currentPage) ||
            currentPage < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Page must be a positive integer."
            });
        }

        if (
            !Number.isInteger(pageLimit) ||
            pageLimit < 1 ||
            pageLimit > 50
        ) {
            return res.status(400).json({
                success: false,
                message: "Limit must be between 1 and 50."
            });
        }

        // Validate assessment type filter
        if (
            assessmentType &&
            !["initial", "reassessment"].includes(assessmentType)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid assessment type."
            });
        }

        // Validate skill filter
        if (
            skillId &&
            !mongoose.Types.ObjectId.isValid(skillId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid skill ID."
            });
        }

        // Build student-specific filter
        const filter = {
            student: req.user._id
        };

        if (assessmentType) {
            filter.assessmentType = assessmentType;
        }

        if (skillId) {
            filter.skill = skillId;
        }

        // Get total matching attempts
        const totalAttempts =
            await AssessmentAttempt.countDocuments(filter);

        // Calculate pagination
        const totalPages = Math.ceil(
            totalAttempts / pageLimit
        );

        const skip = (currentPage - 1) * pageLimit;

        // Fetch paginated history
        const attempts = await AssessmentAttempt.find(filter)
            .populate("skill", "name")
            .select(
                "skill assessmentType totalQuestions totalMarks obtainedMarks percentage proficiency status startedAt completedAt createdAt"
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageLimit);

        // Format response
        const history = attempts.map(attempt => ({

            id: attempt._id,

            skill: attempt.skill
                ? {
                    id: attempt.skill._id,
                    name: attempt.skill.name
                }
                : null,

            assessmentType: attempt.assessmentType,

            totalQuestions: attempt.totalQuestions,
            totalMarks: attempt.totalMarks,
            obtainedMarks: attempt.obtainedMarks,
            percentage: attempt.percentage,

            proficiency: attempt.proficiency,
            status: attempt.status,

            startedAt: attempt.startedAt,
            completedAt: attempt.completedAt,
            createdAt: attempt.createdAt

        }));

        return res.status(200).json({

            success: true,

            pagination: {
                currentPage,
                limit: pageLimit,
                totalAttempts,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1
            },

            history

        });

    } catch (error) {

        console.error("Get Assessment History Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve assessment history."
        });

    }
};


const checkReassessmentEligibility = async (req, res) => {

    try {

        const { skillId } = req.params;

        // Validate skill ID
        if (!mongoose.Types.ObjectId.isValid(skillId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid skill ID."
            });
        }

        // Check whether the skill exists and is active
const skill = await Skill.findOne({
    _id: skillId,
    isActive: true
});

if (!skill) {
    return res.status(404).json({
        success: false,
        message: "Skill not found or inactive."
    });
}

        // Check whether the student has selected this skill to learn
        const learningSkill = await UserSkill.findOne({
            user: req.user._id,
            skill: skillId,
            type: "learn"
        });

        if (!learningSkill) {
            return res.status(403).json({
                success: false,
                message: "Add this skill to your learning skills first."
            });
        }

        // Reuse the common eligibility calculation
        const eligibility = await getReassessmentEligibilityData(
            req.user._id,
            skillId
        );

        return res.status(200).json({

            success: true,

            eligibility,

            message: eligibility.eligible
                ? "You are eligible for reassessment."
                : "Complete more learning sessions and confirm additional topics to unlock reassessment."

        });

    } catch (error) {

        console.error("Reassessment Eligibility Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to check reassessment eligibility."
        });

    }
};



module.exports = {
    startAssessment,
    getAssessment,
    submitAssessment,
    checkReassessmentEligibility,
    getAssessmentHistory
};
