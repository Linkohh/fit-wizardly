const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'exerciseLibrary.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Criteria for "not descriptive":
// 1. No description or description is less than 20 characters
// 2. No steps or steps array is empty
// 3. Steps exist but are too brief (e.g. fewer than 2 steps, or steps themselves are very short)

const flaggedExercises = [];

data.exercises.forEach((ex, index) => {
    let issues = [];

    // Check description
    if (!ex.description || ex.description.trim() === '') {
        issues.push('Missing description');
    } else if (ex.description.length < 30) {
        issues.push(`Description too short (${ex.description.length} chars)`);
    }

    // Check steps
    if (!ex.steps || !Array.isArray(ex.steps) || ex.steps.length === 0) {
        issues.push('Missing step-by-step instructions');
    } else {
        if (ex.steps.length < 2) {
            issues.push(`Only ${ex.steps.length} step(s) provided`);
        }

        let hasShortStep = false;
        ex.steps.forEach((step, i) => {
            if (step.length < 15) {
                hasShortStep = true;
            }
        });

        if (hasShortStep) {
            issues.push('Contains very short/un-descriptive steps');
        }
    }

    if (issues.length > 0) {
        flaggedExercises.push({
            id: ex.id,
            name: ex.name,
            issues: issues
        });
    }
});

console.log(`\n=== PASS 1 ANALYSIS ===`);
console.log(`Total Exercises: ${data.exercises.length}`);
console.log(`Flagged Exercises: ${flaggedExercises.length}\n`);

flaggedExercises.forEach(ex => {
    console.log(`- ${ex.name} (${ex.id}):`);
    ex.issues.forEach(i => console.log(`  * ${i}`));
});

// PASS 2 (Double check logic internally, applying an even stricter character count limit for description to ensure we catch anything borderline)
console.log(`\n=== PASS 2 VERIFICATION (Strict Mode) ===`);
const strictFlagged = [];
data.exercises.forEach((ex, index) => {
    let issues = [];
    if (!ex.description || ex.description.length < 50) {
        issues.push('Description missing or too brief (< 50 chars)');
    }
    if (!ex.steps || !Array.isArray(ex.steps) || ex.steps.length < 3) {
        issues.push('Missing comprehensive steps (fewer than 3 steps)');
    }
    if (issues.length > 0) {
        strictFlagged.push({
            id: ex.id,
            name: ex.name,
            issues: issues
        });
    }
});

console.log(`Strict Flagged Exercises: ${strictFlagged.length}\n`);
// Only print the ones that were caught in strict but NOT in regular
const newInStrict = strictFlagged.filter(strictEx => !flaggedExercises.some(ex => ex.id === strictEx.id));
if (newInStrict.length > 0) {
    console.log(`Additional exercises caught with strict criteria:`);
    newInStrict.forEach(ex => {
        console.log(`- ${ex.name} (${ex.id}):`);
        ex.issues.forEach(i => console.log(`  * ${i}`));
    });
} else {
    console.log(`No additional exercises caught with strict criteria.`);
}

console.log('\nAnalysis Complete.');
