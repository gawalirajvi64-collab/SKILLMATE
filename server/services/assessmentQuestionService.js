
const QuestionBank = require("../models/QuestionBank");
const { generateQuestions } = require("./geminiService");
const {
    validateGeneratedQuestions
} = require("./questionValidationService");

// In-memory protection for a single server instance
const generationLocks = new Map();
const generationCooldowns = new Map();
const generationAttempts = new Map();

const getTopicKey = (skillId, topicId) => {
    return `${skillId.toString()}:${topicId.toString()}`;
};

const normalizeQuestion = (question) => {
    return question
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};

const generateMissingQuestions = async ({
    skill,
    topic,
    requiredCount
}) => {

    if (!skill?._id || !topic?._id) {
        throw new Error("Valid skill and topic documents are required.");
    }

    if (
        !Number.isInteger(requiredCount) ||
        requiredCount < 1 ||
        requiredCount > 10
    ) {
        throw new Error("Required question count must be between 1 and 10.");
    }

    const topicKey = getTopicKey(skill._id, topic._id);

    // Wait if another request is generating questions for this topic
    if (generationLocks.has(topicKey)) {

        await generationLocks.get(topicKey);

        // Recheck the database after the other request finishes
        const updatedQuestions = await QuestionBank.countDocuments({
            skill: skill._id,
            topic: topic._id,
            questionType: "mcq",
            isActive: true
        });

        if (updatedQuestions >= requiredCount) {
            return {
                generated: 0,
                saved: 0,
                message: "Enough active questions are now available."
            };
        }

        // Retry if the question bank still needs questions
        return generateMissingQuestions({
            skill,
            topic,
            requiredCount
        });
    }

    const cooldownMs = Number(
        process.env.AI_GENERATION_COOLDOWN_MS || 60000
    );

    const maxAttempts = Number(
        process.env.AI_MAX_GENERATION_PER_TOPIC || 5
    );

    if (
        !Number.isFinite(cooldownMs) ||
        cooldownMs < 0 ||
        !Number.isInteger(maxAttempts) ||
        maxAttempts < 1
    ) {
        throw new Error("Invalid AI generation protection settings.");
    }

    // Check cooldown
    const lastAttempt = generationCooldowns.get(topicKey);

    if (
        lastAttempt &&
        Date.now() - lastAttempt < cooldownMs
    ) {
        return {
            generated: 0,
            saved: 0,
            message: "Question generation is temporarily on cooldown."
        };
    }

    // Check generation attempt limit
    const attempts = generationAttempts.get(topicKey) || 0;

    if (attempts >= maxAttempts) {
        return {
            generated: 0,
            saved: 0,
            message: "Maximum generation attempts reached for this topic."
        };
    }

    let releaseLock;

    const lockPromise = new Promise(resolve => {
        releaseLock = resolve;
    });

    generationLocks.set(topicKey, lockPromise);

    try {

        // Recheck existing active questions
        const existingQuestions = await QuestionBank.find({
            skill: skill._id,
            topic: topic._id,
            questionType: "mcq",
            isActive: true
        }).select("question");

        if (existingQuestions.length >= requiredCount) {
            return {
                generated: 0,
                saved: 0,
                message: "Enough active questions already exist."
            };
        }

        const existingQuestionTexts = new Set(
            existingQuestions.map(question =>
                normalizeQuestion(question.question)
            )
        );

        const missingCount = Math.min(
            10,
            requiredCount - existingQuestions.length
        );

        // Record attempt before calling Gemini
        generationAttempts.set(topicKey, attempts + 1);
        generationCooldowns.set(topicKey, Date.now());

        // Generate missing questions
        const generatedQuestions = await generateQuestions({
            skillName: skill.name,
            topicName: topic.name,
            difficulty: topic.level,
            count: missingCount
        });

        // Validate generated questions
        const validation = validateGeneratedQuestions({
            questions: generatedQuestions,
            skillName: skill.name,
            topicName: topic.name,
            difficulty: topic.level,
            expectedCount: missingCount
        });

        if (!validation.valid) {
            throw new Error(
                `Generated questions failed validation: ${validation.errors.join(" ")}`
            );
        }

        // Remove duplicates from existing questions and current batch
        const newQuestions = generatedQuestions.filter(question => {

            const normalized = normalizeQuestion(question.question);

            if (existingQuestionTexts.has(normalized)) {
                return false;
            }

            existingQuestionTexts.add(normalized);
            return true;
        });

        if (newQuestions.length === 0) {
            return {
                generated: generatedQuestions.length,
                saved: 0,
                message: "All generated questions were duplicates."
            };
        }

        // Prepare QuestionBank documents
        const documents = newQuestions.map(question => ({
            skill: skill._id,
            topic: topic._id,
            question: question.question.trim(),
            questionType: "mcq",
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation.trim(),
            difficulty: topic.level,
            isActive: true
        }));

        // Save validated questions
        const savedQuestions = await QuestionBank.insertMany(
            documents,
            { ordered: true }
        );

        return {
            generated: generatedQuestions.length,
            saved: savedQuestions.length,
            message: "Generated questions saved successfully."
        };

    } finally {

        // Release waiting requests
        generationLocks.delete(topicKey);
        releaseLock();

    }
};

module.exports = {
    generateMissingQuestions
};
