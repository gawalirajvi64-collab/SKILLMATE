
const UserSkill = require("../models/UserSkill");
const SkillProficiency = require("../models/SkillProficiency");

// Calculate compatibility between two students
const calculateCompatibility = (studentA, studentB) => {

    let matchedSkills = [];

    const aCanTeach = studentA.skills.filter(
        skill => skill.type === "teach"
    );

    const aWantsToLearn = studentA.skills.filter(
        skill => skill.type === "learn"
    );

    const bCanTeach = studentB.skills.filter(
        skill => skill.type === "teach"
    );

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

    if (matchedSkills.length === 0) {
        return null;
    }

    // Keep the existing compatibility formula unchanged
    const score = Math.min(100, matchedSkills.length * 50);

    return {
        users: [studentA.user, studentB.user],
        matchedSkills,
        compatibilityScore: score
    };

};


// Find possible matches for a student
const findMatchesForStudent = async (studentId) => {

    const allUserSkills = await UserSkill.find()
        .populate("skill", "name category");

    const studentsMap = new Map();

    allUserSkills.forEach(userSkill => {

        if (!userSkill.skill) {
            return;
        }

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

    const currentStudent = studentsMap.get(studentId.toString());

    if (!currentStudent) {
        return [];
    }

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

    // Sort using the original compatibility score
    matches.sort(
        (a, b) => b.compatibilityScore - a.compatibilityScore
    );

    // Fetch assessment-derived proficiency separately
    const studentIds = [...studentsMap.keys()];
    const skillIds = [
        ...new Set(
            allUserSkills
                .filter(item => item.skill)
                .map(item => item.skill._id.toString())
        )
    ];

    const proficiencyRecords = await SkillProficiency.find({
        student: { $in: studentIds },
        skill: { $in: skillIds }
    }).select(
        "student skill latestScore currentLevel totalAssessments lastAssessedAt"
    );

    const proficiencyMap = new Map();

    proficiencyRecords.forEach(record => {

        const key = `${record.student.toString()}:${record.skill.toString()}`;

        proficiencyMap.set(key, {
            score: record.latestScore,
            level: record.currentLevel,
            totalAssessments: record.totalAssessments,
            lastAssessedAt: record.lastAssessedAt
        });

    });

    // Attach assessed proficiency of the matched teacher
    matches.forEach(match => {

        match.matchedSkills.forEach(item => {

            const key = `${item.teacher.toString()}:${item.skill.toString()}`;

            item.teacherAssessment = proficiencyMap.get(key) || null;

        });

    });

    return matches;

};


// Export functions
module.exports = {
    calculateCompatibility,
    findMatchesForStudent
};
