
require("dotenv").config();

const mongoose = require("mongoose");
const Skill = require("../models/Skill");
const SkillTopic = require("../models/SkillTopic");

const pythonTopics = [

    // Beginner
    { name: "Python Basics", level: "beginner", order: 1 },
    { name: "Variables and Data Types", level: "beginner", order: 2 },
    { name: "Operators", level: "beginner", order: 3 },
    { name: "Input and Output", level: "beginner", order: 4 },
    { name: "Conditional Statements", level: "beginner", order: 5 },
    { name: "Loops", level: "beginner", order: 6 },
    { name: "Loop Control Statements", level: "beginner", order: 7 },
    { name: "Strings", level: "beginner", order: 8 },
    { name: "Lists and Tuples", level: "beginner", order: 9 },

    // Intermediate
    { name: "Dictionaries and Sets", level: "intermediate", order: 1 },
    { name: "Functions", level: "intermediate", order: 2 },
    { name: "Modules and Packages", level: "intermediate", order: 3 },
    { name: "Exception Handling", level: "intermediate", order: 4 },
    { name: "File Handling", level: "intermediate", order: 5 },
    { name: "List Comprehensions", level: "intermediate", order: 6 },

    // Advanced
    { name: "Object-Oriented Programming", level: "advanced", order: 1 },
    { name: "Iterators and Generators", level: "advanced", order: 2 },
    { name: "Decorators", level: "advanced", order: 3 },
    { name: "Context Managers", level: "advanced", order: 4 }

];

async function seedPythonTopics() {

    try {

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected.");

        const pythonSkill = await Skill.findOne({
            name: "Python",
            isActive: true
        });

        if (!pythonSkill) {
            throw new Error("Active Python skill not found.");
        }

        const operations = pythonTopics.map(topic => ({
            updateOne: {
                filter: {
                    skill: pythonSkill._id,
                    name: topic.name
                },
                update: {
                    $set: {
                        level: topic.level,
                        order: topic.order,
                        isActive: true
                    }
                },
                upsert: true
            }
        }));

        const result = await SkillTopic.bulkWrite(operations);

        console.log("\nPYTHON TOPICS SEEDED SUCCESSFULLY");
        console.log("Skill:", pythonSkill.name);
        console.log("Topics processed:", pythonTopics.length);
        console.log("Inserted:", result.upsertedCount);
        console.log("Updated:", result.modifiedCount);

    } catch (error) {

        console.error("Python topic seeding failed:", error.message);

    } finally {

        await mongoose.disconnect();

    }
}

seedPythonTopics();
