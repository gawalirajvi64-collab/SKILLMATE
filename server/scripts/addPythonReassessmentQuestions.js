
const mongoose = require("mongoose");
require("dotenv").config();

const Skill = require("../models/Skill");
const SkillTopic = require("../models/SkillTopic");
const QuestionBank = require("../models/QuestionBank");

const questions = [
    {
        topic: "Python Basics",
        difficulty: "beginner",
        question: "What is the output of print(type(5)) in Python?",
        options: ["<class 'str'>", "<class 'int'>", "<class 'float'>", "<class 'bool'>"],
        correctAnswer: "<class 'int'>",
        explanation: "The value 5 is an integer, so type(5) returns int."
    },
    {
        topic: "Variables and Data Types",
        difficulty: "beginner",
        question: "Which function converts a numeric string into an integer?",
        options: ["str()", "float()", "int()", "bool()"],
        correctAnswer: "int()",
        explanation: "The int() function converts a valid numeric string into an integer."
    },
    {
        topic: "Conditional Statements",
        difficulty: "beginner",
        question: "Which keyword executes a block when the previous if condition is false and another condition must be checked?",
        options: ["else if", "elif", "otherwise", "switch"],
        correctAnswer: "elif",
        explanation: "Python uses elif to check another condition after an if condition."
    },
    {
        topic: "Loops",
        difficulty: "beginner",
        question: "What does the break statement do inside a Python loop?",
        options: [
            "Skips only the current iteration",
            "Terminates the loop",
            "Restarts the loop",
            "Pauses the program"
        ],
        correctAnswer: "Terminates the loop",
        explanation: "The break statement immediately exits the nearest enclosing loop."
    },
    {
        topic: "Lists and Tuples",
        difficulty: "beginner",
        question: "Which method adds an element to the end of a Python list?",
        options: ["add()", "insertEnd()", "append()", "extendOne()"],
        correctAnswer: "append()",
        explanation: "The append() method adds a single element to the end of a list."
    }
];

async function addQuestions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected.");

        const skill = await Skill.findOne({
            name: "Python",
            isActive: true
        });

        if (!skill) {
            throw new Error("Active Python skill not found.");
        }

        let inserted = 0;
        let skipped = 0;

        for (const item of questions) {
            const topic = await SkillTopic.findOne({
                skill: skill._id,
                name: item.topic,
                isActive: true
            });

            if (!topic) {
                throw new Error(`Topic not found: ${item.topic}`);
            }

            const existing = await QuestionBank.findOne({
                skill: skill._id,
                topic: topic._id,
                question: item.question
            });

            if (existing) {
                skipped++;
                continue;
            }

            await QuestionBank.create({
                skill: skill._id,
                topic: topic._id,
                question: item.question,
                questionType: "mcq",
                options: item.options,
                correctAnswer: item.correctAnswer,
                explanation: item.explanation,
                difficulty: item.difficulty,
                isActive: true
            });

            inserted++;
        }

        console.log("\nADDITIONAL QUESTIONS ADDED");
        console.log("Total:", questions.length);
        console.log("Inserted:", inserted);
        console.log("Skipped:", skipped);

        const confirmedTopicNames = questions.map(q => q.topic);
        const topicDocs = await SkillTopic.find({
            skill: skill._id,
            name: { $in: confirmedTopicNames }
        });

        const availableQuestions = await QuestionBank.countDocuments({
            skill: skill._id,
            topic: { $in: topicDocs.map(topic => topic._id) },
            questionType: "mcq",
            isActive: true
        });

        console.log("Questions available across these topics:", availableQuestions);

    } catch (error) {
        console.error("Question insertion failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

addQuestions();
