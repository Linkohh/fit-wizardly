const fs = require('fs');
const path = require('path');

const libPath = path.join(__dirname, 'src', 'data', 'exerciseLibrary.json');
const libData = JSON.parse(fs.readFileSync(libPath, 'utf8'));

// Convert exercises.ts to JS object (using simple regex/eval or just string manipulation)
// Actually, it's easier to use a TS runtime or pure string replacement, but since it's just raw data:
const tsPath = path.join(__dirname, 'src', 'data', 'exercises.ts');
let tsContent = fs.readFileSync(tsPath, 'utf8');

// Quick and dirty way to extract the array portion and parse it
const startIndex = tsContent.indexOf('[');
const endIndex = tsContent.lastIndexOf(']');
let arrayString = tsContent.substring(startIndex, endIndex + 1);

// It might have trailing commas or not be perfect JSON. 
// We are going to use Function constructor to evaluate it instead of JSON.parse, since it's a TS object literal.
let tsData;
try {
    tsData = new Function(`return ${arrayString};`)();
} catch (e) {
    console.error("Failed to parse exercises.ts:", e);
    process.exit(1);
}

// Build a map of name -> {description, steps} from exerciseLibrary
const libMap = new Map();
libData.exercises.forEach(ex => {
    libMap.set(ex.name.toLowerCase().trim(), {
        description: ex.description,
        steps: ex.steps
    });
});

let matched = 0;
let stillMissing = [];

tsData.forEach(ex => {
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
console.log(`Still missing ${stillMissing.length} exercises:`);
stillMissing.forEach(name => console.log("- " + name));

// Now serialize it back
// To keep it as a TS file, we can JSON.stringify it with indent 2.
const newTsContent = tsContent.substring(0, startIndex) + JSON.stringify(tsData, null, 2) + tsContent.substring(endIndex + 1);
fs.writeFileSync(tsPath + '.new', newTsContent, 'utf8');
