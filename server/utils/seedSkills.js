
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("../config/db");
const Skill = require("../models/Skill");

// Initial SkillBridge skill catalogue
const skills = [

    // Programming
    {
        name: "C++",
        category: "Programming",
        description: "Learn object-oriented programming and problem solving."
    },
    {
        name: "Python",
        category: "Programming",
        description: "Learn Python programming and automation."
    },
    {
        name: "Java",
        category: "Programming",
        description: "Learn Java programming and application development."
    },
    {
        name: "JavaScript",
        category: "Programming",
        description: "Learn programming for interactive web applications."
    },
    {
        name: "Web Development",
        category: "Programming",
        description: "Learn frontend and backend web development."
    },

    // AI and Data
    {
        name: "Artificial Intelligence",
        category: "AI & Data",
        description: "Explore AI concepts and intelligent applications."
    },
    {
        name: "Machine Learning",
        category: "AI & Data",
        description: "Learn machine learning concepts and algorithms."
    },
    {
        name: "Data Analytics",
        category: "AI & Data",
        description: "Learn to analyze and interpret data."
    },
    {
        name: "Data Science",
        category: "AI & Data",
        description: "Explore data analysis and statistical techniques."
    },

    // Design
    {
        name: "UI/UX Design",
        category: "Design",
        description: "Learn user interface and user experience design."
    },
    {
        name: "Graphic Design",
        category: "Design",
        description: "Learn visual communication and graphic design."
    },
    {
        name: "Video Editing",
        category: "Design",
        description: "Learn video editing and content creation."
    },

    // Business and Communication
    {
        name: "Public Speaking",
        category: "Communication",
        description: "Improve presentation and public speaking skills."
    },
    {
        name: "Communication Skills",
        category: "Communication",
        description: "Develop effective verbal and written communication."
    },
    {
        name: "Leadership",
        category: "Business",
        description: "Develop teamwork and leadership abilities."
    },
    {
        name: "Business Analysis",
        category: "Business",
        description: "Learn business requirements and problem analysis."
    },

    // Productivity
    {
        name: "Microsoft Excel",
        category: "Productivity",
        description: "Learn spreadsheets, formulas and data management."
    },
    {
        name: "PowerPoint",
        category: "Productivity",
        description: "Learn presentation design and delivery."
    },
    {
        name: "Git and GitHub",
        category: "Technology",
        description: "Learn version control and collaborative development."
    },
    {
        name: "Cybersecurity",
        category: "Technology",
        description: "Learn digital security and cyber safety fundamentals."
    }

];


// Insert skills into MongoDB
const seedSkills = async () => {

    try {

        await connectDB();

        for (const skill of skills) {

            await Skill.findOneAndUpdate(
                { name: skill.name },
                { $set: skill },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );

        }

        console.log("--------------------------------");
        console.log("Skill catalogue added successfully!");
        console.log(`Total skills: ${skills.length}`);
        console.log("--------------------------------");

        await mongoose.disconnect();

    } catch (error) {

        console.error("Skill Seeding Error:", error.message);
        await mongoose.disconnect();
        process.exit(1);

    }
};


seedSkills();
