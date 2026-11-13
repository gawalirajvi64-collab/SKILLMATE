const { GoogleGenAI } = require("@google/genai");

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.8-flash";

let geminiClient = null;

const getGeminiClient = () => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured.");
    }

    if (!geminiClient) {
        geminiClient = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
                timeout: 120000,
                retryOptions: {
                    attempts: 2,
                    initialDelay: 1,
                    maxDelay: 3,
                    expBase: 2,
                    jitter: 0.2,
                    httpStatusCodes: [408, 429, 500, 502, 503, 504]
                }
            }
        });
    }

    return geminiClient;
};

const generateQuestions = async ({
    skillName,
    topicName,
    difficulty,
    count = 5
}) => {
    if (!skillName || !topicName) {
        throw new Error("Skill name and topic name are required.");
    }

    if (!["beginner", "intermediate", "advanced"].includes(difficulty)) {
        throw new Error("Invalid question difficulty.");
    }

    if (!Number.isInteger(count) || count < 1 || count > 10) {
        throw new Error("Question count must be between 1 and 10.");
    }

    const ai = getGeminiClient();

    const prompt = `
You are an experienced educational assessment question writer.

Generate ${count} original multiple-choice questions.

Skill: ${skillName}
Topic: ${topicName}
Difficulty: ${difficulty}

Requirements:
1. Every question must test the specified topic.
2. Questions must match the requested difficulty.
3. Each question must have exactly four distinct options.
4. Only one option must be correct.
5. The correctAnswer must exactly match one of the four options.
6. Explanations must clearly explain why the answer is correct.
7. Avoid ambiguous wording and duplicate questions.
8. Do not include information outside the requested topic.
9. Return only the requested structured JSON.
`;

    let response;

    try {
        response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
                responseJsonSchema: {
                    type: "object",
                    properties: {
                        questions: {
                            type: "array",
                            minItems: count,
                            maxItems: count,
                            items: {
                                type: "object",
                                properties: {
                                    question: { type: "string" },
                                    questionType: {
                                        type: "string",
                                        enum: ["mcq"]
                                    },
                                    options: {
                                        type: "array",
                                        minItems: 4,
                                        maxItems: 4,
                                        items: { type: "string" }
                                    },
                                    correctAnswer: { type: "string" },
                                    explanation: { type: "string" },
                                    difficulty: {
                                        type: "string",
                                        enum: ["beginner", "intermediate", "advanced"]
                                    }
                                },
                                required: [
                                    "question",
                                    "questionType",
                                    "options",
                                    "correctAnswer",
                                    "explanation",
                                    "difficulty"
                                ],
                                additionalProperties: false
                            }
                        }
                    },
                    required: ["questions"],
                    additionalProperties: false
                }
            }
        });
    } catch (error) {
        const status = error.status || error.code || "unknown";

        throw new Error(
            `Gemini generation failed (status: ${status}). ${error.message}`
        );
    }

    if (!response.text) {
        throw new Error("Gemini returned an empty response.");
    }

    let parsedResponse;

    try {
        parsedResponse = JSON.parse(response.text);
    } catch (error) {
        throw new Error("Gemini returned invalid JSON.");
    }

    if (
        !parsedResponse ||
        !Array.isArray(parsedResponse.questions) ||
        parsedResponse.questions.length !== count
    ) {
        throw new Error("Gemini returned an invalid question structure.");
    }

    return parsedResponse.questions;
};

module.exports = {
    generateQuestions
};
