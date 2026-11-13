
const validateGeneratedQuestions = ({
    questions,
    skillName,
    topicName,
    difficulty,
    expectedCount
}) => {

    const errors = [];

    const validDifficulties = [
        "beginner",
        "intermediate",
        "advanced"
    ];

    if (!Array.isArray(questions)) {
        return {
            valid: false,
            errors: ["Questions must be provided as an array."]
        };
    }

    if (
        !Number.isInteger(expectedCount) ||
        questions.length !== expectedCount
    ) {
        errors.push("Generated question count does not match the requested count.");
    }

    if (!skillName || !topicName) {
        errors.push("Skill name and topic name are required.");
    }

    if (!validDifficulties.includes(difficulty)) {
        errors.push("Invalid requested difficulty.");
    }

    const seenQuestions = new Set();

    questions.forEach((question, index) => {

        const questionNumber = index + 1;

        if (!question || typeof question !== "object" || Array.isArray(question)) {
            errors.push(`Question ${questionNumber}: Invalid question object.`);
            return;
        }

        // Validate question text
        if (
            typeof question.question !== "string" ||
            !question.question.trim() ||
            question.question.length > 1000
        ) {
            errors.push(`Question ${questionNumber}: Invalid question text.`);
        } else {

            const normalizedQuestion = question.question
                .trim()
                .toLowerCase()
                .replace(/\s+/g, " ");

            if (seenQuestions.has(normalizedQuestion)) {
                errors.push(`Question ${questionNumber}: Duplicate question.`);
            }

            seenQuestions.add(normalizedQuestion);
        }

        // Only MCQs are currently supported
        if (question.questionType !== "mcq") {
            errors.push(`Question ${questionNumber}: Only MCQ questions are supported.`);
        }

        // Validate options
        if (
            !Array.isArray(question.options) ||
            question.options.length !== 4
        ) {
            errors.push(`Question ${questionNumber}: Exactly four options are required.`);
        } else {

            const normalizedOptions = question.options.map(option =>
                typeof option === "string"
                    ? option.trim().toLowerCase()
                    : ""
            );

            if (
                normalizedOptions.some(option => !option || option.length > 500)
            ) {
                errors.push(`Question ${questionNumber}: Options must be non-empty strings of at most 500 characters.`);
            }

            if (new Set(normalizedOptions).size !== 4) {
                errors.push(`Question ${questionNumber}: Duplicate options are not allowed.`);
            }

            if (
                typeof question.correctAnswer !== "string" ||
                !normalizedOptions.includes(question.correctAnswer.trim().toLowerCase())
            ) {
                errors.push(`Question ${questionNumber}: Correct answer must match one of the options.`);
            }
        }

        // Validate explanation
        if (
            typeof question.explanation !== "string" ||
            !question.explanation.trim() ||
            question.explanation.length > 1000
        ) {
            errors.push(`Question ${questionNumber}: Invalid explanation.`);
        }

        // Validate difficulty
        if (question.difficulty !== difficulty) {
            errors.push(`Question ${questionNumber}: Difficulty does not match the requested difficulty.`);
        }

    });

    return {
        valid: errors.length === 0,
        errors
    };
};

module.exports = {
    validateGeneratedQuestions
};
