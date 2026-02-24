import * as fs from 'fs';
import * as path from 'path';
import { EXERCISE_DATABASE } from './src/data/exercises';

const libPath = path.join(process.cwd(), 'src', 'data', 'exerciseLibrary.json');
const libData = JSON.parse(fs.readFileSync(libPath, 'utf8'));

// Build a map of name -> {description, steps} from exerciseLibrary
const libMap = new Map();
libData.exercises.forEach((ex: any) => {
    libMap.set(ex.name.toLowerCase().trim(), {
        description: ex.description,
        steps: ex.steps
    });
});

let matched = 0;
let stillMissing: string[] = [];

// Apply updates to EXERCISE_DATABASE directly
EXERCISE_DATABASE.forEach(ex => {
    let needsUpdate = false;

    // Check if missing steps
    if (!ex.steps || ex.steps.length < 2) {
        needsUpdate = true;
    } else {
        ex.steps.forEach(s => { if (s.length < 15) needsUpdate = true; });
    }

    // Check if missing description
    if (!ex.description || ex.description.length < 30) {
        needsUpdate = true;
    }

    if (needsUpdate) {
        let match = libMap.get(ex.name.toLowerCase().trim());

        // Try loose matching if exact fails
        if (!match) {
            for (let [lname, ldata] of libMap.entries()) {
                if (lname.includes(ex.name.toLowerCase().trim()) || ex.name.toLowerCase().trim().includes(lname)) {
                    match = ldata;
                    break;
                }
            }
        }

        if (match) {
            ex.description = match.description || ex.description;
            ex.steps = match.steps || ex.steps;
            matched++;
        } else {
            stillMissing.push(ex.name);
        }
    }
});

console.log(`Matched ${matched} exercises from exerciseLibrary.json.`);
console.log(`Still missing ${stillMissing.length} exercises.\nHere they are:`);
stillMissing.forEach(name => console.log("- " + name));

// Now save back to exercises.ts
const tsPath = path.join(process.cwd(), 'src', 'data', 'exercises.ts');
const newTsContent = `import type { Exercise } from '@/types/fitness';\n\n// Generated automatically by migration script\nexport const EXERCISE_DATABASE: Exercise[] = ${JSON.stringify(EXERCISE_DATABASE, null, 2)};\n`;

fs.writeFileSync(tsPath, newTsContent, 'utf8');
console.log('Saved updated databases to exercises.ts');
