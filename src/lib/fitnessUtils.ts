import { WorkoutLog } from "@/types/fitness";

export function calculateVolume(log: WorkoutLog): number {
    return log.exercises.reduce((total, exercise) => {
        if (exercise.skipped) return total;

        const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
            if (!set.completed) return setTotal;
            return setTotal + (set.weight * set.reps);
        }, 0);

        return total + exerciseVolume;
    }, 0);
}
