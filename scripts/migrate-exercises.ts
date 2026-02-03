import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Types (Mirrored from src/types/fitness.ts) ---
// We define them here to avoid import issues in a standalone script
type MuscleGroup =
    | 'chest' | 'front_deltoid' | 'side_deltoid' | 'rear_deltoid' | 'biceps' | 'triceps'
    | 'forearms' | 'abs' | 'obliques' | 'quads' | 'hip_flexors' | 'adductors'
    | 'upper_back' | 'lats' | 'lower_back' | 'glutes' | 'hamstrings' | 'calves'
    | 'traps' | 'neck';

type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'plyometric' | 'core' | 'other';

// --- Load Data ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../src/data/exerciseLibrary.json');
const tsPath = path.resolve(__dirname, '../src/data/exercises.ts');

const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// We need to read the TS file and extract the array.
// Since we can't easily import TS in this environment without setup,
// we will use a regex to extract the array content or assume we can import it if we run with tsx.
// Let's try to import it dynamically. If that fails, we fallback to regex or manual parsing.
// Actually, since we are using npx tsx, we can import!
// But we need to handle the relative import path.
// Let's assume we can just import from the file.

// --- Mappings ---
const MUSCLE_MAP: Record<string, MuscleGroup> = {
    "Chest": "chest", "Pecs": "chest",
    "Triceps": "triceps", "Front Delts": "front_deltoid", "Side Delts": "side_deltoid", "Rear Delts": "rear_deltoid",
    "Lats": "lats", "Upper Back": "upper_back", "Traps": "traps",
    "Biceps": "biceps", "Forearms": "forearms",
    "Abs": "abs", "Core": "abs", "Obliques": "obliques", "Rectus Abdominis": "abs", "Transverse Abdominis": "abs",
    "Quads": "quads", "Quadriceps": "quads",
    "Hamstrings": "hamstrings", "Glutes": "glutes",
    "Calves": "calves",
    "Lower Back": "lower_back", "Spinal Erectors": "lower_back", "Spine": "lower_back",
    "Hip Flexors": "hip_flexors",
    "Adductors": "adductors",
    "Neck": "neck",
    "Spinal Stabilizers": 'lower_back'
};

const CATEGORY_MAP: Record<string, ExerciseCategory> = {
    "inner-body": "core",
    "upper-push": "strength",
    "upper-pull": "strength",
    "lower-body": "strength",
    "superficial-core": "core",
    "explosive-power": "plyometric",
    "forgotten-muscles": "other",
    "functional-strongman": "strength",
    "calisthenics": "strength",
    "rotational": "core",
    "hybrids": "strength",
    "cardio": "cardio",
    "flexibility": "flexibility",
    "animal-flow": "other"
};

async function migrate() {
    console.log('Starting migration...');

    // Dynamic import of the existing TS database
    // Note: We need to use valid file URL for Windows
    const tsFileUrl = 'file://' + tsPath.replace(/\\/g, '/');
    console.log(`Importing from ${tsFileUrl}`);

    let existingExercises = [];
    try {
        const mod = await import(tsFileUrl);
        existingExercises = mod.EXERCISE_DATABASE || [];
        console.log(`Loaded ${existingExercises.length} existing TS exercises.`);
    } catch (e) {
        console.error("Failed to import exercises.ts directly. Make sure to run with npx tsx.", e);
        // Fallback text parsing if needed, but strict valid TS is expected.
        process.exit(1);
    }

    const mergedExercises = new Map();

    // 1. Load TS Exercises (High Priority for Pattern/Muscle accuracy)
    existingExercises.forEach((ex: any) => {
        mergedExercises.set(ex.id, {
            ...ex,
            // Ensure default fields if missing
            description: ex.description || `Standard ${ex.name} movement.`,
            steps: ex.steps || [],
            variations: ex.variations || [],
            category: 'strength', // Default, will refine with JSON
            difficulty: 'Intermediate' // Default
        });
    });

    // 2. Load JSON Exercises
    // JSON structure: { categories: [], exercises: [] }
    // Only the 'exercises' array has the flat interactions, but 'categories' has the structure implies category.
    // Actually, the exercises array has a 'category' field which links back to category ID.

    const jsonExercises = jsonData.exercises || [];
    console.log(`Loaded ${jsonExercises.length} JSON exercises.`);

    jsonExercises.forEach((jsonEx: any) => {
        // Normalize ID
        const id = jsonEx.id.replace(/-/g, '_').toLowerCase(); // Bench-Press -> bench_press

        const mappedPrimary = (jsonEx.primaryMuscles || []).map((m: string) => MUSCLE_MAP[m] || 'abs').filter(Boolean); // simple fallback
        const mappedCategory = CATEGORY_MAP[jsonEx.category] || 'other';

        const existing = mergedExercises.get(id) || mergedExercises.get(jsonEx.id); // Check snake and kebab

        if (existing) {
            // Merge
            mergedExercises.set(existing.id, {
                ...existing,
                description: jsonEx.description?.length > existing.description.length ? jsonEx.description : existing.description,
                category: mappedCategory,
                difficulty: jsonEx.difficulty || existing.difficulty,
                // Keep existing muscles if present as they are typed, otherwise use mapped
                primaryMuscles: existing.primaryMuscles.length ? existing.primaryMuscles : mappedPrimary,
            });
        } else {
            // Add New
            mergedExercises.set(id, {
                id: id,
                name: jsonEx.name,
                primaryMuscles: mappedPrimary,
                secondaryMuscles: [], // Info missing in JSON array for most part
                equipment: (jsonEx.equipment || []).map((eq: string) => eq.toLowerCase().replace(' ', '_')).filter((_: unknown) => true), // approximate
                patterns: [], // Unknown from JSON
                contraindications: [],
                cues: [],
                description: jsonEx.description,
                steps: [],
                variations: [],
                category: mappedCategory,
                difficulty: jsonEx.difficulty || 'Intermediate',
                type: mappedCategory === 'plyometric' ? 'plyometric' : 'strength'
            });
        }
    });

    const finalArray = Array.from(mergedExercises.values());
    console.log(`Total merged exercises: ${finalArray.length}`);

    // Generate TS Content
    const fileContent = `import type { Exercise } from '@/types/fitness';

// Generated by scripts/migrate-exercises.ts
export const EXERCISE_DATABASE: Exercise[] = ${JSON.stringify(finalArray, null, 2)};

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_DATABASE.find(e => e.id === id);
}

export function getExercisesByMuscle(muscle: string): Exercise[] {
  return EXERCISE_DATABASE.filter(e =>
    e.primaryMuscles.includes(muscle as any) || e.secondaryMuscles.includes(muscle as any)
  );
}

export function getExercisesByEquipment(equipment: string[]): Exercise[] {
  return EXERCISE_DATABASE.filter(e =>
    e.equipment.some(eq => equipment.includes(eq))
  );
}

export function getExercisesByPattern(pattern: string): Exercise[] {
  return EXERCISE_DATABASE.filter(e => e.patterns.includes(pattern as any));
}
`;

    // Write with some regex cleanup to fix 'as any' casting that JSON.stringify breaks or just keep it simple?
    // JSON.stringify quotes keys. We might want to remove quotes from keys for cleaner TS, but valid JSON is valid JS/TS object literal.
    // We need to fix the Enum strings to match types if possible, but they are strings in JSON so it works.

    fs.writeFileSync(tsPath, fileContent);
    console.log(`Successfully wrote to ${tsPath}`);
}

migrate().catch(console.error);
