import { EXERCISE_DATABASE } from './src/data/exercises';

const flaggedExercises = [];

EXERCISE_DATABASE.forEach((ex) => {
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
        ex.steps.forEach((step) => {
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

console.log(`\n=== TS DATABASE ANALYSIS ===`);
console.log(`Total Exercises: ${EXERCISE_DATABASE.length}`);
console.log(`Flagged Exercises: ${flaggedExercises.length}\n`);

flaggedExercises.forEach(ex => {
    console.log(`- ${ex.name} (${ex.id}):`);
    ex.issues.forEach(i => console.log(`  * ${i}`));
});
