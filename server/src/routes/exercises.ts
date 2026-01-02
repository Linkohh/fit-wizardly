import express from 'express';
import { EXERCISE_DATABASE } from '../../src/data/exercises.js';

const router = express.Router();

// Get all exercises
router.get('/', (req, res) => {
    try {
        const { muscle, equipment, pattern, search, limit = 50 } = req.query;

        let exercises = [...EXERCISE_DATABASE];

        // Filter by primary muscle
        if (muscle) {
            exercises = exercises.filter((ex) =>
                ex.primaryMuscles.includes(muscle as any)
            );
        }

        // Filter by equipment
        if (equipment) {
            const equipmentList = (equipment as string).split(',');
            exercises = exercises.filter((ex) =>
                ex.equipment.some((eq) => equipmentList.includes(eq))
            );
        }

        // Filter by movement pattern
        if (pattern) {
            exercises = exercises.filter((ex) =>
                ex.patterns.includes(pattern as any)
            );
        }

        // Search by name
        if (search) {
            const searchLower = (search as string).toLowerCase();
            exercises = exercises.filter((ex) =>
                ex.name.toLowerCase().includes(searchLower)
            );
        }

        // Limit results
        exercises = exercises.slice(0, Number(limit));

        res.json({
            count: exercises.length,
            total: EXERCISE_DATABASE.length,
            exercises,
        });
    } catch (error) {
        console.error('Error fetching exercises:', error);
        res.status(500).json({ error: 'Failed to fetch exercises' });
    }
});

// Get exercise by ID
router.get('/:id', (req, res) => {
    const exercise = EXERCISE_DATABASE.find((ex) => ex.id === req.params.id);

    if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(exercise);
});

// Get exercises by muscle group
router.get('/muscle/:muscle', (req, res) => {
    const exercises = EXERCISE_DATABASE.filter((ex) =>
        ex.primaryMuscles.includes(req.params.muscle as any) ||
        ex.secondaryMuscles.includes(req.params.muscle as any)
    );

    res.json({
        muscle: req.params.muscle,
        count: exercises.length,
        exercises,
    });
});

// Get available filters
router.get('/meta/filters', (_req, res) => {
    const muscles = new Set<string>();
    const equipment = new Set<string>();
    const patterns = new Set<string>();

    EXERCISE_DATABASE.forEach((ex) => {
        ex.primaryMuscles.forEach((m) => muscles.add(m));
        ex.secondaryMuscles.forEach((m) => muscles.add(m));
        ex.equipment.forEach((e) => equipment.add(e));
        ex.patterns.forEach((p) => patterns.add(p));
    });

    res.json({
        muscles: Array.from(muscles).sort(),
        equipment: Array.from(equipment).sort(),
        patterns: Array.from(patterns).sort(),
        totalExercises: EXERCISE_DATABASE.length,
    });
});

export default router;
