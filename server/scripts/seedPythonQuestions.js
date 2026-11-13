
const mongoose = require("mongoose");
require("dotenv").config();

const Skill = require("../models/Skill");
const SkillTopic = require("../models/SkillTopic");
const QuestionBank = require("../models/QuestionBank");

const questions = [

    // =========================
    // BEGINNER QUESTIONS
    // =========================

    {
        topic: "Python Basics",
        difficulty: "beginner",
        question: "Which of the following correctly describes Python?",
        options: [
            "A high-level programming language",
            "An operating system",
            "A database",
            "A web browser"
        ],
        correctAnswer: "A high-level programming language",
        explanation: "Python is a high-level, general-purpose programming language."
    },
    {
        topic: "Python Basics",
        difficulty: "beginner",
        question: "Which symbol is commonly used to write a single-line comment in Python?",
        options: ["//", "#", "/*", "--"],
        correctAnswer: "#",
        explanation: "Python uses the hash symbol (#) for single-line comments."
    },
    {
        topic: "Variables and Data Types",
        difficulty: "beginner",
        question: "Which of these is a valid Python variable name?",
        options: ["2name", "student_name", "student-name", "class"],
        correctAnswer: "student_name",
        explanation: "Variable names can contain letters, digits and underscores, but cannot start with a digit or use reserved keywords."
    },
    {
        topic: "Variables and Data Types",
        difficulty: "beginner",
        question: "What is the data type of the value 10 in Python?",
        options: ["float", "str", "int", "bool"],
        correctAnswer: "int",
        explanation: "Whole numbers without a decimal point are represented by the int type."
    },
    {
        topic: "Operators",
        difficulty: "beginner",
        question: "What is the result of 10 // 3 in Python?",
        options: ["3.33", "3", "1", "4"],
        correctAnswer: "3",
        explanation: "The // operator performs floor division and returns the quotient rounded down."
    },
    {
        topic: "Operators",
        difficulty: "beginner",
        question: "Which operator checks whether two values are equal?",
        options: ["=", "==", "!=", ":="],
        correctAnswer: "==",
        explanation: "The equality operator == compares two values."
    },
    {
        topic: "Input and Output",
        difficulty: "beginner",
        question: "Which function is used to accept input from a user?",
        options: ["print()", "input()", "read()", "scan()"],
        correctAnswer: "input()",
        explanation: "The input() function reads user input as a string."
    },
    {
        topic: "Input and Output",
        difficulty: "beginner",
        question: "Which function displays output on the screen?",
        options: ["display()", "show()", "print()", "output()"],
        correctAnswer: "print()",
        explanation: "The print() function displays values on the screen."
    },
    {
        topic: "Conditional Statements",
        difficulty: "beginner",
        question: "Which keyword begins a conditional statement in Python?",
        options: ["when", "if", "check", "switch"],
        correctAnswer: "if",
        explanation: "The if keyword executes a block when its condition is true."
    },
    {
        topic: "Loops",
        difficulty: "beginner",
        question: "Which loop is commonly used to iterate over a list?",
        options: ["for", "switch", "case", "define"],
        correctAnswer: "for",
        explanation: "A for loop iterates over elements of an iterable such as a list."
    },

    // =========================
    // INTERMEDIATE QUESTIONS
    // =========================

    {
        topic: "Dictionaries and Sets",
        difficulty: "intermediate",
        question: "Which data structure stores key-value pairs in Python?",
        options: ["List", "Tuple", "Dictionary", "Set"],
        correctAnswer: "Dictionary",
        explanation: "A dictionary stores data as key-value pairs."
    },
    {
        topic: "Dictionaries and Sets",
        difficulty: "intermediate",
        question: "What happens when a duplicate value is added to a set?",
        options: [
            "It creates a duplicate entry",
            "It raises an error",
            "The duplicate is ignored",
            "The entire set is deleted"
        ],
        correctAnswer: "The duplicate is ignored",
        explanation: "Sets store unique elements, so duplicate values are not added."
    },
    {
        topic: "Functions",
        difficulty: "intermediate",
        question: "Which keyword is used to define a function in Python?",
        options: ["function", "def", "fun", "define"],
        correctAnswer: "def",
        explanation: "The def keyword is used to define a function."
    },
    {
        topic: "Functions",
        difficulty: "intermediate",
        question: "What does the return statement do inside a function?",
        options: [
            "Repeats the function",
            "Stops Python completely",
            "Sends a value back to the caller",
            "Prints a value automatically"
        ],
        correctAnswer: "Sends a value back to the caller",
        explanation: "The return statement ends the function and sends a result back to its caller."
    },
    {
        topic: "Modules and Packages",
        difficulty: "intermediate",
        question: "Which keyword is used to include a module in Python?",
        options: ["include", "using", "import", "require"],
        correctAnswer: "import",
        explanation: "The import statement makes a module available in a Python program."
    },
    {
        topic: "Modules and Packages",
        difficulty: "intermediate",
        question: "Which module provides mathematical functions such as sqrt()?",
        options: ["random", "math", "os", "sys"],
        correctAnswer: "math",
        explanation: "The math module provides mathematical functions including sqrt()."
    },
    {
        topic: "Exception Handling",
        difficulty: "intermediate",
        question: "Which block handles an exception in Python?",
        options: ["try", "except", "finally", "All of these"],
        correctAnswer: "except",
        explanation: "The except block handles exceptions raised inside a try block."
    },
    {
        topic: "Exception Handling",
        difficulty: "intermediate",
        question: "Which exception occurs when dividing an integer by zero?",
        options: [
            "ValueError",
            "TypeError",
            "ZeroDivisionError",
            "IndexError"
        ],
        correctAnswer: "ZeroDivisionError",
        explanation: "Python raises ZeroDivisionError when a number is divided by zero."
    },
    {
        topic: "File Handling",
        difficulty: "intermediate",
        question: "Which file mode opens a file for reading?",
        options: ["w", "a", "r", "x"],
        correctAnswer: "r",
        explanation: "The r mode opens an existing file for reading."
    },
    {
        topic: "List Comprehensions",
        difficulty: "intermediate",
        question: "What does [x * 2 for x in [1, 2, 3]] produce?",
        options: [
            "[1, 2, 3]",
            "[2, 4, 6]",
            "[1, 4, 9]",
            "[2, 3, 4]"
        ],
        correctAnswer: "[2, 4, 6]",
        explanation: "The list comprehension multiplies every element by two."
    },

    // =========================
    // ADVANCED QUESTIONS
    // =========================

    {
        topic: "Object-Oriented Programming",
        difficulty: "advanced",
        question: "Which method is commonly used to initialize an object in Python?",
        options: ["__start__()", "__init__()", "__main__()", "__create__()"],
        correctAnswer: "__init__()",
        explanation: "The __init__() method initializes an object's attributes after it is created."
    },
    {
        topic: "Object-Oriented Programming",
        difficulty: "advanced",
        question: "What is inheritance in object-oriented programming?",
        options: [
            "Hiding all class methods",
            "Creating a class based on another class",
            "Deleting an object",
            "Converting a variable into a function"
        ],
        correctAnswer: "Creating a class based on another class",
        explanation: "Inheritance allows a child class to reuse and extend the functionality of a parent class."
    },
    {
        topic: "Object-Oriented Programming",
        difficulty: "advanced",
        question: "Which keyword refers to the current instance inside a Python instance method?",
        options: ["this", "self", "current", "object"],
        correctAnswer: "self",
        explanation: "self conventionally refers to the current instance of a class."
    },
    {
        topic: "Iterators and Generators",
        difficulty: "advanced",
        question: "Which keyword is used to produce a value from a generator?",
        options: ["return", "yield", "generate", "next"],
        correctAnswer: "yield",
        explanation: "The yield keyword produces a value and suspends the generator's execution."
    },
    {
        topic: "Iterators and Generators",
        difficulty: "advanced",
        question: "Which built-in function retrieves the next item from an iterator?",
        options: ["next()", "iter()", "range()", "item()"],
        correctAnswer: "next()",
        explanation: "The next() function retrieves the next item from an iterator."
    },
    {
        topic: "Decorators",
        difficulty: "advanced",
        question: "Which symbol is used to apply decorator syntax in Python?",
        options: ["#", "@", "$", "&"],
        correctAnswer: "@",
        explanation: "The @ symbol is used to apply a decorator to a function or class."
    },
    {
        topic: "Decorators",
        difficulty: "advanced",
        question: "What is the main purpose of a decorator?",
        options: [
            "To delete a function",
            "To modify or extend a function's behaviour",
            "To convert a function into a variable",
            "To stop a program"
        ],
        correctAnswer: "To modify or extend a function's behaviour",
        explanation: "Decorators wrap functions or classes to add or modify behaviour without directly changing their original code."
    },
    {
        topic: "Context Managers",
        difficulty: "advanced",
        question: "Which keyword is commonly used with a context manager?",
        options: ["with", "using", "manage", "open"],
        correctAnswer: "with",
        explanation: "The with statement manages setup and cleanup operations, such as closing a file."
    },
    {
        topic: "Context Managers",
        difficulty: "advanced",
        question: "Which method is called when entering a class-based context manager?",
        options: ["__start__()", "__enter__()", "__init__()", "__open__()"],
        correctAnswer: "__enter__()",
        explanation: "The __enter__() method runs when execution enters a with block."
    },
    {
        topic: "Context Managers",
        difficulty: "advanced",
        question: "Which method is called when leaving a class-based context manager?",
        options: ["__close__()", "__exit__()", "__finish__()", "__stop__()"],
        correctAnswer: "__exit__()",
        explanation: "The __exit__() method handles cleanup when execution leaves the with block."
    }

];

async function seedQuestions() {

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

            const question = new QuestionBank({
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

            await question.save();
            inserted++;
        }

        console.log("--------------------------------");
        console.log("PYTHON QUESTION BANK SEEDED");
        console.log("Total questions:", questions.length);
        console.log("Inserted:", inserted);
        console.log("Skipped (already existing):", skipped);
        console.log("--------------------------------");

    } catch (error) {

        console.error("Question seeding error:", error);

    } finally {

        await mongoose.disconnect();

    }
}

seedQuestions();
