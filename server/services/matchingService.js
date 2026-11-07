
const UserSkill = require("../models/UserSkill");

// Calculate compatibility between two students
const calculateCompatibility = (studentA, studentB) => {

    let matchedSkills = [];

    // Skills Student A can teach
    const aCanTeach = studentA.skills.filter(
        skill => skill.type === "teach"
    );

    // Skills Student A wants to learn
    const aWantsToLearn = studentA.skills.filter(
        skill => skill.type === "learn"
    );

    // Skills Student B can teach
    const bCanTeach = studentB.skills.filter(
        skill => skill.type === "teach"
    );

    // Skills Student B wants to learn
    const bWantsToLearn = studentB.skills.filter(
        skill => skill.type === "learn"
    );


    // Check whether Student A can teach Student B
    aCanTeach.forEach(teachSkill => {

        const matchingLearnSkill = bWantsToLearn.find(
            learnSkill =>
                learnSkill.skill.toString() === teachSkill.skill.toString()
        );

        if (matchingLearnSkill) {

            matchedSkills.push({
                skill: teachSkill.skill,
                teacher: studentA.user,
                learner: studentB.user
            });

        }

    });


    // Check whether Student B can teach Student A
    bCanTeach.forEach(teachSkill => {

        const matchingLearnSkill = aWantsToLearn.find(
            learnSkill =>
                learnSkill.skill.toString() === teachSkill.skill.toString()
        );

        if (matchingLearnSkill) {

            matchedSkills.push({
                skill: teachSkill.skill,
                teacher: studentB.user,
                learner: studentA.user
            });

        }

    });


    // No compatibility if there are no matching skills
    if (matchedSkills.length === 0) {
        return null;
    }


    // Calculate compatibility score
    const score = Math.min(100, matchedSkills.length * 50);


    return {
        users: [studentA.user, studentB.user],
        matchedSkills,
        compatibilityScore: score
    };

};


// Find possible matches for a student
const findMatchesForStudent = async (studentId) => {

    // Get all students' selected skills
    const allUserSkills = await UserSkill.find()
        .populate("skill", "name category");

    // Group skills by student
    const studentsMap = new Map();

    allUserSkills.forEach(userSkill => {

        const userId = userSkill.user.toString();

        if (!studentsMap.has(userId)) {

            studentsMap.set(userId, {
                user: userSkill.user,
                skills: []
            });

        }

        studentsMap.get(userId).skills.push({
            skill: userSkill.skill._id,
            type: userSkill.type,
            proficiency: userSkill.proficiency
        });

    });


    // Get current student's skills
    const currentStudent = studentsMap.get(studentId.toString());

    if (!currentStudent) {
        return [];
    }


    // Compare current student with other students
    let matches = [];

    studentsMap.forEach((otherStudent, otherId) => {

        if (otherId === studentId.toString()) {
            return;
        }

        const match = calculateCompatibility(
            currentStudent,
            otherStudent
        );

        if (match) {
            matches.push(match);
        }

    });


    // Sort matches by compatibility score
    matches.sort(
        (a, b) => b.compatibilityScore - a.compatibilityScore
    );

    return matches;

};


// Export functions
module.exports = {
    calculateCompatibility,
    findMatchesForStudent
};
